from celery import Celery

celery = Celery(
    "scheduler",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0"
)

@celery.task
def run_scheduler():
    print("Running scheduler...")
