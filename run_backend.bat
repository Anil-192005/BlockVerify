@echo off
echo ========================================================
echo   BlockVerify - Starting FastAPI Backend Server
echo ========================================================
cd /d "%~dp0"
call .\venv\Scripts\activate
python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
pause
