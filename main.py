from fastapi import FastAPI
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI()

@app.get("/")
def home():
    return {
        "message": "FixPilot AI is running",
        "api_key_loaded": bool(os.getenv("OPENAI_API_KEY"))
    }