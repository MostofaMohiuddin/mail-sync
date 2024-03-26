from fastapi import Depends

from backend.src.important_mail.models import ImportantMailNotification
from backend.src.important_mail.repositories import ImportantMailNotificationRepository
from backend.src.link_mail_address.service import LinkMailAddressService
from backend.src.openai.openai_client import OpenAIClient


class ImportantMailService:
    def __init__(
        self,
        openai_client: OpenAIClient = Depends(),
        important_mail_notification_repository: ImportantMailNotificationRepository = Depends(),
        link_mail_address_service: LinkMailAddressService = Depends(),
    ):
        self.important_mail_notification_repository = important_mail_notification_repository
        self.openai_client = openai_client
        self.link_mail_address_service = link_mail_address_service

    def detect_important(self, subject: str, sender: str):
        return self.openai_client.detect_important_email(subject, sender)

    async def create_important_mail_notification(self, notifications: list[ImportantMailNotification]):
        print("notifications")
        return await self.important_mail_notification_repository.add_notifications(notifications)

    async def get_important_mail_notifications(self, username: str) -> list[ImportantMailNotification]:
        link_mail_addresses = await self.link_mail_address_service.get_all_linked_mail_address(username)
        data = await self.important_mail_notification_repository.get_notifications(
            [link_address.id for link_address in link_mail_addresses]
        )
        return [ImportantMailNotification(**d) for d in data]

    async def mark_important_mail_notification_as_read(self, notification_ids: list[str]) -> None:
        await self.important_mail_notification_repository.mark_notification_as_read(notification_ids)
