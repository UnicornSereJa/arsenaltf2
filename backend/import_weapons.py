import os
import django
import requests
from bs4 import BeautifulSoup
from datetime import date, datetime
import re

# Настройка Django окружения
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Weapon, WeaponClass, WeaponSlot, WeaponReloadType, WeaponCreator, WeaponClassLink

# ============================================================
# ФУНКЦИИ ДЛЯ ПАРСИНГА
# ============================================================

def parse_wiki_date(value):
    if not value:
        return None
    text = " ".join(value.split())
    # ISO формат YYYY-MM-DD
    iso_match = re.search(r"\d{4}-\d{2}-\d{2}", text)
    if iso_match:
        return datetime.strptime(iso_match.group(0), "%Y-%m-%d").date()
    # Месяц день, год
    month_match = re.search(r"[A-Z][a-z]+ \d{1,2}, \d{4}", text)
    if month_match:
        return datetime.strptime(month_match.group(0), "%B %d, %Y").date()
    return None

def find_table_value(soup, label):
    label_cell = soup.find(lambda tag: tag.name == "td" and tag.get_text(" ", strip=True) == label)
    value_cell = label_cell.find_next_sibling("td") if label_cell else None
    return value_cell.get_text(" ", strip=True) if value_cell else None

# ============================================================
# ГЛАВНАЯ ФУНКЦИЯ ИМПОРТА
# ============================================================

def import_weapons():
    print("🚀 Начинаю импорт оружия из вики TF2...")

    # Создаём справочники, если их нет
    print("📋 Проверяю справочники...")
    
    # Классы
    classes = {
        'Scout': 'SCOUT', 'Soldier': 'SOLDIER', 'Pyro': 'PYRO',
        'Demoman': 'DEMO', 'Heavy': 'HEAVY', 'Engineer': 'ENGINEER',
        'Medic': 'MEDIC', 'Sniper': 'SNIPER', 'Spy': 'SPY'
    }
    for name, code in classes.items():
        WeaponClass.objects.get_or_create(code=code, defaults={'name_ru': name, 'name_en': name})
    print(f"   ✅ {WeaponClass.objects.count()} классов")

    # Слоты
    slots = {
        'PRIMARY': 'Основное', 'SECONDARY': 'Вторичное',
        'MELEE': 'Ближнее', 'PDA': 'КПК',
        'GRENADE': 'Граната', 'OTHER': 'Прочее'
    }
    for code, name_ru in slots.items():
        WeaponSlot.objects.get_or_create(code=code, defaults={'name_ru': name_ru, 'name_en': name_ru})
    print(f"   ✅ {WeaponSlot.objects.count()} слотов")

    # Типы перезарядки
    reload_types = {
        'none': ('Нет', 'None'),
        'magazine': ('Обойма', 'Magazine'),
        'timer': ('Таймер', 'Timer')
    }
    for code, (name_ru, name_en) in reload_types.items():
        WeaponReloadType.objects.get_or_create(code=code, defaults={'name_ru': name_ru, 'name_en': name_en})
    print(f"   ✅ {WeaponReloadType.objects.count()} типов перезарядки")

    # Создатели
    WeaponCreator.objects.get_or_create(code='valve', defaults={'name_ru': 'Valve', 'name_en': 'Valve'})
    WeaponCreator.objects.get_or_create(code='community', defaults={'name_ru': 'Сообщество', 'name_en': 'Community'})
    print(f"   ✅ {WeaponCreator.objects.count()} создателей")

    # Парсим вики
    print("🌐 Парсинг вики Team Fortress 2...")
    BASE_URL = "https://wiki.teamfortress.com"
    URL = f"{BASE_URL}/wiki/Weapons"
    
    response = requests.get(URL)
    soup = BeautifulSoup(response.content, "html.parser")
    
    tables = soup.find_all("table", {"class": "wikitable"})
    print(f"   Найдено {len(tables)} таблиц с оружием")

    weapon_count = 0
    skipped_count = 0

    for table in tables:
        for row in table.find_all("tr")[2:]:
            row_header = row.find("th")
            if not row_header:
                continue

            name_link = row_header.find("b")
            if not name_link:
                continue
            name_link = name_link.find_parent("a")
            if not name_link:
                continue

            name = name_link.text.strip()
            
            # Пропускаем уже существующие
            if Weapon.objects.filter(name=name).exists():
                skipped_count += 1
                continue

            print(f"   Обработка: {name}")
            href = name_link.get("href")
            
            # Загружаем страницу оружия
            try:
                weapon_page = requests.get(BASE_URL + href)
                weapon_soup = BeautifulSoup(weapon_page.content, "html.parser")
            except Exception as e:
                print(f"      ❌ Ошибка загрузки: {e}")
                continue

            # Извлекаем данные
            used_by_text = find_table_value(weapon_soup, "Used by:")
            used_by = [cls.strip() for cls in used_by_text.split(", ")] if used_by_text else []

            slot_text = find_table_value(weapon_soup, "Slot:")
            slot = slot_text.split(",")[0].strip() if slot_text else "OTHER"

            ammo_loaded = find_table_value(weapon_soup, "Ammo loaded:")
            magazine_size = None
            if ammo_loaded and ammo_loaded != "N/A":
                match = re.search(r"(\d+)", ammo_loaded)
                if match:
                    magazine_size = int(match.group(1))

            reload_type_text = find_table_value(weapon_soup, "Reload type:")
            reload_type = "none"
            if reload_type_text:
                if "magazine" in reload_type_text.lower():
                    reload_type = "magazine"
                elif "timer" in reload_type_text.lower():
                    reload_type = "timer"

            release_text = find_table_value(weapon_soup, "Released:")
            release_date = parse_wiki_date(release_text)
            year = release_date.year if release_date else 2007

            # Определяем создателя
            creator_code = 'valve'
            # Упрощённо: если в названии есть "Community" или "Fan" — считаем Community
            if 'Community' in name or 'Fan' in name:
                creator_code = 'community'

            # Создаём оружие
            try:
                slot_obj = WeaponSlot.objects.get(code=slot.upper()[:10])
                reload_obj = WeaponReloadType.objects.get(code=reload_type)
                creator_obj = WeaponCreator.objects.get(code=creator_code)

                weapon = Weapon.objects.create(
                    name=name,
                    slot=slot_obj,
                    reload_type=reload_obj,
                    creator=creator_obj,
                    magazine_size=magazine_size,
                    year_released=year,
                    is_deleted=False
                )

                # Привязываем классы
                for cls_name in used_by:
                    cls_code = classes.get(cls_name)
                    if cls_code:
                        class_obj, _ = WeaponClass.objects.get_or_create(
                            code=cls_code,
                            defaults={'name_ru': cls_name, 'name_en': cls_name}
                        )
                        WeaponClassLink.objects.get_or_create(
                            weapon=weapon,
                            class_code=class_obj
                        )

                weapon_count += 1
                print(f"      ✅ Добавлено: {name} ({year})")

            except Exception as e:
                print(f"      ❌ Ошибка создания: {e}")
                continue

    print(f"\n✅ Импорт завершён!")
    print(f"   Добавлено оружия: {weapon_count}")
    print(f"   Пропущено (уже есть): {skipped_count}")
    print(f"   Всего в БД: {Weapon.objects.count()}")

if __name__ == "__main__":
    import_weapons()