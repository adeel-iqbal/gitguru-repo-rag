#!/bin/bash

ROOT="$(cd "$(dirname "$0")" && pwd)"

if [ -f "$ROOT/.pids" ]; then
  read BACKEND_PID FRONTEND_PID < "$ROOT/.pids"
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  rm "$ROOT/.pids"
  echo "Stopped backend (PID $BACKEND_PID) and frontend (PID $FRONTEND_PID)"
else
  # Fallback: kill by port
  kill $(lsof -ti :8000) 2>/dev/null && echo "Stopped backend"
  kill $(lsof -ti :3000) 2>/dev/null && echo "Stopped frontend"
fi
