from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import serializers
from django.contrib.auth import authenticate


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'login'

    def validate(self, attrs):
        print("🔍 CustomTokenObtainPairSerializer.validate() called")  # ← Добавить
        login = attrs.get('login')
        password = attrs.get('password')
        print(f"🔍 login={login}, password={password}")  # ← Добавить

        if login and password:
            user = authenticate(request=self.context.get('request'),
                                username=login, password=password)
            print(f"🔍 user after authenticate: {user}")  # ← Добавить
            if not user:
                raise serializers.ValidationError('Неверный логин или пароль')
        else:
            raise serializers.ValidationError('Требуется логин и пароль')

        return super().validate(attrs)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer