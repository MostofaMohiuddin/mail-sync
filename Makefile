IMAGE_NAME = mail-sync-app
CONTAINER_NAME = mail-sync-nginx-container

build:
	docker build -t $(IMAGE_NAME) .

dev:
	docker compose -f docker-compose.dev.yml up -d

dev-stop:
	docker compose -f docker-compose.dev.yml down

dev-restart:
	docker compose -f docker-compose.dev.yml up -d --build

dev-clean:
	docker-compose down -v

