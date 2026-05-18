from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import people, services, schedule, import_excel, assignments

app = FastAPI(title="Church Scheduler API")

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