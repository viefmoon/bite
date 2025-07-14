/**
 * Formatea un número como moneda
 * @param amount - Cantidad a formatear
 * @param currency - Código de moneda (por defecto MXN)
 * @returns String formateado como moneda
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency = 'MXN',
): string {
  // Si el valor es null, undefined o NaN, devolver $0.00
  if (amount === null || amount === undefined || isNaN(amount)) {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(0);
  }

  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formatea un número de teléfono
 * @param phoneNumber - Número de teléfono
 * @returns String formateado
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Remover todo excepto números
  const cleaned = phoneNumber.replace(/\D/g, '');

  // Formato mexicano: +52 55 1234 5678
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 6)} ${cleaned.slice(6)}`;
  } else if (cleaned.length === 12 && cleaned.startsWith('52')) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8)}`;
  }

  return phoneNumber;
}
