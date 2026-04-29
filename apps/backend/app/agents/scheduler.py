from celery.schedules import crontab


class SchedulerConfig:
    CELERY_BEAT_SCHEDULE = {
        "weather-agent-hourly": {
            "task": "app.workers.tasks.execute_agent_by_key_task",
            "schedule": crontab(minute=0),
            "args": ("weather",),
        },
        "news-agent-morning": {
            "task": "app.workers.tasks.execute_agent_by_key_task",
            "schedule": crontab(minute=0, hour=7),
            "args": ("news",),
        },
        "productivity-agent-weekday": {
            "task": "app.workers.tasks.execute_agent_by_key_task",
            "schedule": crontab(minute=0, hour="9,14,18", day_of_week="1-5"),
            "args": ("productivity",),
        },
    }

