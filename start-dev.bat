@echo off
REM Samsara RMS - Development Startup Script for Windows

echo.
echo ===============================================
echo  Samsara RMS - Development Environment Setup
echo ===============================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo Error installing dependencies
        exit /b 1
    )
    echo.
)

REM Check if .env.local exists
if not exist ".env.local" (
    echo.
    echo WARNING: .env.local not found!
    echo Please create .env.local with your configuration.
    echo Use .env.example as a template.
    echo.
)

REM Display menu
echo.
echo Choose how to start the development environment:
echo.
echo 1 - Run Website Only (npm run dev)
echo 2 - Run Website + Backend (npm run dev:all)
echo 3 - Build Project
echo 4 - Exit
echo.

set /p choice="Enter your choice [1-4]: "

if "%choice%"=="1" (
    echo.
    echo Starting website only on http://localhost:3000...
    echo.
    call npm run dev
) else if "%choice%"=="2" (
    echo.
    echo Starting website and backend...
    echo Website: http://localhost:3000
    echo.
    call npm run dev:all
) else if "%choice%"=="3" (
    echo.
    echo Building project...
    echo.
    call npm run build:all
) else if "%choice%"=="4" (
    echo Exiting...
    exit /b 0
) else (
    echo Invalid choice
    exit /b 1
)
