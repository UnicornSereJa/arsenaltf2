from django.contrib import admin
from .models import *

admin.site.register(WeaponClass)
admin.site.register(WeaponSlot)
admin.site.register(WeaponReloadType)
admin.site.register(WeaponCreator)
admin.site.register(Weapon)
admin.site.register(WeaponClassLink)
admin.site.register(GameSession)
admin.site.register(Attempt)
admin.site.register(User)