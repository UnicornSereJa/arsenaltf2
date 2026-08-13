from django.contrib import admin
from django.contrib.auth.models import Group
from .models import *

# ============================================================
# ОТКЛЮЧАЕМ СТАНДАРТНУЮ МОДЕЛЬ Group (чтобы не дублировалась)
# ============================================================
try:
    admin.site.unregister(Group)
except admin.sites.NotRegistered:
    pass

# ============================================================
# КАСТОМНАЯ МОДЕЛЬ ПОЛЬЗОВАТЕЛЯ (api.User) — БЕЗ UserAdmin
# ============================================================

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    """Упрощённая админка для кастомной модели User"""
    list_display = ('id', 'login', 'email', 'is_blocked', 'registered_at')
    search_fields = ('login', 'email')
    list_filter = ('is_blocked',)
    list_editable = ('is_blocked',)
    ordering = ('login',)
    
    fieldsets = (
        (None, {'fields': ('login', 'password_hash')}),
        ('Персональная информация', {'fields': ('email',)}),
        ('Статус', {'fields': ('is_blocked',)}),
        ('Важные даты', {'fields': ('registered_at',)}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('login', 'email', 'password_hash'),
        }),
    )


# ============================================================
# ОСТАЛЬНЫЕ МОДЕЛИ
# ============================================================

@admin.register(WeaponClass)
class WeaponClassAdmin(admin.ModelAdmin):
    list_display = ('code', 'name_ru', 'name_en', 'color')
    search_fields = ('code', 'name_ru', 'name_en')


@admin.register(WeaponSlot)
class WeaponSlotAdmin(admin.ModelAdmin):
    list_display = ('code', 'name_ru', 'name_en')
    search_fields = ('code', 'name_ru', 'name_en')


@admin.register(WeaponReloadType)
class WeaponReloadTypeAdmin(admin.ModelAdmin):
    list_display = ('code', 'name_ru', 'name_en')
    search_fields = ('code', 'name_ru', 'name_en')


@admin.register(WeaponCreator)
class WeaponCreatorAdmin(admin.ModelAdmin):
    list_display = ('code', 'name_ru', 'name_en')
    search_fields = ('code', 'name_ru', 'name_en')


@admin.register(Weapon)
class WeaponAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'slot', 'reload_type', 'creator', 'magazine_size', 'year_released', 'is_deleted')
    list_filter = ('slot', 'reload_type', 'creator', 'is_deleted')
    search_fields = ('name',)
    filter_horizontal = ('classes',)


@admin.register(WeaponClassLink)
class WeaponClassLinkAdmin(admin.ModelAdmin):
    list_display = ('weapon', 'class_code')
    search_fields = ('weapon__name', 'class_code__name_ru')


@admin.register(GameSession)
class GameSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'weapon', 'started_at', 'finished_at', 'result', 'attempts_used', 'max_attempts', 'status')
    list_filter = ('status', 'result')
    search_fields = ('user__login', 'weapon__name')
    readonly_fields = ('started_at',)


@admin.register(Attempt)
class AttemptAdmin(admin.ModelAdmin):
    list_display = ('session', 'attempt_no', 'input_text', 'guessed_weapon', 'created_at')
    search_fields = ('input_text', 'session__user__login')
    readonly_fields = ('created_at',)