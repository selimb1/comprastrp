import os
from google import genai

api_key = "AIzaSyAXuNvvI2M8-iSCn9TSTuNqWlkGZB5uHXk"
client = genai.Client(api_key=api_key)

for m in client.models.list():
    if "flash" in m.name:
        print(m.name)
