#!/bin/bash
set -e

echo "Applying database migrations..."
python manage.py migrate --noinput

echo "Creating superuser (if not exists)..."
python manage.py createsuperuser --noinput || echo "Superuser already exists or creation skipped."

echo "Starting Gunicorn..."
exec gunicorn --bind 0.0.0.0:8000 backend.wsgi:application