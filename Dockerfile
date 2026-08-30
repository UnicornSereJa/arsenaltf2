# Бэкенд
FROM python:3.10-slim AS backend
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .
RUN python manage.py collectstatic --noinput

# Фронтенд
FROM node:18-slim AS frontend
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Финальный образ
FROM python:3.10-slim
WORKDIR /app
COPY --from=backend /app /app
COPY --from=frontend /app/build /app/frontend/build

EXPOSE ${PORT}
CMD gunicorn --bind 0.0.0.0:${PORT} backend.wsgi:application