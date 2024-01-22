FROM python:3.10-slim

# disable print buffering
ENV PYTHONUNBUFFERED=1 \
    # don't generate __pycache__
    PYTHONDONTWRITEBYTECODE=1 \
    # even if we run `python abc/xyz.py`, we want to import from project root, not abc.
    PYTHONPATH=.

WORKDIR /app
RUN pip install --no-cache-dir 'poetry>=1.5' debugpy

COPY ./poetry.lock ./pyproject.toml ./
# We don't copy everything, as we only want to reinstall dependencies if poetry.lock / pyproject.toml change.
# At each step, docker build doesn't use cache if any of the workdir files have changed since last build.

RUN poetry config virtualenvs.create false && poetry install --only main --no-interaction

COPY . .
