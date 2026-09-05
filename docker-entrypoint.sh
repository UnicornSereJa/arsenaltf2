#!/bin/bash
set -e

echo "Making migrations for api..."
python manage.py makemigrations api --noinput || true

echo "Applying all migrations..."
python manage.py migrate --noinput

echo "Creating superuser (if not exists)..."
python manage.py createsuperuser --login admin --email admin@example.com --noinput || echo "Superuser already exists or creation skipped."

echo "Starting Gunicorn..."
exec gunicorn --bind 0.0.0.0:8000 backend.wsgi:application
