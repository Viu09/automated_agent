#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${ROOT_DIR}/.env"
ENV_EXAMPLE_FILE="${ROOT_DIR}/.env.example"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required but was not found in PATH."
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose v2 is required. Please install or enable 'docker compose'."
  exit 1
fi

if [ ! -f "${ENV_FILE}" ]; then
  if [ ! -f "${ENV_EXAMPLE_FILE}" ]; then
    echo "Missing ${ENV_EXAMPLE_FILE}, cannot create a default .env file."
    exit 1
  fi

  cp "${ENV_EXAMPLE_FILE}" "${ENV_FILE}"
  echo "Created .env from .env.example"
fi

echo "Starting Life OS stack from ${ROOT_DIR}"
docker compose up --build "$@"
