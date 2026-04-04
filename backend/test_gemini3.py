import os
from google import genai

api_key = "AIzaSyAXuNvvI2M8-iSCn9TSTuNqWlkGZB5uHXk"
client = genai.Client(api_key=api_key)

try:
    response = client.models.generate_content(
        model="gemini-2.5-flash", 
        contents="Say hello"
    )
    print("SUCCESS", response.text)
except Exception as e:
    print("ERROR", str(e))
