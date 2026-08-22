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
    "Разведчиком": "SCOUT",
    "разведчик": "SCOUT",
    "разведчиком": "SCOUT",
    "Солдат": "SOLDIER",
    "Солдатом": "SOLDIER",
    "солдат": "SOLDIER",
    "солдатом": "SOLDIER",
    "Поджигатель": "PYRO",
    "Поджигателем": "PYRO",
    "поджигатель": "PYRO",
    "поджигателем": "PYRO",
    "Подрывник": "DEMO",
    "Подрывником": "DEMO",
    "подрывник": "DEMO",
    "подрывником": "DEMO",
    "Пулемётчик": "HEAVY",
    "Пулемётчиком": "HEAVY",
    "пулемётчик": "HEAVY",
    "пулемётчиком": "HEAVY",
    "Пулеметчик": "HEAVY",
    "Пулеметчиком": "HEAVY",
    "пулеметчик": "HEAVY",
    "пулеметчиком": "HEAVY",
    "Инженер": "ENGINEER",
    "Инженером": "ENGINEER",
    "инженер": "ENGINEER",
    "инженером": "ENGINEER",
    "Медик": "MEDIC",
    "Медиком": "MEDIC",
    "медик": "MEDIC",
    "медиком": "MEDIC",
    "Снайпер": "SNIPER",
    "Снайпером": "SNIPER",
    "снайпер": "SNIPER",
    "снайпером": "SNIPER",
    "Шпион": "SPY",
    "Шпионом": "SPY",
    "шпион": "SPY",
    "шпионом": "SPY",
}

SLOT_MAP = {
    "Основное": "PRIMARY",
    "Дополнительное": "SECONDARY",
    "Ближний бой": "MELEE",
    "КПК": "PDA",
    "Постройка": "PDA",
    "Дополнительное оружие": "SECONDARY",
    "Рука": "OTHER",
}

RELOAD_MAP = {
    "Обойма": "magazine",
    "Одиночный": "single",
    "Одиночная": "single",
    "Без перезарядки": "none",
    "Нет": "none",
    "Восстановление": "timer",
}

def get_all_classes_except(exclude_list=None):
    """Возвращает список всех классов, кроме указанных"""
    all_codes = set()
    for key in CLASS_MAP:
        all_codes.add(CLASS_MAP[key])
    all_codes = list(all_codes)
    
    if exclude_list:
        exclude_codes = []
        for exclude_name in exclude_list:
            for key, code in CLASS_MAP.items():
                if key.lower() in exclude_name.lower():
                    exclude_codes.append(code)
                    break
        all_codes = [code for code in all_codes if code not in exclude_codes]
    
    return all_codes

def get_or_create_slot(slot_name):
    # Извлекаем только название слота до скобок
    if "(" in slot_name:
        slot_name = slot_name.split("(")[0].strip()
    
    code = SLOT_MAP.get(slot_name)
    if not code:
        code = slot_name.upper().replace(" ", "_")
    
    slot, _ = WeaponSlot.objects.get_or_create(
        code=code, 
        defaults={"name_ru": slot_name, "name_en": slot_name}
    )
    return slot

def get_or_create_creator(creator_name):
    if not creator_name or creator_name.lower() == "valve":
        creator, _ = WeaponCreator.objects.get_or_create(code="valve", defaults={"name_ru": "Valve", "name_en": "Valve"})
        return creator
    
    if len(creator_name) > 30:
        code = creator_name[:30].lower().replace(" ", "_")
    else:
        code = creator_name.lower().replace(" ", "_")
    
    creator, _ = WeaponCreator.objects.get_or_create(code=code, defaults={"name_ru": creator_name, "name_en": creator_name})
    return creator

def get_or_create_reload_type(reload_type_ru):
    original_value = reload_type_ru
    if "(" in reload_type_ru and ")" in reload_type_ru:
        reload_type_ru = reload_type_ru.split("(")[0].strip()
    
    code = RELOAD_MAP.get(reload_type_ru, "none")
    reload_type, _ = WeaponReloadType.objects.get_or_create(
        code=code,
        defaults={"name_ru": original_value, "name_en": original_value}
    )
    return reload_type

def parse_weapon_page(weapon):
    english_name = weapon.name
    url = f"{BASE_URL}/wiki/{english_name}/ru"
    
    try:
        response = requests.get(url, timeout=10)
        if response.status_code != 200:
            print(f"❌ {english_name}: страница не найдена (HTTP {response.status_code})")
            return
        
        soup = BeautifulSoup(response.content, "html.parser")
        
        title_tag = soup.find("h1", {"class": "firstHeading"})
        if title_tag:
            weapon.name_ru = title_tag.text.strip()
        
        img = soup.find("img", {"width": "250"})
        if not img:
            img = soup.find("img", {"class": "thumbimage"})
        if img and img.get("src"):
            weapon.image_url = BASE_URL + img["src"]
        
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
                classes_text = value
                print(f"   📌 Классы для {english_name}: {classes_text}")
                
                weapon.classes.clear()
                
                # Проверяем на "Всеми классами"
                if "Всеми классами" in classes_text or "Всеми" in classes_text:
                    exclude_classes = []
                    if "кроме" in classes_text:
                        exclude_match = re.search(r"кроме\s+([а-яА-ЯёЁ\s,]+)", classes_text)
                        if exclude_match:
                            exclude_text = exclude_match.group(1).strip()
                            exclude_classes = [cls.strip() for cls in exclude_text.split(",")]
                    
                    all_codes = get_all_classes_except(exclude_classes)
                    for code in all_codes:
                        try:
                            cls_obj = WeaponClass.objects.get(code=code)
                            WeaponClassLink.objects.get_or_create(weapon=weapon, class_code=cls_obj)
                            print(f"      ✅ Добавлен класс {cls_obj.name_ru} -> {code}")
                        except WeaponClass.DoesNotExist:
                            print(f"      ❌ Класс {code} не найден в БД")
                else:
                    classes = [cls.strip() for cls in classes_text.split(",")]
                    for cls_name in classes:
                        code = CLASS_MAP.get(cls_name)
                        if code:
                            try:
                                cls_obj = WeaponClass.objects.get(code=code)
                                WeaponClassLink.objects.get_or_create(weapon=weapon, class_code=cls_obj)
                                print(f"      ✅ Добавлен класс {cls_name} -> {code}")
                            except WeaponClass.DoesNotExist:
                                print(f"      ❌ Класс {cls_name} не найден в БД")
                        else:
                            print(f"      ⚠️ Неизвестный класс: {cls_name}")
            
            elif label == "Слот":
                weapon.slot = get_or_create_slot(value)
            
            elif label == "Тип перезарядки":
                if value:
                    weapon.reload_type_ru = value
                    weapon.reload_type = get_or_create_reload_type(value)
                else:
                    weapon.reload_type_ru = "Нет"
                    weapon.reload_type = get_or_create_reload_type("Нет")
            
            elif label == "Создатель(-и)":
                if value and value != "—" and len(value) < 50:
                    weapon.creator = get_or_create_creator(value)
                else:
                    weapon.creator = get_or_create_creator("Valve")
        
        release_text = find_table_value(soup, "Выпущено")
        if release_text:
            year_match = re.search(r"\b(20\d{2})\b", release_text)
            if year_match:
                weapon.year_released = int(year_match.group(1))
        
        weapon.save()
        print(f"✅ {english_name} → {weapon.name_ru} (классов: {weapon.classes.count()})")
        
    except requests.exceptions.RequestException as e:
        print(f"❌ {english_name}: сетевая ошибка — {e}")
    except Exception as e:
        print(f"❌ {english_name}: ошибка — {e}")

def find_table_value(soup, label):
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