import os
from openai import OpenAI

token = os.getenv("GITHUB_TOKEN")  # or hardcode it here for test
endpoint = "https://models.github.ai/inference"
model = "openai/gpt-4.1"

client = OpenAI(
    base_url=endpoint,
    api_key=token,
)

response = client.chat.completions.create(
    model=model,
    messages=[
        { "role": "system", "content": "You are a helpful assistant." },
        { "role": "user", "content": "Is this working through GitHub Models?" },
    ]
)

print(response.choices[0].message.content)
