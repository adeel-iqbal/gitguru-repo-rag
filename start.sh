#!/bin/bash

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "Starting GitHub RAG..."

# Backend
cd "$ROOT/backend"
source venv/bin/activate
nohup python main.py > server.log 2>&1 &
BACKEND_PID=$!
echo "Backend started (PID $BACKEND_PID) → http://localhost:8000"

# Frontend
cd "$ROOT/frontend"
nohup npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend started (PID $FRONTEND_PID) → http://localhost:3000"

echo ""
echo "Logs: backend/server.log | frontend/frontend.log"
echo "Stop with: ./stop.sh"

# Save PIDs for stop script
echo "$BACKEND_PID $FRONTEND_PID" > "$ROOT/.pids"
