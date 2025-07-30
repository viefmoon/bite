/**
 * Tipos unificados para order details
 * Representa la estructura normalizada que usa la UI, independiente del source de datos
 */

export interface UnifiedOrderItem {
  id: string;
  productName: string;
  variantName?: string;
  quantity: number;
  basePrice: number;
  finalPrice: number;
  preparationStatus?: string;
  preparationNotes?: string;
  modifiers?: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  selectedPizzaCustomizations?: unknown[];
}

export interface UnifiedTable {
  id: string;
  name: string;
  number: string;
  area?: {
    id?: string;
    name: string;
  };
}

export interface UnifiedDeliveryInfo {
  recipientName?: string;
  recipientPhone?: string;
  fullAddress?: string;
  deliveryInstructions?: string;
  street?: string;
  number?: string;
  interiorNumber?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface UnifiedUser {
  id: string;
  firstName?: string;
  lastName?: string;
  username: string;
}

export interface UnifiedPayment {
  id: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Estructura unificada para order details
 * Normaliza todos los tipos de órdenes a una interfaz consistente
 */
export interface UnifiedOrderDetails {
  // Información básica
  id: string;
  shiftOrderNumber: number;
  orderType: string;
  orderStatus: string;
  total: number;
  subtotal?: number;

  // Fechas
  createdAt: string;
  updatedAt: string;
  finalizedAt?: string | null;
  scheduledAt?: string | null;
  estimatedDeliveryTime?: string | null;

  // Notas
  notes?: string | null;

  // Referencias
  userId?: string | null;
  tableId?: string | null;
  customerId?: string | null;
  deletedAt?: string | null;

  // Información adicional
  isFromWhatsApp?: boolean;

  // Relaciones
  table?: UnifiedTable | null;
  deliveryInfo?: UnifiedDeliveryInfo | null;
  user?: UnifiedUser | null;
  customer?: unknown | null;

  // Datos asociados
  orderItems?: UnifiedOrderItem[];
  payments?: UnifiedPayment[] | null;
  adjustments?: unknown[] | null;
  preparationScreenStatuses?: unknown[] | null;
  ticketImpressions?: unknown[] | null;
}
