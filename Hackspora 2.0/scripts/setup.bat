@echo off
echo ===================================================
echo   OBSERVA Multimodal Accessibility OS Setup
echo ===================================================

echo [1/3] Installing Python backend dependencies...
pip install -r backend\requirements.txt

echo [2/3] Installing Frontend dependencies...
cd frontend
call npm install
cd ..

echo [3/3] Running Backend Tests...
python scripts\test_backend.py

echo.
echo ===================================================
echo   OBSERVA Setup Completed Successfully!
echo   To run the application:
echo     1. Start backend:  python backend\run.py
echo     2. Start frontend: cd frontend ^&^& npm run dev
echo ===================================================
