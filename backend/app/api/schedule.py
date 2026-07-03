from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from collections import defaultdict
from calendar import monthrange
from datetime import date, timedelta
from typing import List, Optional
from pydantic import BaseModel

from app.deps import get_db
from app.models import Service, Person, Officiant_Assignment, Lesson
from app.scheduling.calendar import generate_services
from app.scheduling.solver import generate_schedule

router = APIRouter()


class AutoScheduleRequest(BaseModel):
    parish: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class BulkDeleteRequest(BaseModel):
    week_starts: List[date]
    parish: Optional[str] = None


def _week_bounds(d: date):
    monday = d - timedelta(days=d.weekday())
    sunday = monday + timedelta(days=6)
    return monday, sunday


def _build_schedule_response(services: list, db: Session) -> List[dict]:
    if not services:
        return []

    svc_ids = [s.id for s in services]

    # Bulk-load all assignments for the given services in one query.
    all_assignments = (
        db.query(Officiant_Assignment)
        .filter(Officiant_Assignment.service_id.in_(svc_ids))
        .all()
    )

    # Bulk-load the names of every person referenced by those assignments.
    person_ids = {a.person_id for a in all_assignments}
    person_map: dict[int, str] = {}
    if person_ids:
        people = db.query(Person.id, Person.first_name, Person.last_name).filter(
            Person.id.in_(person_ids)
        ).all()
        person_map = {p.id: f"{p.first_name} {p.last_name}" for p in people}

    # Index assignments by service_id so we can look them up in O(1).
    assignments_by_svc: dict[int, list] = defaultdict(list)
    for a in all_assignments:
        assignments_by_svc[a.service_id].append(a)

    # Bulk-load lessons (universal, keyed by date) for every date in range.
    svc_dates = {s.date for s in services}
    lessons_by_date: dict = {}
    if svc_dates:
        lessons = db.query(Lesson).filter(Lesson.date.in_(svc_dates)).all()
        lessons_by_date = {l.date: l for l in lessons}

    # Group services into calendar weeks.
    weeks: dict = defaultdict(list)
    for svc in services:
        monday, _ = _week_bounds(svc.date)
        weeks[monday].append(svc)

    result = []
    for week_start in sorted(weeks):
        week_end = week_start + timedelta(days=6)
        days = []
        for svc in sorted(weeks[week_start], key=lambda s: s.date):
            officiants = [
                {
                    "id": a.id,
                    "role": a.role,
                    "personName": person_map.get(a.person_id, "Unknown"),
                    "personId": a.person_id,
                    "confirmed": a.confirmed,
                }
                for a in assignments_by_svc[svc.id]
            ]
            lesson = lessons_by_date.get(svc.date)
            days.append({
                "serviceId": svc.id,
                "dayOfWeek": svc.date.strftime("%A"),
                "date": svc.date.isoformat(),
                "time": svc.time,
                "serviceType": svc.service_type,
                "officiants": officiants,
                "firstLessonVerse": lesson.first_lesson if lesson else None,
                "secondLessonVerse": lesson.second_lesson if lesson else None,
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


@router.get("")
def get_schedules(
    parish: str = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
):
    q = db.query(Service)
    if parish:
        q = q.filter(Service.parish == parish)
    if start_date is not None:
        q = q.filter(Service.date >= start_date)
    if end_date is not None:
        q = q.filter(Service.date <= end_date)
    services = q.order_by(Service.date).all()
    return _build_schedule_response(services, db)


@router.post("")
def auto_schedule(body: Optional[AutoScheduleRequest] = None, db: Session = Depends(get_db)):
    body = body or AutoScheduleRequest()

    # Default range = the current calendar month.
    today = date.today()
    start = body.start_date or date(today.year, today.month, 1)
    if body.end_date:
        end = body.end_date
    else:
        end = date(start.year, start.month, monthrange(start.year, start.month)[1])
    if start < today:
        raise HTTPException(status_code=400, detail="Cannot generate a schedule for past dates.")
    if end < start:
        raise HTTPException(status_code=400, detail="end_date must not be before start_date.")
    parish = body.parish

    # 1. Generate the recurring service calendar.
    #    Key on (date, time) so regenerating the same range overwrites the
    #    existing service record at that slot instead of creating a duplicate.
    existing_q = db.query(Service).filter(Service.date >= start, Service.date <= end)
    if parish:
        existing_q = existing_q.filter(Service.parish == parish)
    existing_by_slot = {(s.date, s.time): s for s in existing_q.all()}

    for spec in generate_services(start, end, parish):
        key = (spec["date"], spec["time"])
        if key in existing_by_slot:
            # Update service_type in case it changed (e.g. Easter overrides a Sunday)
            existing_by_slot[key].service_type = spec["service_type"]
        else:
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
    #    Do the delete + re-insert in a single transaction so a concurrent or
    #    failed run can never leave the schedule half-rebuilt.
    svc_ids = [s.id for s in services]
    try:
        confirmed = (
            db.query(Officiant_Assignment)
            .filter(
                Officiant_Assignment.service_id.in_(svc_ids),
                Officiant_Assignment.confirmed == True,
            )
            .all()
        )
        confirmed_slots = {(a.service_id, a.role) for a in confirmed}

        db.query(Officiant_Assignment).filter(
            Officiant_Assignment.service_id.in_(svc_ids),
            Officiant_Assignment.confirmed == False,
        ).delete(synchronize_session=False)

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
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to save the generated schedule. No changes were made.")

    # 4. Build the response (weeks + any positions that couldn't be filled).
    svc_meta = {s.id: s for s in services}
    unfilled_out = [
        {
            "serviceId": u["service_id"],
            "role": u["role"],
            "reason": u.get("reason"),
            "date": svc_meta[u["service_id"]].date.isoformat() if u["service_id"] in svc_meta else None,
            "serviceType": svc_meta[u["service_id"]].service_type if u["service_id"] in svc_meta else None,
        }
        for u in unfilled
    ]

    return {
        "weeks": _build_schedule_response(services, db),
        "unfilled": unfilled_out,
    }


@router.delete("")
def bulk_delete_schedules(body: BulkDeleteRequest, db: Session = Depends(get_db)):
    if not body.week_starts:
        return {"deleted": 0}

    # Collect all service IDs that fall within any of the selected weeks.
    svc_ids: list[int] = []
    for week_start in body.week_starts:
        week_end = week_start + timedelta(days=6)
        q = db.query(Service.id).filter(Service.date >= week_start, Service.date <= week_end)
        if body.parish:
            q = q.filter(Service.parish == body.parish)
        svc_ids.extend(row[0] for row in q.all())

    if not svc_ids:
        return {"deleted": 0}

    db.query(Officiant_Assignment).filter(
        Officiant_Assignment.service_id.in_(svc_ids)
    ).delete(synchronize_session=False)
    deleted = db.query(Service).filter(Service.id.in_(svc_ids)).delete(synchronize_session=False)
    db.commit()
    return {"deleted": deleted}
