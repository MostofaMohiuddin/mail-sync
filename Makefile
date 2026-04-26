IMAGE_NAME = mail-sync-app
CONTAINER_NAME = mail-sync-nginx-container

COMPOSE = -f docker-compose.dev.yml -f docker-compose.https.yml

build:
	docker build -t $(IMAGE_NAME) .

start: certs
	docker compose $(COMPOSE) up -d
	@echo "✓ https://mailsync.com"

stop:
	docker compose $(COMPOSE) down

rebuild: certs
	docker compose $(COMPOSE) up -d --build

restart: stop start

logs:
	docker compose $(COMPOSE) logs -f

clean:
	docker compose $(COMPOSE) down -v

certs:
	@command -v mkcert >/dev/null 2>&1 || { echo "mkcert not found. Install: brew install mkcert nss"; exit 1; }
	@mkdir -p nginx/certs
	@echo "Ensuring mkcert local CA is installed (may prompt for sudo)..."
	@mkcert -install
	@if [ ! -f nginx/certs/mailsync.com.pem ]; then \
		echo "Generating cert for mailsync.com..."; \
		mkcert -cert-file nginx/certs/mailsync.com.pem -key-file nginx/certs/mailsync.com-key.pem mailsync.com; \
	else \
		echo "Cert already exists at nginx/certs/mailsync.com.pem"; \
	fi
	@if ! grep -q "mailsync.com" /etc/hosts; then \
		echo "Adding mailsync.com to /etc/hosts (requires sudo)..."; \
		echo "127.0.0.1  mailsync.com" | sudo tee -a /etc/hosts >/dev/null; \
	fi
	@echo "⚠  Ensure GOOGLE_REDIRECT_URI in backend/.env is https://mailsync.com/oauth/google/callback (and authorized in Google Cloud Console)."

regen-certs:
	@rm -f nginx/certs/mailsync.com.pem nginx/certs/mailsync.com-key.pem
	@$(MAKE) certs
