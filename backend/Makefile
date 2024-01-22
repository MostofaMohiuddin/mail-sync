SHELL := /bin/bash
POETRY_CLI := $(shell which poetry)

# https://www.gnu.org/software/make/manual/make.html#Call-Function
confirm := read -r -p "⚠  Are you sure? [y/N] " response && [[ "$$response" =~ ^([yY][eE][sS]|[yY])$$ ]]

help: ## Print help for each target
	$(info Available commands:)
	$(info ==========================================================================================)
	$(info )
	@grep '^[[:alnum:]_-]*:.* ##' $(MAKEFILE_LIST) \
		| sort | awk 'BEGIN {FS=":.* ## "}; {printf "%-25s %s\n", $$1, $$2};'


poetry-check: ## Checks if poetry is installed
ifeq ($(strip $(POETRY_CLI)),)
	@echo "ERROR: Please install poetry first!"
	exit 1
else
	@echo "Poetry is installed at: $(POETRY_CLI)"
endif

copy-env: ## Copies .env to .env.bak and creates a new one from .env.example
	@echo "Your may lose .env.bak"
	@if $(call confirm); then \
		cp .env .env.bak || true ; \
		cp .env.example .env ; \
	fi

# poetry hits keyring for most operations which adds unnecessary (for us) dependency on keyring:
# https://github.com/python-poetry/poetry/issues/1917#issuecomment-1235998997
setup-no-dev-dependencies: ## Installs dependencies without dev dependencies
	poetry env use python3.10
	PYTHON_KEYRING_BACKEND=keyring.backends.fail.Keyring poetry install --without=dev

setup-dev-dependencies: ## Installs dev dependencies
	poetry env use python3.10
	PYTHON_KEYRING_BACKEND=keyring.backends.fail.Keyring poetry install --only=dev

setup-dependencies: ## Uses python3.10 for .venv and installs dependencies
	poetry env use python3.10
	PYTHON_KEYRING_BACKEND=keyring.backends.fail.Keyring poetry install

setup-pre-commit: ## Installs pre-commit-hook
	@echo "Installing pre-commit-hook"
	poetry run pre-commit install

setup-basic: poetry-check setup-no-dev-dependencies ## Sets up basic environment
	if [ ! -f .env ]; then cp .env.example .env; fi

setup: setup-basic setup-dev-dependencies setup-pre-commit ## Sets up local-development environment

run: ## Runs the service locally using poetry
	RUNTIME_ENVIRONMENT=local poetry run python -m debugpy --listen 0.0.0.0:4000 main.py

start: ## Starts the service using docker
	docker build -t mail-sync-backend .
	docker run -p 8000:8000 -p 4000:4000 --name mail-sync-backend -v .:/usr/src/app -e RUNTIME_ENVIRONMENT=local --rm -it mail-sync-backend python -m debugpy --listen 0.0.0.0:4000 main.py

clean: ## Cleans up the local-development environment except .env
	rm -rf .mypy_cache
	rm -rf .pytest_cache
	rm -f .coverage
	find . -name __pycache__ -type d -prune -exec rm -rf {} \;

merge-poetry-lock: ## Merges conflicted poetry.lock
	git diff --quiet pyproject.toml	# Ensure no unstaged change in pyproject.toml
	git checkout HEAD -- poetry.lock
	poetry lock --no-update
	git add poetry.lock

check-poetry-lock: ## Checks if poetry.lock corresponds to pyproject.toml and has correct content-hash
	@echo "Checking if poetry.lock corresponds to pyproject.toml and has correct content-hash"
	poetry lock --check

#################################################################################
# Formatting checks #############################################################

check-isort: ## Checks if .py files are formatted with isort
	@echo "Checking isort formatting(without update)"
	poetry run isort --check --diff .

check-black: ## Checks if .py files are formatted with black
	@echo "Checking black formatting(without change)"
	poetry run black --config pyproject.toml --check --diff .

check-pyproject-toml: ## Checks the pyproject.toml structure
	@echo "Checking pyproject.toml structure"
	poetry check

check-format: check-isort check-black check-pyproject-toml ## Checks all formatting issues


#################################################################################
# Formatting fixes ##############################################################

format-isort: ## Fixes .py files with isort
	@echo "Fixing isort formatting issues"
	poetry run isort .

format-black: ## Fixes .py files with black
	@echo "Fixing black formatting issues"
	poetry run black --config pyproject.toml .

format-unused-imports: ## Fixes unused imports and unused variables
	@echo "Removing unused imports"
	poetry run autoflake -i --remove-all-unused-imports --recursive .

format: format-unused-imports format-isort format-black ## Fixes all formatting issues


#################################################################################
# Linting checks ################################################################

lint-flake8: ## Checks if .py files follow flake8
	@echo "Checking flake8 errors"
	poetry run flake8

lint-pylint: ## Checks if .py files follow pylint
	@echo "Checking pylint errors"
	poetry run pylint --recursive=y .

lint-pylint-with-report-txt: ## Checks if .py files follow pylint and generates pylint-output.txt
	@echo "Checking pylint errors and generating pylint-output.txt"
	set -o pipefail && poetry run pylint --recursive=y . | tee pylint-output.txt

check-lint: lint-flake8 lint-pylint ## Checks all linting issues


#################################################################################
# Pytest and mypy test ##########################################################

test-pre-commit: ## Runs pre-commit tests without committing
	@echo "Running pre-commit tests"
	poetry run pre-commit run -a

test-pre-push: ## Runs pre-push tests without pushing
	@echo "Running pre-push tests"
	poetry run pre-commit run -a --hook-stage push

test-pytest: ## Runs pytest tests
	@echo "Running pytest tests"
	poetry run pytest

test-pytest-verbose: ## Runs pytest tests with verbose output
	@echo "Running pytest tests with verbose output"
	poetry run pytest -v --capture=no

test-pytest-minimal-coverage: ## Runs pytest and fails if below limit. i.e: make test-pytest-minimal-coverage cov-limit=80
	@echo "Running pytest tests with minimum coverage $(cov-limit)%"
	poetry run pytest --cov=. --cov-fail-under=$(cov-limit)

test-pytest-with-coverage: ## Runs pytest tests and shows coverage report
	@echo "Running pytest tests and showing coverage report"
	poetry run pytest --cov=. --cov-report=term-missing:skip-covered

test-pytest-with-coverage-txt: ## Runs pytest tests and generates coverage-report.txt
	@echo "Running pytest tests and generating coverage-report.txt"
	set -o pipefail && poetry run pytest --cov=. --junitxml=pytest.xml --cov-report=term-missing:skip-covered | tee pytest-coverage.txt

test-pytest-with-coverage-txt-html: ## Runs pytest tests and generates coverage-report.txt and htmlcov
	@echo "Running pytest tests and generating coverage-report.txt & htmlcov"
	set -o pipefail && poetry run pytest --cov=. --junitxml=pytest.xml --cov-report=term-missing:skip-covered --cov-report html | tee pytest-coverage.txt

test-mypy: ## Runs mypy tests
	@echo "Running mypy tests"
	poetry run mypy .

test: test-mypy test-pytest ## Runs tests using pytest and mypy

check-missing-type:
	@echo "Checking for missing function parameter type and return type"
	poetry run mypy . --disallow-untyped-defs
