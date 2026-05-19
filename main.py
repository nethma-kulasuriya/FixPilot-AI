from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib

from database import engine, SessionLocal
from models import TicketDB, Base

from auth import hash_password, verify_password, create_token
from models import UserDB

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer
from auth import decode_token


# 1. Create app FIRST (MOST IMPORTANT)
app = FastAPI()

security = HTTPBearer()

def get_current_user(token=Depends(security)):
    data = decode_token(token.credentials)

    if not data:
        raise HTTPException(status_code=401, detail="Invalid token")

    return data["email"]

# 2. Add middleware AFTER app is created
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Create database tables
Base.metadata.create_all(bind=engine)

# 4. Load ML models
category_model = joblib.load("category_model.pkl")
priority_model = joblib.load("priority_model.pkl")
vectorizer = joblib.load("vectorizer.pkl")

# 5. Request model
class Ticket(BaseModel):
    issue: str

# 6. Predict endpoint
@app.post("/predict")
def predict(ticket: Ticket, user=Depends(get_current_user)):

    X = vectorizer.transform([ticket.issue])

    category_prediction = category_model.predict(X)[0]
    priority_prediction = priority_model.predict(X)[0]

    db = SessionLocal()

    new_ticket = TicketDB(
        issue=ticket.issue,
        category=category_prediction,
        priority=priority_prediction,
        owner=user
    )

    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    db.close()

    return new_ticket

# 7. Get all tickets
@app.get("/tickets")
def get_tickets(user=Depends(get_current_user)):

    db = SessionLocal()
    tickets = db.query(TicketDB).filter(TicketDB.owner == user).all()
    db.close()

    return tickets

@app.post("/register")
def register(email: str, password: str):

    db = SessionLocal()

    user = UserDB(
        email=email,
        password=hash_password(password)
    )

    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()

    return {"message": "User created"}


@app.post("/login")
def login(email: str, password: str):

    db = SessionLocal()

    user = db.query(UserDB).filter(UserDB.email == email).first()

    db.close()

    if not user or not verify_password(password, user.password):
        return {"error": "Invalid credentials"}

    token = create_token({"email": email})

    return {
        "access_token": token
    }

@app.delete("/ticket/{ticket_id}")
def delete_ticket(ticket_id: int, user=Depends(get_current_user)):

    db = SessionLocal()

    ticket = db.query(TicketDB).filter(
        TicketDB.id == ticket_id,
        TicketDB.owner == user
    ).first()

    if not ticket:
        db.close()
        return {"error": "Ticket not found"}

    db.delete(ticket)
    db.commit()
    db.close()

    return {"message": "Deleted"}