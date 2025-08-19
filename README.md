# BIPrun
Сайт разворачивается в docker compose.

- cd /.../{Папка с проектом}
- docker-compose down -v && docker-compose up --build

# BIP certbot
certbot выписывает сертификаты , для этого первоначально необходимо запускать проект с первоначальным (http) nginx.conf




# BIPweb/front 
- npm run dev
# BIPweb(back)
- python manage.py makemigrations
- python manage.py migrate
- python manage.py runserver
- для запуска с ssl: python manage.py runsslserver --certificate cert.pem --key key.pem, пароль hello


