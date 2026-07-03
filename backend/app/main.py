from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from app.api import people, services, schedule, import_excel, assignments, lessons
from app.deps import get_db
from app.models import Person

app = FastAPI(title="Church Scheduler API", redirect_slashes=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(people.router, prefix="/people")
app.include_router(services.router, prefix="/services")
app.include_router(schedule.router, prefix="/schedule")
app.include_router(import_excel.router, prefix="/import")
app.include_router(assignments.router, prefix="/assignments")
app.include_router(lessons.router, prefix="/lessons")


@app.get("/parishes", response_model=List[str])
def get_parishes(db: Session = Depends(get_db)):
    rows = db.query(Person.parish).filter(Person.parish.isnot(None), Person.parish != "").distinct().all()
    return sorted([r[0] for r in rows])