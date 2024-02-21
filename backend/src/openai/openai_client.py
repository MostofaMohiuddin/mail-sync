from openai import OpenAI
from src.env_config import OPENAI_API_KEY


class OpenAIClient:
    def __init__(self):
        self.client = OpenAI(api_key=OPENAI_API_KEY)

    def get_completion(self, system_prompt: str, prompt: str) -> str | None:
        return (
            self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": f"{system_prompt}. You just give html format reply of the summary and dont reply extra information. reply only the main content. and use div for newline.",
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
