@echo off
title Firsatci Paket Yukleyici
echo ========================================================
echo FIRSATCI EKSIK PAKETLERI YUKLENIYOR... LUTFEN BEKLEYIN!
echo ========================================================

echo.
echo [1/2] API (Backend) paketleri yukleniyor...
cd "%~dp0apps\api"
call npm install --legacy-peer-deps
call npm install @nestjs/schedule cron @types/cron --legacy-peer-deps

echo.
echo [2/2] Web (Frontend) paketleri yukleniyor...
cd "%~dp0apps\web"
call npm install --legacy-peer-deps

echo.
echo ========================================================
echo TUM PAKETLER BASARIYLA YUKLENDI!
echo ========================================================
echo Lutfen acik olan tum siyah CMD pencerelerini kapatin.
echo Ardindan "BASLAT.bat" dosyasini tekrar calistirin.
pause
