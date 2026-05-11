@echo off
setlocal
echo [BILGI] Yedekleme baslatiliyor...
echo [BILGI] node_modules ve gecici dosyalar haric tutuluyor.

:: Tarih ve saati Powershell ile guvenli bir formatta al (YYYYMMDD_HHMM)
for /f "tokens=*" %%i in ('powershell -NoProfile -Command "Get-Date -Format 'yyyyMMdd_HHmm'"') do set ts=%%i
set "zipname=FIRSATCI_YEDEK_%ts%.zip"

echo [ISLEM] Sıkıstırma yapiliyor: %zipname% ...

powershell -NoProfile -Command "$files = @('apps', 'packages', 'package.json', 'turbo.json', '.env', 'BASLAT.bat'); $existing = $files | Where-Object { Test-Path $_ }; Compress-Archive -Path $existing -DestinationPath '%zipname%' -Force"

if exist "%zipname%" (
    echo.
    echo [BASARILI] Yedekleme tamamlandi: %zipname%
    echo [BILGI] Bu dosyayi guvenli bir yerde saklayabilirsiniz.
) else (
    echo.
    echo [HATA] Yedekleme dosyasi olusturulamadi! Lutfen izinleri kontrol edin.
)

pause
