@echo off
:: ════════════════════════════════════════════════════════════════
:: FIRSATÇI - TAM OTOMATİK KURULUM VE BAŞLATMA (v2)
:: Çift tıklayarak çalıştırın. Tüm adımları otomatik yapar.
:: ════════════════════════════════════════════════════════════════

title Firsatci - Tam Kurulum

cd /d "%~dp0"

echo.
echo  ============================================================
echo  FIRSATCI - HIZMET PAZAR YERI KURULUMU
echo  ============================================================
echo.

:: ─── ADIM 1: Node.js ───
echo [ADIM 1/8] Node.js kontrolu...
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo  HATA: Node.js kurulu degil!
    echo  Lutfen https://nodejs.org adresinden Node.js LTS indirin.
    pause & exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do echo  OK: Node.js %%i

:: ─── ADIM 2: PostgreSQL ───
echo.
echo [ADIM 2/8] PostgreSQL veritabani olusturuluyor...
echo  Veritabani adi: firsatci.com
echo  Kullanici: postgres
echo  Sifre: LLpp369*
echo.

:: PostgreSQL'de veritabanı oluştur (eğer yoksa)
set PGPASSWORD=LLpp369*
psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname='firsatci.com'" 2>nul | findstr "1" >nul
if %ERRORLEVEL% neq 0 (
    psql -U postgres -c "CREATE DATABASE \"firsatci.com\" ENCODING 'UTF8';" 2>nul
    if %ERRORLEVEL% neq 0 (
        echo  UYARI: Veritabani olusturulamadi. Manuel olusturun:
        echo  psql -U postgres -c "CREATE DATABASE \"firsatci.com\";"
    ) else (
        echo  OK: Veritabani olusturuldu.
    )
) else (
    echo  OK: Veritabani zaten mevcut.
)

:: PostGIS eklentisini etkinleştir
psql -U postgres -d "firsatci.com" -c "CREATE EXTENSION IF NOT EXISTS postgis;" 2>nul
if %ERRORLEVEL% equ 0 (
    echo  OK: PostGIS eklentisi aktif.
) else (
    echo  UYARI: PostGIS kurulamadi. Kurulumu kontrol edin.
)

:: ─── ADIM 3: Kök npm install ───
echo.
echo [ADIM 3/8] Kok paketleri yukleniyor...
call npm install
if %ERRORLEVEL% neq 0 (
    echo  HATA: Kok npm install basarisiz!
    pause & exit /b 1
)
echo  OK: Kok paketler yuklendi.

:: ─── ADIM 4: API paketleri ───
echo.
echo [ADIM 4/8] API (NestJS) paketleri yukleniyor...
cd apps\api
call npm install
if %ERRORLEVEL% neq 0 (
    echo  HATA: API npm install basarisiz!
    cd ..\..
    pause & exit /b 1
)
echo  OK: API paketleri yuklendi.

:: ─── ADIM 5: Prisma Generate ───
echo.
echo [ADIM 5/8] Prisma client olusturuluyor...
call npx prisma generate
if %ERRORLEVEL% neq 0 (
    echo  HATA: Prisma generate basarisiz!
    cd ..\..
    pause & exit /b 1
)
echo  OK: Prisma client olusturuldu.

:: ─── ADIM 6: Prisma Migration ───
echo.
echo [ADIM 6/8] Veritabani migration calistiriliyor...
call npx prisma migrate dev --name init --skip-seed
if %ERRORLEVEL% neq 0 (
    echo  HATA: Migration basarisiz!
    echo  DATABASE_URL'i kontrol edin: .env dosyasi
    cd ..\..
    pause & exit /b 1
)
echo  OK: Migration tamamlandi.

:: ─── ADIM 7: Seed ───
echo.
echo [ADIM 7/8] Admin ve baslangic verileri yukleniyor...
call npx ts-node -r tsconfig-paths/register prisma/seed.ts
if %ERRORLEVEL% neq 0 (
    echo  UYARI: Seed basarisiz, ts-node deneyin:
    echo  cd apps\api ^&^& npx ts-node prisma/seed.ts
)
cd ..\..

:: ─── ADIM 8: Web paketleri ───
echo.
echo [ADIM 8/8] Web (Next.js) paketleri yukleniyor...
cd apps\web
call npm install
if %ERRORLEVEL% neq 0 (
    echo  HATA: Web npm install basarisiz!
    cd ..\..
    pause & exit /b 1
)
cd ..\..

echo.
echo  ============================================================
echo  KURULUM TAMAMLANDI!
echo  ============================================================
echo.
echo  Simdik BASLAT.bat dosyasini calistirin.
echo  Veya manuel baslatma:
echo    Terminal 1: cd apps\api && npx nest start --watch
echo    Terminal 2: cd apps\web && npx next dev -p 2500
echo.
echo  Admin Giris: http://localhost:2500/giris
echo  Admin Email: admin@firsatci.com
echo  Admin Sifre: LLpp369*
echo  ============================================================
echo.

:: Otomatik başlat?
choice /c EN /m "Uygulamayi simdi baslatmak ister misiniz? (E/N)"
if %ERRORLEVEL% equ 1 (
    call BASLAT.bat
) else (
    echo  BASLAT.bat ile uygulamayi baslatabilirsiniz.
    pause
)
