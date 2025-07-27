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
