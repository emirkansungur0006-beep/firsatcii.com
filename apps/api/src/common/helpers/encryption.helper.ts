// apps/api/src/common/helpers/encryption.helper.ts
// TCKN ve telefon numarası gibi hassas kişisel verileri
// AES-256-GCM algoritmasıyla şifreler/çözer.
//
// AES-256-GCM seçim nedeni:
// - Authenticated Encryption: Veri bütünlüğü + şifreleme birlikte
// - 256-bit anahtar: Kaba kuvvet saldırısına karşı dayanıklı
// - GCM modu: Paralel işleme uygun, hızlı

import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;     // Initialization Vector: 16 byte (128 bit)
const TAG_LENGTH = 16;    // Authentication Tag: 16 byte

// .env'deki 32-byte HEX anahtarı Buffer'a çevir
function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error('ENCRYPTION_KEY ortam değişkeni tanımlı değil!');
  
  // HEX string'i Buffer'a çevir (32 byte = 256 bit)
  const keyBuffer = Buffer.from(key.padEnd(64, '0').slice(0, 64), 'hex');
  return keyBuffer;
}

/**
 * Metni AES-256-GCM ile şifreler.
 * Çıktı formatı: IV:ŞIFRELIMETINBASE64:AUTHTAGBASE64
 * 
 * @param text - Şifrelenecek düz metin (TCKN, telefon vb.)
 * @returns Şifrelenmiş string (veritabanında saklanır)
 */
export function encrypt(text: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH); // Her şifrelemede benzersiz IV
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const authTag = cipher.getAuthTag();
  
  // Format: base64(IV):base64(şifreli):base64(authTag)
  return `${iv.toString('base64')}:${encrypted}:${authTag.toString('base64')}`;
}

/**
 * AES-256-GCM ile şifrelenmiş metni çözer.
 * 
 * @param encryptedText - Şifrelenmiş string
 * @returns Orijinal düz metin
 */
export function decrypt(encryptedText: string): string {
  try {
    if (!encryptedText || !encryptedText.includes(':')) {
      return encryptedText; // Şifreli değilse veya eski formattaysa ham veriyi dön
    }

    const key = getKey();
    const [ivBase64, encrypted, authTagBase64] = encryptedText.split(':');
    
    if (!ivBase64 || !encrypted || !authTagBase64) {
      return encryptedText;
    }

    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error.message);
    return encryptedText; // Hata durumunda sistemi çökertme, ham veriyi dön
  }
}
