@echo off
echo Starting GitGuru...

:: Backend
cd backend
call venv\Scripts\activate
start "GitGuru Backend" cmd /k "python main.py"
cd ..

:: Frontend
cd frontend
start "GitGuru Frontend" cmd /k "npm run dev"
cd ..

echo.
echo Backend running at http://localhost:8000
echo Frontend running at http://localhost:3000
echo.
echo Close the opened terminal windows to stop the servers.
