@echo off
:: ════════════════════════════════════════════════════
:: FIRSATÇI - BAŞLATMA SCRIPTI
:: Önce KURULUM_BASLAT.bat çalıştırın!
:: ════════════════════════════════════════════════════

title Firsatci - Calistirilıyor

cd /d "%~dp0"

echo.
echo  🚀 Firsatci baslatiliyor...
echo.
echo  📡 API Backend  : http://localhost:3500
echo  🌐 Web Frontend : http://localhost:2500
echo  🔑 Admin Giris  : admin@firsatci.com
echo  🔑 Admin Sifre  : LLpp369*
echo.
echo  DURDURMAK ICIN: Ctrl+C
echo  ══════════════════════════════════════════════════

:: API tarafında paketleri kur ve başlat
start "Firsatci API (3500)" cmd /k "cd apps\api && npm install && npm run dev"

:: 3 saniye bekle (API'nin başlaması için)
timeout /t 3 /nobreak > nul

:: Web tarafında paketleri kur ve başlat (ön planda)
start "Firsatci Web (2500)" /min cmd /c "cd apps\web && npm install && npx next dev -p 2500 2>&1"

:: 4 saniye bekle
timeout /t 4 /nobreak > nul

:: Tarayıcıyı aç
start http://localhost:2500

echo.
echo  ✅ Firsatci baslatildi!
echo  🌐 Tarayici otomatik acildi: http://localhost:2500
echo.
echo  Kapatmak icin bu pencereyi kapatin.
pause
