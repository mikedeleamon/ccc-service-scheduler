from sqlalchemy import Column, Integer, String, Date, Boolean, ForeignKey, JSON, true
from sqlalchemy.orm import relationship
from app.database import Base

class Person(Base):
    __tablename__ = "people"

    id = Column(Integer, primary_key=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    birth_date = Column(Date)
    gender = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    parish = Column(String, nullable=True)
    email = Column(String, unique=True)
    rank = Column(String, nullable=False)          # ["superior evangelist", "cape elder"]
    availability = Column(JSON)   # {"sundays": true, "wednesdays": true []}

class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True)
    date = Column(Date)
    service_type = Column(String)

class Officiant_Assignment(Base):
    __tablename__ = "officiant_assignments"

    id = Column(Integer, primary_key=True)
    service_id = Column(Integer, ForeignKey("services.id"))
    person_id = Column(Integer, ForeignKey("people.id"))
    role = Column(String)
    confirmed = Column(Boolean, default=False)
