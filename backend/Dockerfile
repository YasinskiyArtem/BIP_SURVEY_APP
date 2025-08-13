FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
##
COPY . .

# Сборка статики
# Создаем папку для статики и собираем её
RUN mkdir -p /app/staticfiles && \
    python manage.py collectstatic --noinput

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]