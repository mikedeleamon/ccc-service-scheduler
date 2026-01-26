from fastapi import APIRouter, Depends
from app.scheduling.solver import generate_schedule

router = APIRouter()

@router.post("/")
def auto_schedule():
    # normally load from DB
    services = [{"id": 1}, {"id": 2}]
    people = [{"id": 10}, {"id": 11}, {"id": 12}]

    assignments = generate_schedule(services, people, "usher")
    print(assignments)
    return {"assignments": assignments}
