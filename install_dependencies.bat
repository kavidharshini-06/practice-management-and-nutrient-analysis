@echo off
echo ==========================================
echo Restoring project dependencies...
echo ==========================================

echo Installing backend dependencies...
cd backend
call npm install
cd ..

echo Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo ==========================================
echo Installation complete!
echo ==========================================
pause
