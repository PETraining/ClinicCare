#!/usr/bin/env bash
# Starts the full ReferralIQ stack: all backend containers plus the Angular
# frontend, all via docker-compose. Safe to re-run.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

wait_for() {
  local url="$1" label="$2" attempts=0
  until curl -sf "$url" >/dev/null 2>&1 || [ "$attempts" -ge 60 ]; do
    sleep 1
    attempts=$((attempts + 1))
  done
  if ! curl -sf "$url" >/dev/null 2>&1; then
    echo "$label did not become ready in time." >&2
    return 1
  fi
}

echo "==> Building and starting backend and frontend containers..."
docker compose up -d --build

echo "==> Waiting for API Gateway (http://localhost:8000)..."
if ! wait_for "http://localhost:8000/api/doctors" "API Gateway"; then
  echo "Check logs with: docker compose logs" >&2
  exit 1
fi
echo "    Backend is up."

echo "==> Waiting for frontend (http://localhost:4200)..."
if ! wait_for "http://localhost:4200" "Frontend"; then
  echo "Check logs with: docker compose logs frontend" >&2
  exit 1
fi
echo "    Frontend is up."

cat <<EOF

ReferralIQ is running:
  Frontend:    http://localhost:4200
  API Gateway: http://localhost:8000

Logs:  docker compose logs -f
Stop with: ./stop.sh
EOF
