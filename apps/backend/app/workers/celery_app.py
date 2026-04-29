from celery import Celery

from app.agents.scheduler import SchedulerConfig
from app.core.config import settings

celery_app = Celery(
    "life_os",
    broker=settings.redis_url,
    backend=settings.redis_url,
)
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    beat_schedule=SchedulerConfig.CELERY_BEAT_SCHEDULE,
)
celery_app.autodiscover_tasks(["app.workers"])

