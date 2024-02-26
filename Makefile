IMAGE_NAME = mail-sync-app
CONTAINER_NAME = mail-sync-nginx-container

build:
	docker build -t $(IMAGE_NAME) .

start:
	docker compose -f docker-compose.dev.yml up -d

stop:
	docker compose -f docker-compose.dev.yml down

rebuild:
	docker compose -f docker-compose.dev.yml up -d --build

restart:
	docker compose -f docker-compose.dev.yml down
	docker compose -f docker-compose.dev.yml up -d

logs:
	docker compose -f docker-compose.dev.yml logs -f

clean:
	docker-compose down -v

