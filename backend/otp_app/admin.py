from django import forms
from django.contrib import admin
from django.contrib.auth.models import Group
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import ReadOnlyPasswordHashField
from django.core.exceptions import ValidationError
from .models import UserModel

class UserCreationForm(forms.ModelForm):
    """A form for creating new users. Includes all the required
    fields, plus a repeated password."""

    password1 = forms.CharField(label="Password", widget=forms.PasswordInput)
    password2 = forms.CharField(
        label="Password confirmation", widget=forms.PasswordInput
    )

    class Meta:
        model = UserModel
        fields = ["email"]

    def clean_password2(self):
        # Check that the two password entries match
        password1 = self.cleaned_data.get("password1")
        password2 = self.cleaned_data.get("password2")
        if password1 and password2 and password1 != password2:
            raise ValidationError("Passwords don't match")
        return password2

    def save(self, commit=True):
        # Save the provided password in hashed format
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password1"])
        if commit:
            user.save()
        return user


class UserChangeForm(forms.ModelForm):
    """A form for updating users. Includes all the fields on
    the user, but replaces the password field with admin's
    disabled password hash display field.
    """

    password = ReadOnlyPasswordHashField()

    class Meta:
        model = UserModel
        fields = ["email", "password", "is_active"]


class UserAdmin(BaseUserAdmin):
    list_display = (
        'email', 'first_name', 'second_name', 'last_name', 'age',
        'gender', 'blood_type', 'is_active', 'otp_mode', 'otp_verified', 'otp_validate'
    )  # Поля, которые будут отображаться в списке
    search_fields = ('email', 'first_name', 'second_name')  # Поля для поиска
    list_filter = ('is_active', 'otp_mode', 'gender', 'blood_type', 'otp_validate')  # Фильтры по полям
    ordering = ('email',)  # Сортировка по email
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'second_name', 'last_name', 'age', 'gender', 'blood_type')}),
        ('OTP Settings', {'fields': ('otp_mode', 'otp_verified', 'otp_validate', 'otp_base32', 'otp_auth_url')}),
        ('Permissions', {'fields': ('is_active',)}),
    )  # Поля, которые можно редактировать в форме

    # Отключение поля пароля, чтобы не было видно хэша
    def get_fieldsets(self, request, obj=None):
        if not obj:
            return self.add_fieldsets
        return super().get_fieldsets(request, obj)

    # Эта функция используется для отображения пустого пароля при создании пользователя
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2'),
        }),
    )

    def save_model(self, request, obj, form, change):
        if change:
            obj.set_password(form.cleaned_data['password'])
        super().save_model(request, obj, form, change)


# Now register the new UserAdmin...
admin.site.register(UserModel, UserAdmin)
# ... and, since we're not using Django's built-in permissions,
# unregister the Group model from admin.
admin.site.unregister(Group)