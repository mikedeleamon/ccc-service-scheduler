from fastapi import FastAPI
from app.api import people, services, schedule, import_excel

app = FastAPI(title="Church Scheduler API")

app.include_router(people.router, prefix="/people")
app.include_router(services.router, prefix="/services")
app.include_router(schedule.router, prefix="/schedule")
app.include_router(import_excel.router, prefix="/import")