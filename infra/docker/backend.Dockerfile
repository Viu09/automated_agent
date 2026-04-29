FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY apps/backend /app
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir .
RUN chmod +x /app/scripts/start-backend.sh /app/scripts/start-worker.sh /app/scripts/start-scheduler.sh

EXPOSE 8000

CMD ["/app/scripts/start-backend.sh"]
