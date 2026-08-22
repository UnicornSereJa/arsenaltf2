from django.db import models
from django.contrib.auth.models import BaseUserManager
from django.utils import timezone


# ============================================================
# ОСТАЛЬНЫЕ МОДЕЛИ (WeaponClass, WeaponSlot, WeaponReloadType, WeaponCreator)
# ============================================================

class WeaponClass(models.Model):
    code = models.CharField(max_length=10, primary_key=True, verbose_name="Код")
    name_ru = models.CharField(max_length=50, verbose_name="Название (рус)")
    name_en = models.CharField(max_length=50, verbose_name="Название (англ)")
    color = models.CharField(max_length=7, null=True, blank=True, verbose_name="Цвет")
    icon = models.CharField(max_length=50, null=True, blank=True, verbose_name="Иконка")

    class Meta:
        verbose_name = "Класс оружия"
        verbose_name_plural = "Классы оружия"

    def __str__(self):
        return self.name_ru


class WeaponSlot(models.Model):
    code = models.CharField(max_length=10, primary_key=True, verbose_name="Код")
    name_ru = models.CharField(max_length=50, verbose_name="Название (рус)")
    name_en = models.CharField(max_length=50, verbose_name="Название (англ)")

    class Meta:
        verbose_name = "Слот оружия"
        verbose_name_plural = "Слоты оружия"

    def __str__(self):
        return self.name_ru


class WeaponReloadType(models.Model):
    code = models.CharField(max_length=20, primary_key=True, verbose_name="Код")
    name_ru = models.CharField(max_length=50, verbose_name="Название (рус)")
    name_en = models.CharField(max_length=50, verbose_name="Название (англ)")

    class Meta:
        verbose_name = "Тип перезарядки"
        verbose_name_plural = "Типы перезарядки"

    def __str__(self):
        return self.name_ru


class WeaponCreator(models.Model):
    code = models.CharField(max_length=250, primary_key=True, verbose_name="Код")
    name_ru = models.CharField(max_length=250, verbose_name="Название (рус)")
    name_en = models.CharField(max_length=250, verbose_name="Название (англ)")

    class Meta:
        verbose_name = "Создатель оружия"
        verbose_name_plural = "Создатели оружия"

    def __str__(self):
        return self.name_ru


# ============================================================
# МЕНЕДЖЕР ПОЛЬЗОВАТЕЛЯ (ИСПРАВЛЕН)
# ============================================================

class UserManager(BaseUserManager):
    def get_by_natural_key(self, username):
        return self.get(login=username)

    def create_user(self, login, email, password=None, **extra_fields):
        if not login:
            raise ValueError('Логин обязателен')
        if not email:
            raise ValueError('Email обязателен')
        email = self.normalize_email(email)
        user = self.model(login=login, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, login, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(login, email, password, **extra_fields)


# ============================================================
# МОДЕЛЬ ПОЛЬЗОВАТЕЛЯ
# ============================================================

class User(models.Model):
    id = models.BigAutoField(primary_key=True)
    login = models.CharField(max_length=50, unique=True, verbose_name="Логин")
    email = models.EmailField(max_length=100, unique=True, verbose_name="Email")
    password_hash = models.CharField(max_length=128, verbose_name="Хеш пароля")
    is_blocked = models.BooleanField(default=False, verbose_name="Заблокирован")
    registered_at = models.DateTimeField(default=timezone.now, verbose_name="Дата регистрации")
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)

    USERNAME_FIELD = 'login'
    REQUIRED_FIELDS = ['email']

    objects = UserManager()

    @property
    def is_anonymous(self):
        return False

    @property
    def is_authenticated(self):
        return True

    def set_password(self, raw_password):
        from django.contrib.auth.hashers import make_password
        self.password_hash = make_password(raw_password)

    def check_password(self, raw_password):
        from django.contrib.auth.hashers import check_password
        return check_password(raw_password, self.password_hash)

    def has_module_perms(self, app_label):
        """Проверка прав доступа к модулю"""
        return self.is_superuser or self.is_staff

    def has_perm(self, perm, obj=None):
        """Проверка прав доступа к объекту"""
        return self.is_superuser or self.is_staff

    class Meta:
        verbose_name = "Пользователь"
        verbose_name_plural = "Пользователи"

    def __str__(self):
        return self.login

# ============================================================
# ОСТАЛЬНЫЕ МОДЕЛИ (Weapon, WeaponClassLink, GameSession, Attempt)
# ============================================================

class Weapon(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True, verbose_name="Название")
    slot = models.ForeignKey(WeaponSlot, on_delete=models.PROTECT, verbose_name="Слот")
    reload_type = models.ForeignKey(WeaponReloadType, on_delete=models.PROTECT, verbose_name="Тип перезарядки")
    creator = models.ForeignKey(WeaponCreator, on_delete=models.PROTECT, verbose_name="Создатель")
    magazine_size = models.IntegerField(null=True, blank=True, verbose_name="Патронов в обойме")
    year_released = models.IntegerField(verbose_name="Год выхода")
    is_deleted = models.BooleanField(default=False, verbose_name="Удалено")
    classes = models.ManyToManyField(WeaponClass, through='WeaponClassLink', verbose_name="Классы")
    image_url = models.URLField(max_length=500, null=True, blank=True)  # ← 
    name_ru = models.CharField(max_length=100, null=True, blank=True)   # ← Пнгшки + русификатор
    reload_type_ru = models.CharField(max_length=50, null=True, blank=True)  # ← 
    class Meta:
        verbose_name = "Оружие"
        verbose_name_plural = "Оружие"

    def __str__(self):
        return self.name


class WeaponClassLink(models.Model):
    weapon = models.ForeignKey(Weapon, on_delete=models.CASCADE, verbose_name="Оружие")
    class_code = models.ForeignKey(WeaponClass, on_delete=models.CASCADE, verbose_name="Класс")

    class Meta:
        unique_together = ('weapon', 'class_code')
        verbose_name = "Принадлежность к классу"
        verbose_name_plural = "Принадлежности к классам"

    def __str__(self):
        return f"{self.weapon.name} → {self.class_code.name_ru}"


class GameSession(models.Model):
    STATUS_CHOICES = [
        ('active', 'Активна'),
        ('finished', 'Завершена'),
    ]
    RESULT_CHOICES = [
        ('win', 'Победа'),
        ('loss', 'Поражение'),
    ]

    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, verbose_name="Пользователь")
    weapon = models.ForeignKey(Weapon, on_delete=models.PROTECT, verbose_name="Загаданное оружие")
    started_at = models.DateTimeField(default=timezone.now, verbose_name="Время начала")
    finished_at = models.DateTimeField(null=True, blank=True, verbose_name="Время окончания")
    result = models.CharField(max_length=10, choices=RESULT_CHOICES, null=True, blank=True, verbose_name="Результат")
    attempts_used = models.IntegerField(default=0, verbose_name="Использовано попыток")
    max_attempts = models.IntegerField(default=6, verbose_name="Максимум попыток")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', verbose_name="Статус")

    class Meta:
        verbose_name = "Игровая сессия"
        verbose_name_plural = "Игровые сессии"

    def __str__(self):
        return f"Сессия #{self.id} - {self.user.login}"

    @property
    def attempts_left(self):
        return self.max_attempts - self.attempts_used


class Attempt(models.Model):
    session = models.ForeignKey(GameSession, on_delete=models.CASCADE, verbose_name="Сессия")
    attempt_no = models.IntegerField(verbose_name="Номер попытки")
    input_text = models.CharField(max_length=100, verbose_name="Введённый текст")
    guessed_weapon = models.ForeignKey(Weapon, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Угаданное оружие")
    comparison_result = models.JSONField(verbose_name="Результат сравнения")
    created_at = models.DateTimeField(default=timezone.now, verbose_name="Время создания")

    class Meta:
        unique_together = ('session', 'attempt_no')
        verbose_name = "Попытка"
        verbose_name_plural = "Попытки"

    def __str__(self):
        return f"Попытка #{self.attempt_no} в сессии #{self.session.id}"