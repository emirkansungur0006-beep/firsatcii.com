@echo off
title Firsatci DB Guncelleme
color 0B
echo  ==================================================
echo  FIRSATCI VERITABANI YENIDEN OLUSTURULUYOR...
echo  ==================================================
echo.

cd apps\api

echo 1. Prisma Client Guncelleniyor...
call npx prisma generate --schema=./prisma/schema.prisma

echo 2. Veri Tabani Tablolari Yeniden Kuruluyor (Gecmis silinir)...
call npx prisma db push --accept-data-loss

echo 3. Sistem Verileri (Iller, Kategoriler, Admin) Yeniden Yukleniyor...
call npx ts-node --project tsconfig.json prisma/seed.ts

echo.
echo  ==================================================
echo  GUNCELLEME BASARIYLA TAMAMLANDI!
echo  ==================================================
echo  Simdi bu pencereyi kapatip, BASLAT.bat dosyasini calistirabilirsiniz.
pause
