@echo off
setlocal
echo ===========================================
echo   FIRSATCI KATEGORI YUKLEME SISTEMI
echo ===========================================
echo.

:: Bulundugumuz klasoru baz alarak API klasorune git
cd /d "%~dp0"
cd apps\api

echo Mevcut dizin: %cd%
echo.

:: Seed komutunu calistir
call npm run db:seed

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [HATA] Kategoriler yuklenirken bir sorun olustu!
    echo Lutfen yukaridaki hata mesajini kontrol edin.
) else (
    echo.
    echo [BASARILI] Kategoriler veritabanina yuklendi.
)

echo.
pause
