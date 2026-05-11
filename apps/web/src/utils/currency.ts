/**
 * Sayıları Türk Lirası formatına dönüştürür.
 * Örnek: 1000 -> 1.000 TL
 */
export const formatCurrency = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined || amount === '') return '0 TL';
  
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(num)) return '0 TL';

  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num).replace('TRY', 'TL').trim() + ' TL';
};

/**
 * Türk Lirası formatındaki bir stringi sayıya dönüştürür.
 * Örnek: "1.000 TL" -> 1000
 */
export const parseCurrency = (formattedValue: string): number => {
  const cleanValue = formattedValue.replace(/[^\d]/g, '');
  return parseInt(cleanValue) || 0;
};
