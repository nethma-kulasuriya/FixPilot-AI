import os

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from pydantic import BaseModel
import joblib
import random

from database import engine, SessionLocal
from models import TicketDB, Base, UserDB

from auth import (
    hash_password,
    verify_password,
    create_token,
    decode_token
)

# ---------------- APP ----------------

app = FastAPI()
security = HTTPBearer()

# ---------------- CORS ----------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- DB INIT ----------------

Base.metadata.create_all(bind=engine)

# ---------------- MODELS ----------------

category_model = joblib.load("category_model.pkl")
priority_model = joblib.load("priority_model.pkl")
vectorizer = joblib.load("vectorizer.pkl")

# ---------------- REQUEST ----------------

class Ticket(BaseModel):
    issue: str

# ---------------- AUTH ----------------

def get_current_user(token=Depends(security)):
    data = decode_token(token.credentials)

    if not data:
        raise HTTPException(status_code=401, detail="Invalid token")

    return data["email"]


def get_admin_user(user=Depends(get_current_user)):
    db = SessionLocal()
    existing_user = db.query(UserDB).filter(UserDB.email == user).first()
    db.close()

    if not existing_user or not existing_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    return user


# ---------------- SMART FIX ENGINE ----------------

FIX_BANK = {
    "Bug": [
        "Check recent logs and reproduce the issue step by step.",
        "Review latest code changes and identify breaking updates.",
        "Inspect error traces and validate API responses."
    ],
    "Feature Request": [
        "Break requirement into tasks and define implementation plan.",
        "Validate feasibility and align with system architecture.",
        "Create design draft and review dependencies."
    ],
    "UI": [
        "Inspect layout responsiveness and CSS conflicts.",
        "Check component alignment and styling issues.",
        "Validate UI consistency across devices."
    ],
    "Performance": [
        "Profile backend queries and optimize slow operations.",
        "Enable caching and reduce redundant API calls.",
        "Analyze memory usage and improve load handling."
    ],
    "Default": [
        "Investigate logs and reproduce the issue.",
        "Assign to relevant engineering team for analysis.",
        "Perform system diagnostics and root cause analysis."
    ]
}


def generate_fix(category: str):
    return random.choice(FIX_BANK.get(category, FIX_BANK["Default"]))


# ---------------- PREDICT + SAVE ----------------

@app.post("/predict")
def predict(ticket: Ticket, user=Depends(get_current_user)):

    X = vectorizer.transform([ticket.issue])

    category_prediction = category_model.predict(X)[0]
    priority_prediction = priority_model.predict(X)[0]

    suggested_fix = generate_fix(category_prediction)

    db = SessionLocal()

    new_ticket = TicketDB(
    issue=ticket.issue,
    category=category_prediction,
    priority=priority_prediction,
    owner=user,
    status="Open",
    suggested_fix=suggested_fix,
    assigned_to="Unassigned",
)

    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    db.close()

    return {
        "id": new_ticket.id,
        "issue": new_ticket.issue,
        "category": new_ticket.category,
        "priority": new_ticket.priority,
        "owner": new_ticket.owner,
        "suggested_fix": suggested_fix
    }


# ---------------- OTHER ROUTES ----------------

@app.get("/tickets")
def get_tickets(user=Depends(get_current_user)):
    db = SessionLocal()
    tickets = db.query(TicketDB).filter(TicketDB.owner == user).all()
    db.close()
    return tickets


@app.post("/register")
def register(email: str, password: str):
    db = SessionLocal()

    if db.query(UserDB).filter(UserDB.email == email).first():
        db.close()
        raise HTTPException(status_code=400, detail="User already exists")

    user = UserDB(
        email=email,
        password=hash_password(password),
        is_admin=(email == "admin@gmail.com")
    )

    db.add(user)
    db.commit()
    db.close()

    return {"message": "User created"}


@app.post("/login")
def login(email: str, password: str):
    db = SessionLocal()

    user = db.query(UserDB).filter(UserDB.email == email).first()
    db.close()

    if not user or not verify_password(password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token({"email": email})

    return {"access_token": token}


@app.delete("/ticket/{ticket_id}")
def delete_ticket(ticket_id: int, user=Depends(get_current_user)):
    db = SessionLocal()

    ticket = db.query(TicketDB).filter(
        TicketDB.id == ticket_id,
        TicketDB.owner == user
    ).first()

    if not ticket:
        db.close()
        raise HTTPException(status_code=404, detail="Ticket not found")

    db.delete(ticket)
    db.commit()
    db.close()

    return {"message": "Deleted"}


@app.put("/ticket/{ticket_id}")
def update_ticket(ticket_id: int, updated_ticket: Ticket, user=Depends(get_current_user)):
    db = SessionLocal()

    ticket = db.query(TicketDB).filter(
        TicketDB.id == ticket_id,
        TicketDB.owner == user
    ).first()

    if not ticket:
        db.close()
        raise HTTPException(status_code=404, detail="Ticket not found")

    X = vectorizer.transform([updated_ticket.issue])

    ticket.issue = updated_ticket.issue
    ticket.category = category_model.predict(X)[0]
    ticket.priority = priority_model.predict(X)[0]

    db.commit()
    db.refresh(ticket)
    db.close()

    return ticket

# ---------------- UPDATE TICKET STATUS ----------------

@app.put("/ticket-status/{ticket_id}")
def update_ticket_status(
    ticket_id: int,
    status: str,
    admin=Depends(get_admin_user)
):

    db = SessionLocal()

    ticket = db.query(TicketDB).filter(
        TicketDB.id == ticket_id
    ).first()

    if not ticket:
        db.close()

        raise HTTPException(
            status_code=404,
            detail="Ticket not found"
        )

    ticket.status = status

    db.commit()
    db.refresh(ticket)

    db.close()

    return {
        "message": "Status updated",
        "status": ticket.status
    }

@app.get("/admin/users")
def get_all_users(admin=Depends(get_admin_user)):
    db = SessionLocal()
    users = db.query(UserDB).all()
    db.close()
    return users


@app.get("/admin/tickets")
def get_all_tickets(admin=Depends(get_admin_user)):
    db = SessionLocal()
    tickets = db.query(TicketDB).all()
    db.close()
    return tickets


@app.get("/admin/stats")
def get_stats(admin=Depends(get_admin_user)):
    db = SessionLocal()

    return {
        "users": db.query(UserDB).count(),
        "tickets": db.query(TicketDB).count(),
        "high_priority": db.query(TicketDB).filter(
            TicketDB.priority == "High"
        ).count()
    }

@app.put("/ticket-assign/{ticket_id}")
def assign_ticket(ticket_id: int, assigned_to: str, admin=Depends(get_admin_user)):

    db = SessionLocal()

    ticket = db.query(TicketDB).filter(TicketDB.id == ticket_id).first()

    if not ticket:
        db.close()
        raise HTTPException(status_code=404, detail="Ticket not found")

    ticket.assigned_to = assigned_to

    db.commit()
    db.refresh(ticket)
    db.close()

    return {
        "message": "Ticket assigned",
        "assigned_to": ticket.assigned_to
    }