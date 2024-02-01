import os

from dotenv import load_dotenv

# By default, load_dotenv doesn't override existing environment variables.
load_dotenv()


def parse_bool(value: str) -> bool:
    return value.lower() in ("true", "1", "t")


# Application constants
RUNTIME_ENVIRONMENT = os.getenv("RUNTIME_ENVIRONMENT")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

# Base API config
SERVER_HOST = os.getenv("SERVER_HOST", "0.0.0.0")
SERVER_PORT = int(os.getenv("SERVER_PORT", "7900"))

# Database config
MONGO_PREFIX = os.getenv("MONGO_PREFIX", "mongodb")
MONGO_HOST = os.getenv("MONGO_HOST", "mongodb")
MONGO_PORT = int(os.getenv("MONGO_PORT", "27017"))
MONGO_USERNAME = os.getenv("MONGO_USERNAME", "admin")
MONGO_PASSWORD = os.getenv("MONGO_PASSWORD", "password")
MONGO_DB = os.getenv("MONGO_DB", "admin")
