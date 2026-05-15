from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI
import os

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI()

# OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Request body structure
class Ticket(BaseModel):
    issue: str

# Home route
@app.get("/")
def home():
    return {"message": "FixPilot AI is running"}

# AI ticket analysis route
@app.post("/analyze-ticket")
def analyze_ticket(ticket: Ticket):

    prompt = f"""
    Analyze this software issue.

    Return:
    - Summary
    - Priority (Low, Medium, High)
    - Category
    - Suggested Engineer Type

    Issue:
    {ticket.issue}
    """

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {"role": "system", "content": "You are an expert software issue analyst."},
            {"role": "user", "content": prompt}
        ]
    )

    return {
        "analysis": response.choices[0].message.content
    }