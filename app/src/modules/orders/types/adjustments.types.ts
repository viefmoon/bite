export interface OrderAdjustment {
  id?: string;
  name: string;
  isPercentage: boolean;
  value?: number; // Porcentaje (0-100) si isPercentage es true
  amount?: number; // Monto fijo si isPercentage es false (puede ser negativo para descuentos)
  // Para UI local
  isNew?: boolean;
  isDeleted?: boolean;
}

export interface AdjustmentFormData {
  name: string;
  isPercentage: boolean;
  value?: number;
  amount?: number;
}