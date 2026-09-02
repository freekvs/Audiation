@echo off
title Audiation localhost
cd /d "%~dp0"
echo.
echo  Audiation starten op http://localhost:8084
echo  Dit venster open laten zolang je de app gebruikt.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-localhost.ps1"
echo.
echo  Metro is gestopt. Dit venster mag dicht.
pause
