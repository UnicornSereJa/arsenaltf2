import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Weapon, WeaponSlot

# Сопоставление названий оружий с правильным кодом слота
FIXES = {
    'Shotgun': 'SHOTGUN',
    'B.A.S.E. Jumper': 'SECONDARY',
    'Panic Attack': 'SECONDARY',
    "Enthusiast's Timepiece": 'DISGUISE',
    'Quäckenbirdt': 'DISGUISE',
    'Cloak and Dagger': 'WATCH',
    'Dead Ringer': 'WATCH',
    'Sapper': 'PDA2',
    'Ap-Sap': 'PDA2',
    'Snack Attack': 'PDA2',
    'Red-Tape Recorder': 'PDA2',
}

def fix_slots():
    for name, slot_code in FIXES.items():
        try:
            weapon = Weapon.objects.get(name=name)
            slot = WeaponSlot.objects.get(code=slot_code)
            weapon.slot = slot
            weapon.save()
            print(f"✅ {name} → {slot.name_ru}")
        except Weapon.DoesNotExist:
            print(f"❌ {name} не найдено")
        except WeaponSlot.DoesNotExist:
            print(f"❌ Слот {slot_code} не существует")

if __name__ == "__main__":
    fix_slots()
    print("\n✅ Исправление завершено!")