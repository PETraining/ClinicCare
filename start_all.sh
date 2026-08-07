#!/usr/bin/env bash
# Starts the full ReferralIQ stack: all backend services (docker-compose)
# plus the Angular frontend (ng serve). Safe to re-run — skips the frontend
# if it's already listening on :4200.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

RUN_DIR="$SCRIPT_DIR/.run"
mkdir -p "$RUN_DIR"

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

echo "==> Building and starting backend containers..."
docker compose up -d --build

echo "==> Waiting for API Gateway (http://localhost:8000)..."
if ! wait_for "http://localhost:8000/api/doctors" "API Gateway"; then
  echo "Check logs with: docker compose logs" >&2
  exit 1
fi
echo "    Backend is up."

if lsof -ti:4200 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "==> Frontend already running on :4200, leaving it as-is."
else
  echo "==> Starting Angular frontend..."
  (
    cd "$SCRIPT_DIR/frontend"
    nohup ./node_modules/.bin/ng serve --port 4200 > "$RUN_DIR/frontend.log" 2>&1 &
  )
  echo "==> Waiting for frontend (http://localhost:4200)..."
  if ! wait_for "http://localhost:4200" "Frontend"; then
    echo "Check logs at: $RUN_DIR/frontend.log" >&2
    exit 1
  fi
  echo "    Frontend is up."
fi

cat <<EOF

ReferralIQ is running:
  Frontend:    http://localhost:4200
  API Gateway: http://localhost:8000

Backend logs:  docker compose logs -f
Frontend logs: $RUN_DIR/frontend.log
Stop with:     ./stop.sh
EOF
