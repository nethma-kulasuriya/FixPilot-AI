from fastapi import FastAPI
from pydantic import BaseModel
import joblib

app = FastAPI()

# Load models
category_model = joblib.load("category_model.pkl")
priority_model = joblib.load("priority_model.pkl")
vectorizer = joblib.load("vectorizer.pkl")

# Request body
class Ticket(BaseModel):
    issue: str

# Prediction endpoint
@app.post("/predict")
def predict(ticket: Ticket):

    X = vectorizer.transform([ticket.issue])

    category_prediction = category_model.predict(X)
    priority_prediction = priority_model.predict(X)

    return {
        "category": category_prediction[0],
        "priority": priority_prediction[0]
    }