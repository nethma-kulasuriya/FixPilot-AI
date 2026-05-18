from sqlalchemy import Column, Integer, String
from database import Base

class TicketDB(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    issue = Column(String)
    category = Column(String)
    priority = Column(String)