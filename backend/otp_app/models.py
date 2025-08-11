import uuid

from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.contrib.auth.models import AbstractUser
from .managers import UserManager
from rest_framework.authtoken.models import Token
from django.utils import timezone
from rest_framework.authtoken.models import Token
from django.contrib.sessions.models import Session
from django.core.validators import MinValueValidator
GENDER_CHOICES = [
    ('M', 'Male'),
    ('F', 'Female'),
]

BLOOD_TYPE_CHOICES = [
    ('I', 'first'),
    ('II', 'second'),
    ('III', 'third'),
    ('IV', 'fourth')
]


def get_user_token(request):
    auth_header = request.headers.get('Authorization')
    # print(auth_header
    if not auth_header or not auth_header.startswith('Token'):
        return False

    # Извлекаем токен из заголовка
    token_key = auth_header.split()[1]
    return token_key

def get_user_id(request):

    token_key = get_user_token(request)

    try:
        # Находим пользователя по токену
        token = Token.objects.get(key=token_key)
        user_id = token.user_id
        return user_id
    except Token.DoesNotExist:
        return False
    if not auth_header or not auth_header.startswith('Token'):
        return False

    # Извлекаем токен из заголовка
    token_key = auth_header.split()[1]
    return token_key

class UserModel(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False) #PK
    first_name = models.CharField(max_length=50, default=False) #Имя
    second_name = models.CharField(max_length=50, default=False) #Фамилия
    last_name = models.CharField(max_length=50, default=False) #Отчество
    age = models.IntegerField(validators=[MinValueValidator(16)]) #возраст
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default=False) #Пол
    blood_type = models.CharField(max_length=10, choices=BLOOD_TYPE_CHOICES, default=False) #Тип крови
    email = models.EmailField(max_length=100, unique=True) #почта
    password = models.CharField(max_length=32) #пароль
    otp_mode = models.BooleanField(default=False) #режим второй аутентификации
    otp_verified = models.BooleanField(default=False) #поле подтверждения второй аутентификации
    otp_validate = models.BooleanField(default=False) #поле подверждения вкл вт. аутент.
    otp_base32 = models.CharField(max_length=255, null=True) #код для подключения вт. аутент.
    otp_auth_url = models.CharField(max_length=255, null=True) #ссылка для qr-кода вт.аутент
    is_active = models.BooleanField(default=True) #поле активности
    username = None
    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']


    def __str__(self):
        return self.email


#123456789012345678901234567890123456789012345678901