@echo off
title PARAISOS - Servidor local
cd /d "%~dp0"

REM Servidor HTTP basado en PowerShell (HttpListener built-in, zero install).
REM Si PowerShell esta presente (lo esta en cada Windows desde hace anos),
REM esto funciona sin necesidad de instalar nada.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-server.ps1" %*

REM Si llegamos aqui es porque PowerShell fallo. Probamos fallbacks:
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo PowerShell fallo. Intentando alternativas...
    echo.
    where py >nul 2>nul && ( start "" http://localhost:8080 ^&^& py -m http.server 8080 ^&^& goto :eof )
    where node >nul 2>nul && ( start "" http://localhost:8080 ^&^& npx --yes serve . -l 8080 ^&^& goto :eof )
    echo No se encontro ningun motor disponible.
    pause
)
