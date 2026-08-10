from django.db import models
from django.utils import timezone

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
    code = models.CharField(max_length=20, primary_key=True, verbose_name="Код")
    name_ru = models.CharField(max_length=50, verbose_name="Название (рус)")
    name_en = models.CharField(max_length=50, verbose_name="Название (англ)")

    class Meta:
        verbose_name = "Создатель оружия"
        verbose_name_plural = "Создатели оружия"

    def __str__(self):
        return self.name_ru


class User(models.Model):
    id = models.BigAutoField(primary_key=True)
    login = models.CharField(max_length=50, unique=True, verbose_name="Логин")
    email = models.EmailField(max_length=100, unique=True, verbose_name="Email")
    password_hash = models.CharField(max_length=128, verbose_name="Хеш пароля")
    is_blocked = models.BooleanField(default=False, verbose_name="Заблокирован")
    registered_at = models.DateTimeField(default=timezone.now, verbose_name="Дата регистрации")

    class Meta:
        verbose_name = "Пользователь"
        verbose_name_plural = "Пользователи"

    def __str__(self):
        return self.login


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
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Пользователь")
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