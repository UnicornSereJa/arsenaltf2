# Бэкенд (сборка)
FROM python:3.10-slim AS backend
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .

# Сборка статики
ENV DB_ENGINE=django.db.backends.sqlite3
ENV DB_NAME=/tmp/db.sqlite3
RUN python manage.py collectstatic --noinput

# Фронтенд (сборка)
FROM node:18-slim AS frontend
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Финальный образ
FROM python:3.10-slim
WORKDIR /app

# Устанавливаем зависимости в финальном образе
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем код бэкенда и статику
COPY --from=backend /app /app

# Копируем собранный фронтенд
COPY --from=frontend /app/build /app/frontend/build
COPY --from=frontend /app/public /app/frontend/public

# Копируем скрипт запуска и даём права
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 8000
CMD gunicorn --bind 0.0.0.0:8000 backend.wsgi:application