import asyncio

import httpx

from src.example_module.repositories import ExampleRepository
from src.logger import LOGGER


class ExampleService:
    def __init__(self, example_repository: ExampleRepository) -> None:
        self._example_repository = example_repository

    def get_service(self):
        return self._example_repository.get()

    async def fetch_data(self, id: int) -> dict:
        LOGGER.info(f"Fetching data # {id}")
        async with httpx.AsyncClient() as client:
            response = await client.get("https://gorest.co.in/public/v2/users")  # sample api call
            LOGGER.info(f"Data fetch complete # {id}")
            return response.json()

    async def example_async_service(self, id: int) -> str:
        LOGGER.info(f"Start {id}, sleeping {5-id}s")
        await asyncio.sleep(5 - id)
        LOGGER.info(f"End {id}")
        return f"example async service # {id}"
