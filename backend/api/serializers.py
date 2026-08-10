from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import *

class WeaponClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeaponClass
        fields = '__all__'


class WeaponSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeaponSlot
        fields = '__all__'


class WeaponReloadTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeaponReloadType
        fields = '__all__'


class WeaponCreatorSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeaponCreator
        fields = '__all__'


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'login', 'email', 'is_blocked', 'registered_at']
        read_only_fields = ['id', 'registered_at']


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['id', 'login', 'email', 'password']

    def create(self, validated_data):
        validated_data['password_hash'] = make_password(validated_data.pop('password'))
        return super().create(validated_data)


class WeaponSerializer(serializers.ModelSerializer):
    slot_code = serializers.CharField(source='slot.code', read_only=True)
    reload_type_code = serializers.CharField(source='reload_type.code', read_only=True)
    creator_code = serializers.CharField(source='creator.code', read_only=True)
    classes = WeaponClassSerializer(many=True, read_only=True)

    class Meta:
        model = Weapon
        fields = [
            'id', 'name', 'slot', 'slot_code', 'reload_type', 'reload_type_code',
            'creator', 'creator_code', 'magazine_size', 'year_released',
            'is_deleted', 'classes'
        ]


class WeaponWriteSerializer(serializers.ModelSerializer):
    class_code_list = serializers.ListField(child=serializers.CharField(), write_only=True)

    class Meta:
        model = Weapon
        fields = [
            'id', 'name', 'slot', 'reload_type', 'creator',
            'magazine_size', 'year_released', 'class_code_list'
        ]

    def create(self, validated_data):
        class_codes = validated_data.pop('class_code_list', [])
        weapon = Weapon.objects.create(**validated_data)
        for code in class_codes:
            try:
                weapon_class = WeaponClass.objects.get(code=code)
                WeaponClassLink.objects.create(weapon=weapon, class_code=weapon_class)
            except WeaponClass.DoesNotExist:
                # Можно добавить валидацию, но для простоты пропускаем
                pass
        return weapon


class GameSessionSerializer(serializers.ModelSerializer):
    user_login = serializers.CharField(source='user.login', read_only=True)
    weapon_name = serializers.CharField(source='weapon.name', read_only=True)
    attempts_left = serializers.IntegerField(read_only=True)

    class Meta:
        model = GameSession
        fields = [
            'id', 'user', 'user_login', 'weapon', 'weapon_name',
            'started_at', 'finished_at', 'result', 'attempts_used',
            'max_attempts', 'status', 'attempts_left'
        ]
        read_only_fields = ['id', 'started_at']


class AttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attempt
        fields = '__all__'
        read_only_fields = ['created_at']


class ComparisonResultSerializer(serializers.Serializer):
    class_ = serializers.DictField()
    slot = serializers.DictField()
    magazine = serializers.DictField()
    reload = serializers.DictField()
    year = serializers.DictField()
    creator = serializers.DictField()