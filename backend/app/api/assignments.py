from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.deps import get_db
from app.models import Officiant_Assignment, Service, Person
from app.schemas import AssignmentCreate, AssignmentUpdate, AssignmentOut

router = APIRouter()


@router.get("/", response_model=List[AssignmentOut])
def get_assignments(service_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(Officiant_Assignment)
    if service_id is not None:
        q = q.filter(Officiant_Assignment.service_id == service_id)
    return q.all()


@router.post("/", response_model=AssignmentOut, status_code=201)
def create_assignment(body: AssignmentCreate, db: Session = Depends(get_db)):
    if not db.query(Service).filter(Service.id == body.service_id).first():
        raise HTTPException(status_code=404, detail="Service not found")
    if not db.query(Person).filter(Person.id == body.person_id).first():
        raise HTTPException(status_code=404, detail="Person not found")
    assignment = Officiant_Assignment(**body.model_dump(), confirmed=False)
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


@router.put("/{assignment_id}", response_model=AssignmentOut)
def update_assignment(assignment_id: int, body: AssignmentUpdate, db: Session = Depends(get_db)):
    assignment = db.query(Officiant_Assignment).filter(Officiant_Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(assignment, field, value)
    db.commit()
    db.refresh(assignment)
    return assignment


@router.delete("/{assignment_id}", status_code=204)
def delete_assignment(assignment_id: int, db: Session = Depends(get_db)):
    assignment = db.query(Officiant_Assignment).filter(Officiant_Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    db.delete(assignment)
    db.commit()
