from fastapi import APIRouter, status

from src.http_client.base import AsyncHttpClient
from src.logger import LOGGER

router = APIRouter(prefix="/api", tags=["Misc"])


@router.get("/status", status_code=status.HTTP_200_OK)
def get_status():
    LOGGER.info("Health check!")
    return {"detail": "Healthy!"}


@router.get("/async-github-status", status_code=status.HTTP_200_OK)
async def get_github_status():
    async with AsyncHttpClient() as client:
        response = await client.get("https://api.github.com/status")
        return response.json()
