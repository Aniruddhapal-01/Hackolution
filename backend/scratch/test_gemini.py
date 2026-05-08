import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

print(f"Testing with Model: {model_name}")
print(f"Key used: {api_key[:10]}...")

if not api_key:
    print("No API key found!")
    exit(1)

genai.configure(api_key=api_key)
model = genai.GenerativeModel(model_name)

try:
    response = model.generate_content("Hello, this is a test.")
    print("Response received:")
    print(response.text)
except Exception as e:
    print(f"Error: {e}")
