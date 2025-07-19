@echo off
echo Installing ChatGPT Clone Dependencies...
echo.

echo [1/3] Installing backend dependencies...
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)

echo.
echo [2/3] Installing frontend dependencies...
cd clientapp
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)

cd ..
echo.
echo [3/3] Installation complete!
echo.
echo Next steps:
echo 1. Set your OpenAI API key in .env file
echo 2. Run: npm run dev
echo.
pause