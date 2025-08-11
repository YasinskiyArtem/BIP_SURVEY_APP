
from rest_framework.permissions import BasePermission
from otp_app.models import UserModel, get_user_id


class IsAuthenticatedAndVerified(BasePermission):

    #    Кастомное разрешение, проверяющее, что пользователь аутентифицирован и прошел вторую аутентификацию
    def has_permission(self, request, view):
        user_id = get_user_id(request)
        if not user_id:
            print('loh false')
            return False  # Если user_id не передан, отклоняем доступ


        try:
            # Ищем пользователя по переданному user_id
            user = UserModel.objects.get(id=user_id)
            print(user.is_active)
            print(user.otp_verified)
            print(user.email)
            print(user.is_authenticated)
        except UserModel.DoesNotExist:
            return False  # Если пользователь не найден, отклоняем доступ


        return bool(user.is_active and user.otp_verified and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        print('1')
        return True


