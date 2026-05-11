-- apps/api/prisma/create-db.sql
-- PostgreSQL'de 'firsatci.com' veritabanını oluşturan SQL scripti.
-- Çalıştırma: psql -U postgres -f create-db.sql
--
-- UYARI: Bu script mevcut veritabanlarına DOKUNMAZ.
-- Sadece 'firsatci.com' adında yeni bir veritabanı oluşturur.

-- Veritabanı var mı kontrol et, yoksa oluştur
DO $$ 
BEGIN
   IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'firsatci.com') THEN
      PERFORM dblink_exec('dbname=postgres', 'CREATE DATABASE "firsatci.com" ENCODING ''UTF8'' LC_COLLATE ''tr_TR.UTF-8'' LC_CTYPE ''tr_TR.UTF-8'' TEMPLATE template0');
   END IF;
END $$;
