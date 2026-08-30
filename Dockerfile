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

# Копируем requirements.txt и устанавливаем зависимости в финальном образе
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем код бэкенда и статику
COPY --from=backend /app /app

# Копируем собранный фронтенд
COPY --from=frontend /app/build /app/frontend/build

EXPOSE ${PORT}
CMD gunicorn --bind 0.0.0.0:${PORT} backend.wsgi:application