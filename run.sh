#!/bin/bash

# Kill background processes on exit
trap "kill 0" EXIT

echo "Starting Leveling System..."

# Start backend
echo "Starting backend on http://localhost:8000"
cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000 &

# Start frontend
echo "Starting frontend on http://localhost:5173"
cd frontend && npm run dev &

# Wait for both processes
wait
