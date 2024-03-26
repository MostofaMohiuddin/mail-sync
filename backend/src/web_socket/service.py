from typing import Annotated

from fastapi import Depends

from backend.src.web_socket.repositories import WebSocketRepository


class WebSocketService:
    def __init__(
        self,
        web_socket_repository: Annotated[WebSocketRepository, Depends()],
    ):
        self.web_socket_repository = web_socket_repository

    async def set_item(self, key: str, value: str):
        return await self.web_socket_repository.set_item(key, value)
