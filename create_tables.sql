-- ============================================================
-- БАЗА ДАННЫХ: arsenaltf2
-- СУБД: MySQL 8.0
-- ОПИСАНИЕ: Все таблицы для игры "Арсенал TF2"
-- ============================================================

-- Выбираем базу данных
USE arsenaltf2;

-- ============================================================
-- 1. СПРАВОЧНИКИ (обозначающие сущности)
-- ============================================================

-- 1.1. Класс оружия
CREATE TABLE IF NOT EXISTS api_weaponclass (
    code VARCHAR(10) PRIMARY KEY,
    name_ru VARCHAR(50) NOT NULL,
    name_en VARCHAR(50) NOT NULL,
    color VARCHAR(7) NULL,
    icon VARCHAR(50) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 1.2. Слот оружия
CREATE TABLE IF NOT EXISTS api_weaponslot (
    code VARCHAR(10) PRIMARY KEY,
    name_ru VARCHAR(50) NOT NULL,
    name_en VARCHAR(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 1.3. Тип перезарядки
CREATE TABLE IF NOT EXISTS api_weaponreloadtype (
    code VARCHAR(20) PRIMARY KEY,
    name_ru VARCHAR(50) NOT NULL,
    name_en VARCHAR(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 1.4. Создатель оружия
CREATE TABLE IF NOT EXISTS api_weaponcreator (
    code VARCHAR(20) PRIMARY KEY,
    name_ru VARCHAR(50) NOT NULL,
    name_en VARCHAR(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 2. ОСНОВНЫЕ СУЩНОСТИ
-- ============================================================

-- 2.1. Пользователь (кастомная модель, совместимая с Django)
CREATE TABLE IF NOT EXISTS api_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    login VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(128) NOT NULL,        -- Django хранит хеш здесь
    is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
    registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_staff BOOLEAN NOT NULL DEFAULT FALSE,
    is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
    last_login DATETIME NULL,
    date_joined DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2.2. Оружие
CREATE TABLE IF NOT EXISTS api_weapon (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slot_id VARCHAR(10) NOT NULL,
    reload_type_id VARCHAR(20) NOT NULL,
    creator_id VARCHAR(20) NOT NULL,
    magazine_size INT NULL,
    year_released INT NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_weapon_slot FOREIGN KEY (slot_id) REFERENCES api_weaponslot(code),
    CONSTRAINT fk_weapon_reload FOREIGN KEY (reload_type_id) REFERENCES api_weaponreloadtype(code),
    CONSTRAINT fk_weapon_creator FOREIGN KEY (creator_id) REFERENCES api_weaponcreator(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2.3. Связь оружия с классами (M:N)
CREATE TABLE IF NOT EXISTS api_weaponclasslink (
    weapon_id BIGINT NOT NULL,
    class_code VARCHAR(10) NOT NULL,
    PRIMARY KEY (weapon_id, class_code),
    CONSTRAINT fk_wcl_weapon FOREIGN KEY (weapon_id) REFERENCES api_weapon(id) ON DELETE CASCADE,
    CONSTRAINT fk_wcl_class FOREIGN KEY (class_code) REFERENCES api_weaponclass(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2.4. Игровая сессия
CREATE TABLE IF NOT EXISTS api_gamesession (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    weapon_id BIGINT NOT NULL,
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at DATETIME NULL,
    result VARCHAR(10) NULL,
    attempts_used INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 6,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES api_user(id) ON DELETE CASCADE,
    CONSTRAINT fk_session_weapon FOREIGN KEY (weapon_id) REFERENCES api_weapon(id),
    CONSTRAINT chk_session_result CHECK (result IN ('win', 'loss', NULL)),
    CONSTRAINT chk_session_status CHECK (status IN ('active', 'finished'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2.5. Попытка
CREATE TABLE IF NOT EXISTS api_attempt (
    session_id BIGINT NOT NULL,
    attempt_no INT NOT NULL,
    input_text VARCHAR(100) NOT NULL,
    guessed_weapon_id BIGINT NULL,
    comparison_result JSON NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (session_id, attempt_no),
    CONSTRAINT fk_attempt_session FOREIGN KEY (session_id) REFERENCES api_gamesession(id) ON DELETE CASCADE,
    CONSTRAINT fk_attempt_weapon FOREIGN KEY (guessed_weapon_id) REFERENCES api_weapon(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 3. ИНДЕКСЫ (для оптимизации)
-- ============================================================

CREATE INDEX idx_api_weapon_slot ON api_weapon(slot_id);
CREATE INDEX idx_api_weapon_reload ON api_weapon(reload_type_id);
CREATE INDEX idx_api_weapon_creator ON api_weapon(creator_id);
CREATE INDEX idx_api_weapon_name ON api_weapon(name);

CREATE INDEX idx_api_wcl_weapon ON api_weaponclasslink(weapon_id);
CREATE INDEX idx_api_wcl_class ON api_weaponclasslink(class_code);

CREATE INDEX idx_api_session_user ON api_gamesession(user_id);
CREATE INDEX idx_api_session_weapon ON api_gamesession(weapon_id);
CREATE INDEX idx_api_session_status ON api_gamesession(status);

CREATE INDEX idx_api_attempt_session ON api_attempt(session_id);
CREATE INDEX idx_api_attempt_weapon ON api_attempt(guessed_weapon_id);

-- ============================================================
-- 4. ТЕСТОВЫЕ ДАННЫЕ
-- ============================================================

-- 4.1. Справочник классов
INSERT INTO api_weaponclass (code, name_ru, name_en, color, icon) VALUES
('SCOUT',  'Разведчик',  'Scout',  '#CF7336', '🧢'),
('SOLDIER','Солдат',     'Soldier', '#C14C34', '🪖'),
('PYRO',   'Поджигатель','Pyro',   '#F48037', '🔥'),
('DEMO',   'Подрывник',  'Demoman', '#C5A059','💣'),
('HEAVY',  'Пулемётчик', 'Heavy',  '#C67B30', '⚙️'),
('ENGINEER','Инженер',   'Engineer','#C5A059','🔧'),
('MEDIC',  'Медик',      'Medic',  '#F4C4C4', '💉'),
('SNIPER', 'Снайпер',    'Sniper', '#686868', '🎯'),
('SPY',    'Шпион',      'Spy',    '#A7A7A7', '🕵️');

-- 4.2. Справочник слотов
INSERT INTO api_weaponslot (code, name_ru, name_en) VALUES
('PRIMARY',   'Основное',    'Primary'),
('SECONDARY', 'Вторичное',   'Secondary'),
('MELEE',     'Ближнее',     'Melee'),
('PDA',       'КПК / Постройка', 'PDA'),
('GRENADE',   'Граната',     'Grenade');

-- 4.3. Справочник типов перезарядки
INSERT INTO api_weaponreloadtype (code, name_ru, name_en) VALUES
('none',     'Нет',      'None'),
('magazine', 'Обойма',   'Magazine'),
('timer',    'Таймер',   'Timer');

-- 4.4. Справочник создателей
INSERT INTO api_weaponcreator (code, name_ru, name_en) VALUES
('valve',     'Valve',     'Valve'),
('community', 'Сообщество','Community');

-- 4.5. Оружие (образцы)
INSERT INTO api_weapon (name, slot_id, reload_type_id, creator_id, magazine_size, year_released, is_deleted) VALUES
('Rocket Launcher',  'PRIMARY',  'magazine', 'valve',     4,   2007, FALSE),
('Scattergun',       'PRIMARY',  'magazine', 'valve',     6,   2007, FALSE),
('Sniper Rifle',     'PRIMARY',  'magazine', 'valve',     1,   2007, FALSE),
('Medi Gun',         'SECONDARY','timer',    'valve',     NULL, 2007, FALSE),
('Jarate',           'SECONDARY','timer',    'community', NULL, 2009, FALSE),
('Frying Pan',       'MELEE',    'none',     'community', NULL, 2010, FALSE),
('Gunboats',         'SECONDARY','none',     'valve',     NULL, 2009, FALSE);

-- 4.6. Связь оружия с классами
INSERT INTO api_weaponclasslink (weapon_id, class_code) VALUES
((SELECT id FROM api_weapon WHERE name = 'Rocket Launcher'), 'SOLDIER'),
((SELECT id FROM api_weapon WHERE name = 'Scattergun'), 'SCOUT'),
((SELECT id FROM api_weapon WHERE name = 'Sniper Rifle'), 'SNIPER'),
((SELECT id FROM api_weapon WHERE name = 'Medi Gun'), 'MEDIC'),
((SELECT id FROM api_weapon WHERE name = 'Jarate'), 'SNIPER'),
((SELECT id FROM api_weapon WHERE name = 'Frying Pan'), 'SCOUT'),
((SELECT id FROM api_weapon WHERE name = 'Frying Pan'), 'SOLDIER'),
((SELECT id FROM api_weapon WHERE name = 'Frying Pan'), 'PYRO'),
((SELECT id FROM api_weapon WHERE name = 'Frying Pan'), 'DEMO'),
((SELECT id FROM api_weapon WHERE name = 'Frying Pan'), 'HEAVY'),
((SELECT id FROM api_weapon WHERE name = 'Frying Pan'), 'ENGINEER'),
((SELECT id FROM api_weapon WHERE name = 'Frying Pan'), 'MEDIC'),
((SELECT id FROM api_weapon WHERE name = 'Frying Pan'), 'SNIPER'),
((SELECT id FROM api_weapon WHERE name = 'Frying Pan'), 'SPY'),
((SELECT id FROM api_weapon WHERE name = 'Gunboats'), 'SOLDIER');

-- 4.7. Пользователи
INSERT INTO api_user (login, email, password, is_blocked, registered_at, is_active, is_staff, is_superuser) VALUES
('testuser', 'test@test.com', 'pbkdf2_sha256$260000$abc123', FALSE, NOW(), TRUE, FALSE, FALSE),
('admin', 'admin@example.com', 'pbkdf2_sha256$260000$abc456', FALSE, NOW(), TRUE, TRUE, TRUE);

-- 4.8. Игровые сессии
INSERT INTO api_gamesession (user_id, weapon_id, started_at, finished_at, result, attempts_used, max_attempts, status) VALUES
(
    (SELECT id FROM api_user WHERE login = 'testuser'),
    (SELECT id FROM api_weapon WHERE name = 'Rocket Launcher'),
    NOW(), NOW(), 'win', 3, 6, 'finished'
);

-- 4.9. Попытки
INSERT INTO api_attempt (session_id, attempt_no, input_text, guessed_weapon_id, comparison_result, created_at) VALUES
(
    (SELECT id FROM api_gamesession LIMIT 1),
    1,
    'Scattergun',
    (SELECT id FROM api_weapon WHERE name = 'Scattergun'),
    '{"class":"partial","slot":"exact","magazine":"exact","reload":"none","year":"below","creator":"exact"}',
    NOW()
);

-- ============================================================
-- КОНЕЦ СКРИПТА
-- ============================================================