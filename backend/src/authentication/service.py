from datetime import timedelta

from cryptography.fernet import Fernet
from fastapi_jwt import JwtAccessBearer, JwtAuthorizationCredentials, JwtRefreshBearer

from src.env_config import PASSWORD_HASHING_KEY
from src.user.models import User

from .models import Token

# from fastapi import HTTPException


access_security = JwtAccessBearer(
    secret_key="secret_key",
    auto_error=True,
    access_expires_delta=timedelta(minutes=10),
)

refresh_security = JwtRefreshBearer(
    secret_key="secret_key",
    auto_error=True,
    refresh_expires_delta=timedelta(days=30),
)


class PasswordBasedAuthentication:
    """
    Provides methods for password-based authentication and JWT token handling.

    Methods:
    - verify_password(plain_password, hashed_password): Verify if the plain password matches the hashed password.
    - create_jwt_token(user): Create a JWT token pair (access token and refresh token) for the specified user.
    - refresh_jwt_token(credentials): Generate a new access token based on the provided JWT authorization credentials.
    - encrypt_password(password): Encrypt the provided password using Fernet symmetric encryption.
    - decrypt_password(encrypted_password_hex): Decrypt the encrypted password and return the plain password.
    """

    def verify_password(self, plain_password, hashed_password):
        """
        Verify if the plain password matches the hashed password.

        Parameters:
        - plain_password (str): The plain text password.
        - hashed_password (str): The hashed password to compare against.

        Returns:
        bool: True if the passwords match, False otherwise.
        """

        decrypted_password = self.decrypt_password(hashed_password)
        return plain_password == decrypted_password

    def create_jwt_token(self, user: User) -> Token:
        """
        Create a JWT token pair (access token and refresh token) for the specified user.

        Parameters:
        - user (User): The user object containing necessary information.

        Returns:
        Token: An object containing the generated access and refresh tokens.
        """

        access_token = access_security.create_access_token(subject={"username": user.username})
        refresh_token = refresh_security.create_refresh_token(subject={"username": user.username})
        return Token(**{"access_token": access_token, "refresh_token": refresh_token})

    def refresh_jwt_token(self, credentials: JwtAuthorizationCredentials) -> Token:
        """
        Generate a new access token based on the provided JWT authorization credentials.

        Parameters:
        - credentials (JwtAuthorizationCredentials): The JWT authorization credentials.

        Returns:
        Token: An object containing the new access token.
        """

        new_access_token = access_security.create_access_token(subject=credentials.subject)
        return Token(**{"access_token": new_access_token})

    def encrypt_password(self, password):
        """
        Encrypt the provided password using Fernet symmetric encryption.

        Parameters:
        - password (str): The password to be encrypted.

        Returns:
        str: The hex-encoded encrypted password.
        """

        cipher_suite = Fernet(PASSWORD_HASHING_KEY)
        encrypted_password = cipher_suite.encrypt(password.encode())
        return encrypted_password.hex()

    def decrypt_password(self, encrypted_password_hex):
        """
        Decrypt the encrypted password and return the plain password.

        Parameters:
        - encrypted_password_hex (str): The hex-encoded encrypted password.

        Returns:
        str: The plain text decrypted password.
        """

        cipher_suite = Fernet(PASSWORD_HASHING_KEY)
        encrypted_password = bytes.fromhex(encrypted_password_hex)
        decrypted_password = cipher_suite.decrypt(encrypted_password)
        return decrypted_password.decode()
