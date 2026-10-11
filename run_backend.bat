@echo off
echo ========================================================
echo   BlockVerify - Starting FastAPI Backend Server
echo ========================================================
cd /d "%~dp0"
call .\venv\Scripts\activate
python -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000 --reload
pause
