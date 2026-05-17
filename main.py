from fastapi import FastAPI
from pydantic import BaseModel
import joblib

app = FastAPI()

model = joblib.load("model.pkl")
vectorizer = joblib.load("vectorizer.pkl")

class Ticket(BaseModel):
    issue: str

@app.post("/predict")
def predict(ticket: Ticket):

    X = vectorizer.transform([ticket.issue])
    prediction = model.predict(X)

    return {
        "category": prediction[0]
    }