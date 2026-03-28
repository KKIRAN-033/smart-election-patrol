@echo off
echo Starting backend server...
start cmd /k "cd backend && npm run dev"

echo Starting frontend server...
start cmd /k "cd frontend && npm run dev"

echo Both servers are starting up! Check the new windows.
