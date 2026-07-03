from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from typing import List, Optional

from app.deps import get_db
from app.models import Lesson
from app.schemas import LessonCreate, LessonUpdate, LessonOut
from app.scheduling.calendar import service_for_date

router = APIRouter()


def _to_out(lesson: Lesson) -> dict:
    result = service_for_date(lesson.date)
    service_type, time = result if result else (None, None)
    return {
        "id": lesson.id,
        "date": lesson.date,
        "dayOfWeek": lesson.date.strftime("%A"),
        "time": time,
        "serviceType": service_type,
        "first_lesson": lesson.first_lesson,
        "second_lesson": lesson.second_lesson,
    }


@router.get("", response_model=List[LessonOut])
def get_lessons(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
):
    q = db.query(Lesson)
    if start_date is not None:
        q = q.filter(Lesson.date >= start_date)
    if end_date is not None:
        q = q.filter(Lesson.date <= end_date)
    lessons = q.order_by(Lesson.date).all()
    return [_to_out(l) for l in lessons]


@router.post("", response_model=LessonOut, status_code=201)
def create_lesson(body: LessonCreate, db: Session = Depends(get_db)):
    if not service_for_date(body.date):
        raise HTTPException(status_code=400, detail="No service occurs on that date.")
    if db.query(Lesson).filter(Lesson.date == body.date).first():
        raise HTTPException(status_code=409, detail="A lesson already exists for that date.")
    lesson = Lesson(**body.model_dump())
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return _to_out(lesson)


@router.put("/{lesson_id}", response_model=LessonOut)
def update_lesson(lesson_id: int, body: LessonUpdate, db: Session = Depends(get_db)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    data = body.model_dump(exclude_unset=True)
    new_date = data.get("date", lesson.date)
    if not service_for_date(new_date):
        raise HTTPException(status_code=400, detail="No service occurs on that date.")
    if "date" in data and new_date != lesson.date:
        if db.query(Lesson).filter(Lesson.date == new_date, Lesson.id != lesson_id).first():
            raise HTTPException(status_code=409, detail="A lesson already exists for that date.")

    for field, value in data.items():
        setattr(lesson, field, value)
    db.commit()
    db.refresh(lesson)
    return _to_out(lesson)


@router.delete("/{lesson_id}", status_code=204)
def delete_lesson(lesson_id: int, db: Session = Depends(get_db)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    db.delete(lesson)
    db.commit()
