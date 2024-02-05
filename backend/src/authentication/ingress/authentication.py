from fastapi import HTTPException, Request

from src.authentication.enums import AuthenticationMechanism
from src.authentication.ingress.auth1.auth import FirstAuthentication
from src.authentication.ingress.auth2.auth import SecondAuthentication


# This class is used to select the authentication mechanism based on the parameter passed to the constructor.
# You can create your own class by implementing AuthenticationInterface and add it to the if-else block.
# They return the product_id, user_id etc. according to your needs. In this example it returns a string.
# Change the return type to match your needs.
class Authentication:
    def __init__(self, auth_mechanism: AuthenticationMechanism):
        self.auth_mechanism = auth_mechanism

    async def __call__(self, request: Request):
        if self.auth_mechanism == AuthenticationMechanism.AUTH1:
            first_authentication = FirstAuthentication()
            user = first_authentication.authenticate(request)
            return user
        elif self.auth_mechanism == AuthenticationMechanism.AUTH2:
            second_authentication = SecondAuthentication()
            user = second_authentication.authenticate(request)
            return user
        else:
            raise HTTPException(status_code=500, detail="Invalid authentication mechanism")
