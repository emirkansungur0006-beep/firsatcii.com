@echo off
color 0B
echo ========================================================
echo FIRSATCI - 973 Turkiye Ilcesi Veritabanina Yukleniyor...
echo ========================================================
cd apps\api
call npx ts-node --project tsconfig.json prisma/seed_districts.ts
echo ========================================================
echo ISLEM TAMAMLANDI! Ilceler her yerde aktivite edilmistir.
pause
