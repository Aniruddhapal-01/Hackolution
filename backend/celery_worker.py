"""
Celery worker entrypoint.
Run with: celery -A celery_worker.celery_app worker --loglevel=info
"""
from tasks import celery_app

if __name__ == "__main__":
    celery_app.start()
