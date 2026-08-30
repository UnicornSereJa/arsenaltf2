#!/bin/bash
set -e

echo "Making migrations..."
python manage.py makemigrations api --noinput

echo "Applying database migrations..."
python manage.py migrate --noinput

echo "Creating superuser (if not exists)..."
python manage.py createsuperuser --noinput || echo "Superuser already exists or creation skipped."

echo "Starting Gunicorn..."
