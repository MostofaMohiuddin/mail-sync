from fastapi import Request

# from fastapi import HTTPException
from src.authentication.ingress.authentication_interface import AuthenticationInterface


# This is a sample class for authentication. You can create your own class by implementing AuthenticationInterface.
class FirstAuthentication(AuthenticationInterface):
    def __init__(self):
        # Initialize any necessary objects or variables for Authentication
        pass

    def authenticate(self, request: Request) -> str:
        # Perform Authentication
        # If authentication fails, raise an HTTPException with status code 401
        # raise HTTPException(status_code=401, detail="Unauthorized")
        # If authentication succeeds, return the some product_id, user_id etc.
        # Change the return type to match your needs
        return "Product 1"
