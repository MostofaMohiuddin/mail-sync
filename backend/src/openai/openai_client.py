from openai import OpenAI
from src.env_config import OPENAI_API_KEY


class OpenAIClient:
    def __init__(self):
        self.client = OpenAI(api_key=OPENAI_API_KEY)

    def get_completion(self, content: str) -> str | None:
        return (
            self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "user",
                        "content": content,
                    }
                ],
            )
            .choices.pop()
            .message.content
        )
