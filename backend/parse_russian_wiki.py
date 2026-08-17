import os
import django
import requests
from bs4 import BeautifulSoup
import time
import re

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Weapon, WeaponClass, WeaponSlot, WeaponCreator, WeaponClassLink, WeaponReloadType

BASE_URL = "https://wiki.teamfortress.com"

# Сопоставление русских названий классов с кодами
CLASS_MAP = {
    "Разведчик": "SCOUT",
    "Солдат": "SOLDIER",
    "Поджигатель": "PYRO",
    "Подрывник": "DEMO",
    "Пулемётчик": "HEAVY",
    "Инженер": "ENGINEER",
    "Медик": "MEDIC",
    "Снайпер": "SNIPER",
    "Шпион": "SPY",
}

# Сопоставление русских названий слотов с кодами
SLOT_MAP = {
    "Основное": "PRIMARY",
    "Дополнительное": "SECONDARY",
    "Ближний бой": "MELEE",
    "КПК": "PDA",
    "Постройка": "PDA",
    "Дополнительное оружие": "SECONDARY",
    "Рука": "OTHER",
}

# Сопоставление русских названий типов перезарядки с кодами
RELOAD_MAP = {
    "Одиночный": "magazine",
    "Одиночная": "magazine",
    "Восстановление": "timer",
    "Нет": "none",
}

def get_or_create_slot(slot_name):
    """Находит или создаёт слот по русскому названию"""
    code = SLOT_MAP.get(slot_name)
    if not code:
        code = slot_name.upper().replace(" ", "_")
    slot, _ = WeaponSlot.objects.get_or_create(code=code, defaults={"name_ru": slot_name, "name_en": slot_name})
    return slot

def get_or_create_creator(creator_name):
    """Находит или создаёт создателя"""
    if not creator_name or creator_name.lower() == "valve":
        creator, _ = WeaponCreator.objects.get_or_create(code="valve", defaults={"name_ru": "Valve", "name_en": "Valve"})
        return creator
    
    # Если имя слишком длинное — сокращаем
    if len(creator_name) > 30:
        code = creator_name[:30].lower().replace(" ", "_")
    else:
        code = creator_name.lower().replace(" ", "_")
    
    creator, _ = WeaponCreator.objects.get_or_create(code=code, defaults={"name_ru": creator_name, "name_en": creator_name})
    return creator

def get_or_create_reload_type(reload_type_ru):
    """Находит или создаёт тип перезарядки по русскому названию"""
    code = RELOAD_MAP.get(reload_type_ru, "none")
    reload_type, _ = WeaponReloadType.objects.get_or_create(code=code, defaults={"name_ru": reload_type_ru, "name_en": reload_type_ru})
    return reload_type

def parse_weapon_page(weapon):
    """Парсит русскую страницу оружия и обновляет запись в БД"""
    english_name = weapon.name
    url = f"{BASE_URL}/wiki/{english_name}/ru"
    
    try:
        response = requests.get(url, timeout=10)
        if response.status_code != 200:
            print(f"❌ {english_name}: страница не найдена (HTTP {response.status_code})")
            return
        
        soup = BeautifulSoup(response.content, "html.parser")
        
        # 1. Русское название (из заголовка)
        title_tag = soup.find("h1", {"class": "firstHeading"})
        if title_tag:
            weapon.name_ru = title_tag.text.strip()
        
        # 2. Изображение
        img = soup.find("img", {"width": "250"})
        if not img:
            img = soup.find("img", {"class": "thumbimage"})
        if img and img.get("src"):
            weapon.image_url = BASE_URL + img["src"]
        
        # 3. Парсинг инфобокса (таблицы)
        infobox = soup.find("table", {"class": "infobox"})
        if not infobox:
            print(f"⚠️ {english_name}: инфобокс не найден")
            weapon.save()
            return
        
        rows = infobox.find_all("tr")
        for row in rows:
            cells = row.find_all("td")
            if len(cells) < 2:
                continue
            
            label = cells[0].get_text(" ", strip=True).replace(":", "")
            value = cells[1].get_text(" ", strip=True)
            
            if label == "Используется":
                # Классы
                classes = [cls.strip() for cls in value.split(",")]
                weapon.classes.clear()
                for cls_name in classes:
                    code = CLASS_MAP.get(cls_name)
                    if code:
                        try:
                            cls_obj = WeaponClass.objects.get(code=code)
                            WeaponClassLink.objects.get_or_create(weapon=weapon, class_code=cls_obj)
                        except WeaponClass.DoesNotExist:
                            pass
            
            elif label == "Слот":
                weapon.slot = get_or_create_slot(value)
            
            elif label == "Тип перезарядки":
                # Если есть значение, сохраняем
                if value:
                    weapon.reload_type_ru = value
                    weapon.reload_type = get_or_create_reload_type(value)
                else:
                    weapon.reload_type_ru = "Нет"
                    weapon.reload_type = get_or_create_reload_type("Нет")
            
            elif label == "Создатель(-и)":
                # Проверяем, что значение не пустое и не является "—"
                if value and value != "—" and len(value) < 50:
                    weapon.creator = get_or_create_creator(value)
                else:
                    # Если создатель не указан — ставим Valve
                    weapon.creator = get_or_create_creator("Valve")
        
        # 4. Год выпуска (если есть в тексте)
        release_text = find_table_value(soup, "Выпущено")
        if release_text:
            year_match = re.search(r"\b(20\d{2})\b", release_text)
            if year_match:
                weapon.year_released = int(year_match.group(1))
        
        weapon.save()
        print(f"✅ {english_name} → {weapon.name_ru} ({weapon.reload_type_ru})")
        
    except requests.exceptions.RequestException as e:
        print(f"❌ {english_name}: сетевая ошибка — {e}")
    except Exception as e:
        print(f"❌ {english_name}: ошибка — {e}")

def find_table_value(soup, label):
    """Ищет значение в таблице по подписи"""
    for td in soup.find_all("td"):
        if label in td.get_text(" ", strip=True):
            next_td = td.find_next_sibling("td")
            if next_td:
                return next_td.get_text(" ", strip=True)
    return None

def parse_all_weapons():
    weapons = Weapon.objects.all()
    print(f"🔍 Найдено {weapons.count()} оружий")
    
    for i, weapon in enumerate(weapons):
        print(f"\n[{i+1}/{weapons.count()}] Обработка: {weapon.name}")
        parse_weapon_page(weapon)
        time.sleep(1)
    
    print("\n✅ Парсинг завершён!")

if __name__ == "__main__":
    parse_all_weapons()