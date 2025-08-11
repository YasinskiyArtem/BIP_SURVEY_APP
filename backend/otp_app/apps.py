from django.apps import AppConfig


class OtpAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'otp_app'

    def ready(self):
        from .models import UserModel
        from django.db.models import F
        # Обновляем параметр otp_verified для всех пользователей при старте сервера
        UserModel.objects.update(otp_verified=False)
