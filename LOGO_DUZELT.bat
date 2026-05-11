@echo off
echo Yeni Logo (LOGO5.png) kopyalaniyor...
copy "LOGO5.png" "apps\web\public\assets\logo.png"
if %errorlevel% neq 0 (
    echo Hata: LOGO5.png bulunamadi!
) else (
    echo Basarili! Logo guncellendi.
)
pause
