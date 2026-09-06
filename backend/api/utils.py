from .models import WeaponClass

def compare_weapon(guessed, target):
    result = {}

    guessed_classes = set(guessed.classes.values_list('code', flat=True))
    target_classes = set(target.classes.values_list('code', flat=True))
    intersection = guessed_classes & target_classes

    if len(target_classes) == 1 and intersection:
        match = 'exact'
    elif len(target_classes) > 1 and intersection:
        match = 'partial'
    else:
        match = 'none'

    result['class'] = {
        'guessed': list(guessed_classes),
        'target': list(target_classes),
        'match': match
    }

    result['slot'] = {
        'guessed': guessed.slot.name_ru,
        'target': target.slot.name_ru,
        'match': 'exact' if guessed.slot_id == target.slot_id else 'none'
    }

    g_mag = guessed.magazine_size
    t_mag = target.magazine_size
    result['magazine'] = {
        'guessed': g_mag,
        'target': t_mag,
        'match': 'exact' if g_mag == t_mag else 'none'
    }

    result['reload'] = {
        'guessed': guessed.reload_type.name_ru,
        'target': target.reload_type.name_ru,
        'match': 'exact' if guessed.reload_type_id == target.reload_type_id else 'none'
    }

    g_year = guessed.year_released
    t_year = target.year_released
    if g_year == t_year:
        match = 'exact'
        direction = None
    elif g_year < t_year:
        match = 'none'
        direction = 'up'
    else:
        match = 'none'
        direction = 'down'

    result['year'] = {
        'guessed': g_year,
        'target': t_year,
        'match': match,
        'direction': direction
    }

    result['creator'] = {
        'guessed': guessed.creator.name_ru,
        'target': target.creator.name_ru,
        'match': 'exact' if guessed.creator_id == target.creator_id else 'none'
    }

    return result