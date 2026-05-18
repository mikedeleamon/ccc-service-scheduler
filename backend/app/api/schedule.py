from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from collections import defaultdict
from datetime import date, timedelta
from typing import List

from app.deps import get_db
from app.models import Service, Person, Officiant_Assignment
from app.scheduling.solver import generate_schedule

router = APIRouter()


def _week_bounds(d: date):
    monday = d - timedelta(days=d.weekday())
    sunday = monday + timedelta(days=6)
    return monday, sunday


def _build_schedule_response(services: list, db: Session) -> List[dict]:
    weeks: dict = defaultdict(list)
    for svc in services:
        monday, _ = _week_bounds(svc.date)
        weeks[monday].append(svc)

    result = []
    for week_start in sorted(weeks):
        week_end = week_start + timedelta(days=6)
        days = []
        for svc in sorted(weeks[week_start], key=lambda s: s.date):
            assignments = (
                db.query(Officiant_Assignment)
                .filter(Officiant_Assignment.service_id == svc.id)
                .all()
            )
            officiants = []
            for a in assignments:
                person = db.query(Person).filter(Person.id == a.person_id).first()
                officiants.append({
                    "id": a.id,
                    "role": a.role,
                    "personName": f"{person.first_name} {person.last_name}" if person else "Unknown",
                    "personId": a.person_id,
                    "confirmed": a.confirmed,
                })
            days.append({
                "serviceId": svc.id,
                "dayOfWeek": svc.date.strftime("%A"),
                "date": svc.date.isoformat(),
                "time": svc.time,
                "serviceType": svc.service_type,
                "officiants": officiants,
            })
        result.append({
            "id": week_start.isoformat(),
            "startDate": week_start.isoformat(),
            "endDate": week_end.isoformat(),
            "month": week_start.strftime("%B"),
            "year": str(week_start.year),
            "days": days,
        })
    return result


@router.get("/")
def get_schedules(parish: str = None, db: Session = Depends(get_db)):
    q = db.query(Service)
    if parish:
        q = q.filter(Service.parish == parish)
    services = q.order_by(Service.date).all()
    return _build_schedule_response(services, db)


@router.post("/")
def auto_schedule(db: Session = Depends(get_db)):
    services = db.query(Service).all()
    people = db.query(Person).all()

    if not services:
        raise HTTPException(status_code=400, detail="No services in the database. Add services first.")
    if not people:
        raise HTTPException(status_code=400, detail="No people in the database. Import a roster first.")

    svc_dicts = [{"id": s.id} for s in services]
    people_dicts = [{"id": p.id} for p in people]

    assignments = generate_schedule(svc_dicts, people_dicts, "usher")

    db.query(Officiant_Assignment).filter(
        Officiant_Assignment.confirmed == False
    ).delete()

    for a in assignments:
        db.add(Officiant_Assignment(
            service_id=a["service_id"],
            person_id=a["person_id"],
            role=a["role"],
            confirmed=False,
        ))

    db.commit()

    updated_services = db.query(Service).order_by(Service.date).all()
    return _build_schedule_response(updated_services, db)
