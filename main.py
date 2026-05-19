import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib

from database import engine, SessionLocal
from models import TicketDB, Base, UserDB

from auth import (
    hash_password,
    verify_password,
    create_token,
    decode_token
)

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer


# ---------------- APP ----------------

app = FastAPI()

security = HTTPBearer()


# ---------------- AUTH HELPERS ----------------

def get_current_user(token=Depends(security)):

    data = decode_token(token.credentials)

    if not data:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

    return data["email"]


def get_admin_user(user=Depends(get_current_user)):

    db = SessionLocal()

    existing_user = db.query(UserDB).filter(
        UserDB.email == user
    ).first()

    db.close()

    if not existing_user or not existing_user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )

    return user


# ---------------- CORS ----------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------- DATABASE ----------------

Base.metadata.create_all(bind=engine)


# ---------------- LOAD AI MODELS ----------------

category_model = joblib.load("category_model.pkl")
priority_model = joblib.load("priority_model.pkl")
vectorizer = joblib.load("vectorizer.pkl")


# ---------------- REQUEST MODELS ----------------

class Ticket(BaseModel):
    issue: str


# ---------------- AI PREDICT ----------------

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


# ---------------- USER TICKETS ----------------

@app.get("/tickets")
def get_tickets(user=Depends(get_current_user)):

    db = SessionLocal()

    tickets = db.query(TicketDB).filter(
        TicketDB.owner == user
    ).all()

    db.close()

    return tickets


# ---------------- REGISTER ----------------

@app.post("/register")
def register(email: str, password: str):

    db = SessionLocal()

    existing_user = db.query(UserDB).filter(
        UserDB.email == email
    ).first()

    if existing_user:
        db.close()
        return {"error": "User already exists"}

    user = UserDB(
        email=email,
        password=hash_password(password),
        is_admin=True if email == "admin@gmail.com" else False
    )

    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()

    return {"message": "User created"}


# ---------------- LOGIN ----------------

@app.post("/login")
def login(email: str, password: str):

    db = SessionLocal()

    user = db.query(UserDB).filter(
        UserDB.email == email
    ).first()

    db.close()

    if not user or not verify_password(password, user.password):
        return {"error": "Invalid credentials"}

    token = create_token({
        "email": email
    })

    return {
        "access_token": token
    }


# ---------------- DELETE TICKET ----------------

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


# ---------------- UPDATE TICKET ----------------

@app.put("/ticket/{ticket_id}")
def update_ticket(
    ticket_id: int,
    updated_ticket: Ticket,
    user=Depends(get_current_user)
):

    db = SessionLocal()

    ticket = db.query(TicketDB).filter(
        TicketDB.id == ticket_id,
        TicketDB.owner == user
    ).first()

    if not ticket:
        db.close()
        return {"error": "Ticket not found"}

    # Re-run AI prediction
    X = vectorizer.transform([updated_ticket.issue])

    ticket.issue = updated_ticket.issue
    ticket.category = category_model.predict(X)[0]
    ticket.priority = priority_model.predict(X)[0]

    db.commit()
    db.refresh(ticket)
    db.close()

    return ticket


# ---------------- ADMIN: ALL USERS ----------------

@app.get("/admin/users")
def get_all_users(admin=Depends(get_admin_user)):

    db = SessionLocal()

    users = db.query(UserDB).all()

    db.close()

    return users


# ---------------- ADMIN: ALL TICKETS ----------------

@app.get("/admin/tickets")
def get_all_tickets(admin=Depends(get_admin_user)):

    db = SessionLocal()

    tickets = db.query(TicketDB).all()

    db.close()

    return tickets