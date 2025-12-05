@echo off
echo Starting AI Code Editor...
echo.

echo Starting Backend Server...
start "AI Editor - Backend" cmd /k "cd ai-code-editor\server && npm run dev"

timeout /t 3 /nobreak > nul

echo Starting Frontend Client...
start "AI Editor - Frontend" cmd /k "cd ai-code-editor\client && npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:4000
echo Frontend: http://localhost:5173
echo.
pause
