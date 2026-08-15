@echo off
echo ==========================================
echo Cleaning project to prepare for upload...
echo ==========================================

echo Deleting backend node_modules...
if exist "backend\node_modules" rd /s /q "backend\node_modules"

echo Deleting frontend node_modules...
if exist "frontend\node_modules" rd /s /q "frontend\node_modules"

echo Deleting frontend dist/build folder...
if exist "frontend\dist" rd /s /q "frontend\dist"

echo ==========================================
echo Clean up complete!
echo The folder is now lightweight and ready to be zipped/uploaded to GitHub.
echo To run the project again later, run 'npm install' in both backend/ and frontend/ folders.
echo ==========================================
pause
