from sqlalchemy import Column, Integer, String, Date, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Person(Base):
    __tablename__ = "people"

    id = Column(Integer, primary_key=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    birth_date = Column(String, nullable=True)   # stored as MM-DD string
    gender = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    parish = Column(String, nullable=True)
    email = Column(String, unique=True, nullable=True)
    rank = Column(String, nullable=False)
    availability = Column(JSON, nullable=True)

class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True)
    date = Column(Date)
    service_type = Column(String)
    time = Column(String, nullable=True)   # HH:MM, e.g. "10:00"
    parish = Column(String, nullable=True)

class Officiant_Assignment(Base):
    __tablename__ = "officiant_assignments"

    id = Column(Integer, primary_key=True)
    service_id = Column(Integer, ForeignKey("services.id"))
    person_id = Column(Integer, ForeignKey("people.id"))
    role = Column(String)
    confirmed = Column(Boolean, default=False)
