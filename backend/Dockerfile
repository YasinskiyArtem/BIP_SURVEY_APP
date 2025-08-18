FROM python:3.9-slim AS builder

WORKDIR /app
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN python manage.py collectstatic --noinput --clear



CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
