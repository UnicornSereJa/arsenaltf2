from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import serializers
from django.contrib.auth import authenticate


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'login'

    def validate(self, attrs):
        login = attrs.get('login')
        password = attrs.get('password')

        if login and password:
            user = authenticate(request=self.context.get('request'),
                                username=login, password=password)
            if not user:
                raise serializers.ValidationError('Неверный логин или пароль')
        else:
            raise serializers.ValidationError('Требуется логин и пароль')

        data = super().validate(attrs)
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer