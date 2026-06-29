from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from typing import List, Optional

from app.deps import get_db
from app.models import Officiant_Assignment, Service, Person
from app.schemas import AssignmentCreate, AssignmentUpdate, AssignmentOut

router = APIRouter()


def _conflicting_service_ids(db: Session, person_id: int, svc: Service, exclude_service_id: int) -> bool:
    """True if the person is already assigned to a *different* service at the
    same date and time (a real-world scheduling clash)."""
    clashes = (
        db.query(Officiant_Assignment)
        .join(Service, Service.id == Officiant_Assignment.service_id)
        .filter(
            Officiant_Assignment.person_id == person_id,
            Officiant_Assignment.service_id != exclude_service_id,
            Service.date == svc.date,
        )
    )
    for other in clashes.all():
        other_svc = db.query(Service).filter(Service.id == other.service_id).first()
        if other_svc and (other_svc.time or None) == (svc.time or None):
            return True
    return False


@router.get("", response_model=List[AssignmentOut])
def get_assignments(
    service_id: Optional[int] = None,
    person_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
):
    q = db.query(Officiant_Assignment)
    if service_id is not None:
        q = q.filter(Officiant_Assignment.service_id == service_id)
    if person_id is not None:
        q = q.filter(Officiant_Assignment.person_id == person_id)
    if start_date is not None or end_date is not None:
        q = q.join(Service, Service.id == Officiant_Assignment.service_id)
        if start_date is not None:
            q = q.filter(Service.date >= start_date)
        if end_date is not None:
            q = q.filter(Service.date <= end_date)
    return q.all()


@router.post("", response_model=AssignmentOut, status_code=201)
def create_assignment(body: AssignmentCreate, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == body.service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    if not db.query(Person).filter(Person.id == body.person_id).first():
        raise HTTPException(status_code=404, detail="Person not found")

    # Each role may only be filled once per service.
    if (
        db.query(Officiant_Assignment)
        .filter(
            Officiant_Assignment.service_id == body.service_id,
            Officiant_Assignment.role == body.role,
        )
        .first()
    ):
        raise HTTPException(
            status_code=409,
            detail=f"The role “{body.role}” is already filled for this service.",
        )

    # The same person can't officiate two different services at the same time.
    if _conflicting_service_ids(db, body.person_id, service, exclude_service_id=body.service_id):
        raise HTTPException(
            status_code=409,
            detail="That person is already assigned to another service at the same date and time.",
        )

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

    data = body.model_dump(exclude_unset=True)
    new_role = data.get("role", assignment.role)
    new_person = data.get("person_id", assignment.person_id)

    # Don't let an edit collide with another assignment's role on the same service.
    if "role" in data and new_role != assignment.role:
        clash = (
            db.query(Officiant_Assignment)
            .filter(
                Officiant_Assignment.service_id == assignment.service_id,
                Officiant_Assignment.role == new_role,
                Officiant_Assignment.id != assignment.id,
            )
            .first()
        )
        if clash:
            raise HTTPException(
                status_code=409,
                detail=f"The role “{new_role}” is already filled for this service.",
            )

    # Re-check time conflicts if the person changed.
    if "person_id" in data and new_person != assignment.person_id:
        service = db.query(Service).filter(Service.id == assignment.service_id).first()
        if service and _conflicting_service_ids(db, new_person, service, exclude_service_id=assignment.service_id):
            raise HTTPException(
                status_code=409,
                detail="That person is already assigned to another service at the same date and time.",
            )

    for field, value in data.items():
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
