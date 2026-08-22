import os
import django
# Одноразовый скрипт. Решает проблему с мультикласс и жучками/часами шпиона
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Weapon, WeaponSlot, WeaponReloadType, WeaponCreator, WeaponClass, WeaponClassLink

MISSING_WEAPONS = [
    {
        "name": "Shotgun",
        "slot": "SHOTGUN",
        "reload_type": "magazine",
        "creator": "valve",
        "magazine_size": 6,
        "year_released": 2007,
        "classes": ["Soldier", "Pyro", "Heavy", "Engineer"]
    },
    {
        "name": "B.A.S.E. Jumper",
        "slot": "SECONDARY",
        "reload_type": "timer",
        "creator": "valve",
        "magazine_size": None,
        "year_released": 2014,
        "classes": ["Soldier", "Demoman"]
    },
    {
        "name": "Panic Attack",
        "slot": "SECONDARY",
        "reload_type": "magazine",
        "creator": "valve",
        "magazine_size": 4,
        "year_released": 2014,
        "classes": ["Soldier", "Pyro", "Heavy", "Engineer"]
    },
    {
        "name": "Enthusiast's Timepiece",
        "slot": "DISGUISE",
        "reload_type": "timer",
        "creator": "valve",
        "magazine_size": None,
        "year_released": 2012,
        "classes": ["Spy"]
    },
    {
        "name": "Quäckenbirdt",
        "slot": "DISGUISE",
        "reload_type": "timer",
        "creator": "valve",
        "magazine_size": None,
        "year_released": 2012,
        "classes": ["Spy"]
    },
    {
        "name": "Cloak and Dagger",
        "slot": "WATCH",
        "reload_type": "timer",
        "creator": "valve",
        "magazine_size": None,
        "year_released": 2009,
        "classes": ["Spy"]
    },
    {
        "name": "Dead Ringer",
        "slot": "WATCH",
        "reload_type": "timer",
        "creator": "valve",
        "magazine_size": None,
        "year_released": 2009,
        "classes": ["Spy"]
    },
    {
        "name": "Sapper",
        "slot": "PDA2",
        "reload_type": "timer",
        "creator": "valve",
        "magazine_size": None,
        "year_released": 2007,
        "classes": ["Spy"]
    },
    {
        "name": "Ap-Sap",
        "slot": "PDA2",
        "reload_type": "timer",
        "creator": "valve",
        "magazine_size": None,
        "year_released": 2011,
        "classes": ["Spy"]
    },
    {
        "name": "Snack Attack",
        "slot": "PDA2",
        "reload_type": "timer",
        "creator": "valve",
        "magazine_size": None,
        "year_released": 2011,
        "classes": ["Spy"]
    },
    {
        "name": "Red-Tape Recorder",
        "slot": "PDA2",
        "reload_type": "timer",
        "creator": "valve",
        "magazine_size": None,
        "year_released": 2011,
        "classes": ["Spy"]
    },
]

# Сопоставление названий классов
CLASS_MAP = {
    "Scout": "SCOUT", "Soldier": "SOLDIER", "Pyro": "PYRO",
    "Demoman": "DEMO", "Heavy": "HEAVY", "Engineer": "ENGINEER",
    "Medic": "MEDIC", "Sniper": "SNIPER", "Spy": "SPY"
}

def add_missing_weapons():
    added = 0
    skipped = 0

    for data in MISSING_WEAPONS:
        # Проверяем, есть ли уже такое оружие
        if Weapon.objects.filter(name=data["name"]).exists():
            print(f"⏭️ {data['name']} уже существует, пропускаем")
            skipped += 1
            continue

        try:
            slot = WeaponSlot.objects.get(code=data["slot"])
            reload_type = WeaponReloadType.objects.get(code=data["reload_type"])
            creator = WeaponCreator.objects.get(code=data["creator"])

            weapon = Weapon.objects.create(
                name=data["name"],
                slot=slot,
                reload_type=reload_type,
                creator=creator,
                magazine_size=data["magazine_size"],
                year_released=data["year_released"],
                is_deleted=False
            )

            # Добавляем классы
            for class_name in data["classes"]:
                class_code = CLASS_MAP.get(class_name)
                if class_code:
                    class_obj, _ = WeaponClass.objects.get_or_create(
                        code=class_code,
                        defaults={'name_ru': class_name, 'name_en': class_name}
                    )
                    WeaponClassLink.objects.get_or_create(
                        weapon=weapon,
                        class_code=class_obj
                    )

            added += 1
            print(f"✅ {data['name']} добавлен")

        except Exception as e:
            print(f"❌ Ошибка при добавлении {data['name']}: {e}")

    print(f"\n✅ Готово! Добавлено: {added}, Пропущено (уже есть): {skipped}")

if __name__ == "__main__":
    add_missing_weapons()