from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from collections import defaultdict
from calendar import monthrange
from datetime import date, timedelta
from typing import List, Optional
from pydantic import BaseModel

from app.deps import get_db
from app.models import Service, Person, Officiant_Assignment
from app.scheduling.calendar import generate_services
from app.scheduling.solver import generate_schedule

router = APIRouter()


class AutoScheduleRequest(BaseModel):
    parish: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


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
def auto_schedule(body: Optional[AutoScheduleRequest] = None, db: Session = Depends(get_db)):
    body = body or AutoScheduleRequest()

    # Default range = the current calendar month.
    today = date.today()
    start = body.start_date or date(today.year, today.month, 1)
    if body.end_date:
        end = body.end_date
    else:
        end = date(start.year, start.month, monthrange(start.year, start.month)[1])
    if end < start:
        raise HTTPException(status_code=400, detail="end_date must not be before start_date.")
    parish = body.parish

    # 1. Generate the recurring service calendar, skipping any that already exist.
    existing_q = db.query(Service).filter(Service.date >= start, Service.date <= end)
    if parish:
        existing_q = existing_q.filter(Service.parish == parish)
    existing_keys = {(s.date, s.service_type) for s in existing_q.all()}

    for spec in generate_services(start, end, parish):
        if (spec["date"], spec["service_type"]) not in existing_keys:
            db.add(Service(
                date=spec["date"],
                service_type=spec["service_type"],
                time=spec["time"],
                parish=parish,
            ))
    db.commit()

    # 2. Load the services in range + the candidate people.
    svc_q = db.query(Service).filter(Service.date >= start, Service.date <= end)
    if parish:
        svc_q = svc_q.filter(Service.parish == parish)
    services = svc_q.order_by(Service.date).all()

    people_q = db.query(Person)
    if parish:
        people_q = people_q.filter(Person.parish == parish)
    people = people_q.all()

    if not services:
        raise HTTPException(status_code=400, detail="No services in the selected range.")
    if not people:
        raise HTTPException(status_code=400, detail="No people for this parish. Import a roster first.")

    svc_dicts = [
        {"id": s.id, "date": s.date, "service_type": s.service_type}
        for s in services
    ]
    people_dicts = [
        {
            "id": p.id,
            "gender": p.gender,
            "rank": p.rank,
            "availability": p.availability,
            "is_shepherd": p.is_shepherd,
        }
        for p in people
    ]

    assignments, unfilled = generate_schedule(svc_dicts, people_dicts)

    # 3. Replace unconfirmed assignments in range; keep confirmed ones untouched.
    svc_ids = [s.id for s in services]
    db.query(Officiant_Assignment).filter(
        Officiant_Assignment.service_id.in_(svc_ids),
        Officiant_Assignment.confirmed == False,
    ).delete(synchronize_session=False)

    confirmed = (
        db.query(Officiant_Assignment)
        .filter(
            Officiant_Assignment.service_id.in_(svc_ids),
            Officiant_Assignment.confirmed == True,
        )
        .all()
    )
    confirmed_slots = {(a.service_id, a.role) for a in confirmed}

    for a in assignments:
        if (a["service_id"], a["role"]) in confirmed_slots:
            continue  # don't overwrite a manually-confirmed position
        db.add(Officiant_Assignment(
            service_id=a["service_id"],
            person_id=a["person_id"],
            role=a["role"],
            confirmed=False,
        ))
    db.commit()

    # 4. Build the response (weeks + any positions that couldn't be filled).
    svc_meta = {s.id: s for s in services}
    unfilled_out = [
        {
            "serviceId": u["service_id"],
            "role": u["role"],
            "date": svc_meta[u["service_id"]].date.isoformat() if u["service_id"] in svc_meta else None,
            "serviceType": svc_meta[u["service_id"]].service_type if u["service_id"] in svc_meta else None,
        }
        for u in unfilled
    ]

    return {
        "weeks": _build_schedule_response(services, db),
        "unfilled": unfilled_out,
    }
