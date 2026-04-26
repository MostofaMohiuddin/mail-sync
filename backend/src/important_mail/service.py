from datetime import datetime, timezone

from fastapi import Depends

from backend.src.important_mail.dtos import (
    ClassifyBatchRequest,
    ClassifyBatchResponse,
    ClassifyBatchResultRow,
    MailMetaDataInput,
)
from backend.src.important_mail.models import (
    ImportantMailClassification,
    ImportantMailNotification,
)
from backend.src.important_mail.repositories import (
    ImportantMailClassificationRepository,
    ImportantMailNotificationRepository,
)
from backend.src.link_mail_address.service import LinkMailAddressService
from backend.src.openai.openai_client import OpenAIClient

from dateutil.parser import parse


KNOWN_BULK_SENDERS = {
    "mailchimp.com",
    "sendgrid.net",
    "mailgun.org",
    "notifications.github.com",
    "e.linkedin.com",
    "email.medium.com",
}

NOREPLY_PREFIXES = (
    "noreply",
    "no-reply",
    "donotreply",
    "do-not-reply",
    "notifications",
    "notification",
)


def _prefilter(mail: MailMetaDataInput) -> tuple[bool | None, str | None]:
    """Return (is_important, reason) if pre-filter applies, else (None, None)."""
    sender = (mail.sender.email or "").lower()
    receiver = (mail.receiver.email or "").lower()

    if sender and sender == receiver:
        return False, "self_sender"

    local, _, domain = sender.partition("@")
    if local.startswith(NOREPLY_PREFIXES):
        return False, "noreply_local_part"
    if domain in KNOWN_BULK_SENDERS:
        return False, "known_bulk_sender"

    return None, None


class ImportantMailService:
    def __init__(
        self,
        openai_client: OpenAIClient = Depends(),
        important_mail_notification_repository: ImportantMailNotificationRepository = Depends(),
        important_mail_classification_repository: ImportantMailClassificationRepository = Depends(),
        link_mail_address_service: LinkMailAddressService = Depends(),
    ):
        self.important_mail_notification_repository = important_mail_notification_repository
        self.important_mail_classification_repository = important_mail_classification_repository
        self.openai_client = openai_client
        self.link_mail_address_service = link_mail_address_service

    def _contains_affirmative(self, text):
        affirmatives = ["true", "1", "t", "y", "yes", "yeah", "yup", "certainly", "uh-huh"]
        text_lower = text.lower()
        for affirmative in affirmatives:
            if affirmative in text_lower:
                return True
        return False

    def detect_important(self, subject: str, sender: str, snippet: str) -> bool:
        data = self.openai_client.detect_important_email(subject, sender, snippet)
        return self._contains_affirmative(data) if data else False

    async def classify_batch(self, request: ClassifyBatchRequest) -> ClassifyBatchResponse:
        if not request.mails:
            return ClassifyBatchResponse(results=[])

        results_by_id: dict[str, ClassifyBatchResultRow] = {}
        unresolved: list[MailMetaDataInput] = []

        # 1. pre-filter
        for mail in request.mails:
            decision, reason = _prefilter(mail)
            if decision is not None:
                results_by_id[mail.id] = ClassifyBatchResultRow(
                    mail_id=mail.id, is_important=decision, reason=reason
                )
            else:
                unresolved.append(mail)

        # 2. cache lookup
        if unresolved:
            cache = await self.important_mail_classification_repository.get_by_mail_ids(
                [m.id for m in unresolved]
            )
            still_unresolved: list[MailMetaDataInput] = []
            for mail in unresolved:
                if mail.id in cache:
                    results_by_id[mail.id] = ClassifyBatchResultRow(
                        mail_id=mail.id, is_important=cache[mail.id], reason="cached"
                    )
                else:
                    still_unresolved.append(mail)
            unresolved = still_unresolved

        # 3. batched OpenAI call
        if unresolved:
            batch_input = [
                {
                    "id": m.id,
                    "subject": m.subject,
                    "sender_email": m.sender.email,
                    "snippet": m.snippet,
                }
                for m in unresolved
            ]
            llm_results = self.openai_client.detect_important_batch(batch_input)
            llm_by_id = {r.get("id"): r for r in llm_results}
            for mail in unresolved:
                row = llm_by_id.get(mail.id, {"important": False, "reason": "llm_no_response"})
                results_by_id[mail.id] = ClassifyBatchResultRow(
                    mail_id=mail.id,
                    is_important=bool(row.get("important", False)),
                    reason=row.get("reason"),
                )

        # 4. persist all decisions to cache
        now = datetime.now(timezone.utc).isoformat()
        await self.important_mail_classification_repository.upsert_many(
            [
                ImportantMailClassification(
                    mail_id=row.mail_id,
                    is_important=row.is_important,
                    reason=row.reason,
                    classified_at=now,
                )
                for row in results_by_id.values()
            ]
        )

        # 5. return in input order
        return ClassifyBatchResponse(
            results=[results_by_id[m.id] for m in request.mails]
        )

    async def create_important_mail_notification(self, notifications: list[ImportantMailNotification]):
        return await self.important_mail_notification_repository.add_notifications(notifications)

    async def get_important_mail_notifications(self, username: str) -> list[ImportantMailNotification]:
        link_mail_addresses = await self.link_mail_address_service.get_all_linked_mail_address(username)
        data = await self.important_mail_notification_repository.get_notifications(
            [link_address.id for link_address in link_mail_addresses]
        )
        notifications = [ImportantMailNotification(**d) for d in data]
        notifications.sort(key=lambda x: parse(x.mail_metadata.date), reverse=True)
        return notifications

    async def mark_important_mail_notification_as_read(self, notification_ids: list[str]) -> None:
        await self.important_mail_notification_repository.mark_notification_as_read(notification_ids)
