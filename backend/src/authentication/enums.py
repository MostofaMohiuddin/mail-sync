from enum import Enum


# Example Enum for Authentication Mechanism. You can create your own Enum and use it in Authentication Class.
class AuthenticationMechanism(str, Enum):
    AUTH1: str = "auth1"
    AUTH2: str = "auth2"
