from fastapi import FastAPI
from pydantic import BaseModel
import joblib

from database import engine, SessionLocal
from models import TicketDB, Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Load ML models
category_model = joblib.load("category_model.pkl")
priority_model = joblib.load("priority_model.pkl")
vectorizer = joblib.load("vectorizer.pkl")

# Request body
class Ticket(BaseModel):
    issue: str

@app.post("/predict")
def predict(ticket: Ticket):

    # Convert issue text
    X = vectorizer.transform([ticket.issue])

    # Predictions
    category_prediction = category_model.predict(X)[0]
    priority_prediction = priority_model.predict(X)[0]

    # Database session
    db = SessionLocal()

    # Create ticket record
    new_ticket = TicketDB(
        issue=ticket.issue,
        category=category_prediction,
        priority=priority_prediction
    )

    # Save to database
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)

    db.close()

    return {
        "id": new_ticket.id,
        "issue": new_ticket.issue,
        "category": new_ticket.category,
        "priority": new_ticket.priority
    }

@app.get("/tickets")
def get_tickets():

    db = SessionLocal()
    tickets = db.query(TicketDB).all()
    db.close()

    return tickets