from fastapi import Request

from src.authentication.ingress.authentication_interface import AuthenticationInterface


# This is a sample class for a second authentication if needed.
# You can create your own class by implementing AuthenticationInterface.
# This example is created so that you can see how to use two authentication mechanisms in the same project.
class SecondAuthentication(AuthenticationInterface):
    def __init__(self):
        # Initialize any necessary objects or variables for Turnstile Authentication
        pass

    def authenticate(self, request: Request) -> str:
        # Perform Authentication
        # If authentication fails, raise an HTTPException with status code 401
        # If authentication succeeds, return some product_id, user_id etc according to your needs.
        # Change the return type to match your needs
        return "Product 2"
