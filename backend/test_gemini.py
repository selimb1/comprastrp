import os
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

class TestSchema(BaseModel):
    name: str
    age: int
    is_active: bool

async def main():
    api_key = "AIzaSyD4isarmxhJvrEN-6V9Sowbwq96-9kWkHo"
    client = genai.Client(api_key=api_key)
    
    print("Testing generate_content")
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents="Extract details for John Doe who is 30 years old and currently active.",
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=TestSchema,
                temperature=0.0
            )
        )
        print("Response parsed properties:", hasattr(response, 'parsed') and response.parsed is not None)
        if hasattr(response, 'parsed') and response.parsed:
            print("Parsed data:", response.parsed)
        else:
            print("Raw text:", response.text)
    except Exception as e:
        print("Error with synchronous models.generate_content:", e)
        
    print("\nTesting aio.models.generate_content")
    try:
        response = await client.aio.models.generate_content(
            model='gemini-2.5-flash',
            contents="Extract details for John Doe who is 30 years old and currently active.",
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=TestSchema,
                temperature=0.0
            )
        )
        print("Response parsed properties:", hasattr(response, 'parsed') and response.parsed is not None)
        if hasattr(response, 'parsed') and response.parsed:
            print("Parsed data:", response.parsed)
        else:
            print("Raw text:", response.text)
    except Exception as e:
        print("Error with async:", e)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
