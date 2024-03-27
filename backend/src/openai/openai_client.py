from openai import OpenAI
from src.env_config import OPENAI_API_KEY


class OpenAIClient:
    def __init__(self):
        self.client = OpenAI(api_key=OPENAI_API_KEY)

    def detect_important_email(self, subject: str, sender: str, snippet: str) -> str | None:
        return (
            self.client.chat.completions.create(
                model="gpt-4",
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
                model="gpt-3.5-turbo",
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
