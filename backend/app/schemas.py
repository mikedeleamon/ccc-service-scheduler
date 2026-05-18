from pydantic import BaseModel, ConfigDict
from typing import Optional, Any
from datetime import date  # still used by ServiceBase


class PersonBase(BaseModel):
    first_name: str
    last_name: str
    birth_date: Optional[str] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    parish: Optional[str] = None
    email: Optional[str] = None
    rank: str
    availability: Optional[Any] = None


class PersonCreate(PersonBase):
    pass


class PersonUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    birth_date: Optional[str] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    parish: Optional[str] = None
    email: Optional[str] = None
    rank: Optional[str] = None
    availability: Optional[Any] = None


class PersonOut(PersonBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class ServiceBase(BaseModel):
    date: date
    service_type: str
    time: Optional[str] = None
    parish: Optional[str] = None


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    date: Optional[date] = None
    service_type: Optional[str] = None
    time: Optional[str] = None
    parish: Optional[str] = None


class ServiceOut(ServiceBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class AssignmentCreate(BaseModel):
    service_id: int
    person_id: int
    role: str


class AssignmentUpdate(BaseModel):
    person_id: Optional[int] = None
    role: Optional[str] = None
    confirmed: Optional[bool] = None


class AssignmentOut(BaseModel):
    id: int
    service_id: int
    person_id: int
    role: str
    confirmed: bool
    model_config = ConfigDict(from_attributes=True)
