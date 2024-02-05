from abc import ABC, abstractmethod

from fastapi import Request


# This is an interface for authentication. You can create your own class by implementing this interface.
class AuthenticationInterface(ABC):
    @abstractmethod
    def authenticate(self, request: Request) -> str:
        pass
