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

# Password hashing key
PASSWORD_HASHING_KEY = os.getenv("PASSWORD_HASHING_KEY", "gRNCcDPDnSzqT2RT4nFJA6MYtsJkBG85sMEy9TogRYg=")

# GOOGLE OAUTH
GOOGLE_CLIENT_ID = os.getenv(
    "GOOGLE_CLIENT_ID", "394638145623-mofp9qn2s2bn55f2h2f3q7rv1van8690.apps.googleusercontent.com"
)
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "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")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://mailsync.com:3000/oauth/google/callback")
GOOGLE_OAUTH_BASE_URI = os.getenv("GOOGLE_OAUTH_BASE_URI", "https://accounts.google.com/o/oauth2/v2/auth")
