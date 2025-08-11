from django.core.exceptions import ValidationError
from rest_framework import serializers
from otp_app.models import UserModel


class UserSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(required=False, allow_blank=True)
    second_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = UserModel
        fields = ['id', "first_name", "second_name", "last_name", 'age', 'gender', 'blood_type',
                  'email', 'password', 'otp_validate', 'otp_verified', 'otp_mode',
                  'otp_base32', 'otp_auth_url', 'is_superuser']
        #fields = '__all__'

        extra_kwargs = {
            'password': {'write_only': True},
            'first_name': {'max_length': 50},
            'second_name': {'max_length': 50},
            'last_name': {'max_length': 50},
            'email': {'max_length': 50},
        }

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        instance = self.Meta.model(**validated_data)
        instance.email = instance.email.lower()
        if password is not None:
            instance.set_password(password)
        instance.save()
        if len(instance.first_name) > 50 or len(instance.second_name) > 50 \
                or len(instance.last_name) > 50 or len(instance.email) > 100:
            raise ValidationError('Имя пользователя не может быть длиннее 50 символов.')
        return instance

    def update(self, instance, validated_data):
        # Если пользователь не администратор
        user = self.Meta.model(**validated_data)
        if len(user.first_name) > 50 \
                or len(user.last_name) > 50 or len(user.email) > 100:
            raise ValidationError('Имя пользователя не может быть длиннее 50 символов.')
        print(validated_data)
        if not user.is_superuser:  # Проверка: является ли пользователь администратором
            if 'id' in validated_data:
                raise serializers.ValidationError({"username": "Изменение id пользователя запрещено."})
            if 'otp_verified' in validated_data or 'otp_validated' in validated_data\
                    or 'otp_base32' in validated_data or 'otp_auth_url' in validated_data:
                raise serializers.ValidationError({"email": "Изменение otp полей запрещено."})

        # Обновляем остальные поля
        return super().update(instance, validated_data)
