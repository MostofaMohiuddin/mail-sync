from openai import OpenAI
from src.env_config import OPENAI_API_KEY


class OpenAIClient:
    def __init__(self):
        self.client = OpenAI(api_key=OPENAI_API_KEY)

    def detect_important_email(self, subject: str, sender: str, snippet: str) -> str | None:
        return (
            self.client.chat.completions.create(
                model="gpt-4.1-nano",
                messages=[
                    {
                        "role": "system",
                        "content": "you are a important mail detector. you detect mail important or not from subject and sender email address and snippet of the email. Promotional, spam mails are not important so return false. other wise return true. Reply in boolean.",
                    },
                    {
                        "role": "user",
                        "content": f"email subject: {subject}, sender email address: {sender}, snippet: {snippet}",
                    },
                ],
            )
            .choices.pop()
            .message.content
        )

    def get_completion(self, system_prompt: str, prompt: str) -> str | None:
        return (
            self.client.chat.completions.create(
                model="gpt-4.1-nano",
                messages=[
                    {
                        "role": "system",
                        "content": f"{system_prompt}",
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    },
                ],
            )
            .choices.pop()
            .message.content
        )

    def detect_important_batch(self, mails: list[dict]) -> list[dict]:
        """
        Classify a batch of mails in a single OpenAI call.

        Each mail dict must include: id, subject, sender_email, snippet.
        Returns: list of {"id": str, "important": bool, "reason": str}
        """
        if not mails:
            return []

        rendered = "\n\n".join(
            (
                f"---\nID: {m['id']}\n"
                f"From: {m['sender_email']}\n"
                f"Subject: {m['subject']}\n"
                f"Snippet: {m['snippet']}"
            )
            for m in mails
        )
        system = (
            "You classify emails as important or not. "
            "Promotional, marketing, and automated notifications are NOT important. "
            "Personal mail, replies from real people, work-related threads ARE important. "
            "For each input email return one JSON object with keys id (string), "
            "important (boolean), reason (short string)."
        )
        user = (
            "Classify the following emails. Reply ONLY with a JSON object of the form "
            "{\"results\": [{\"id\": \"...\", \"important\": true, \"reason\": \"...\"}]} "
            "with one entry per input in the same order.\n\n"
            f"{rendered}"
        )

        import json

        completion = self.client.chat.completions.create(
            model="gpt-4.1-nano",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        )
        raw = completion.choices.pop().message.content or "{}"
        parsed = json.loads(raw)
        return parsed.get("results", [])
