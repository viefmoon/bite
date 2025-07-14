export interface Shift {
  id: string;
  date: string;
  globalShiftNumber: number;
  shiftNumber: number;
  status: 'open' | 'closed';
  openedAt: string;
  closedAt: string | null;
  openedBy: User;
  closedBy: User | null;
  initialCash: number;
  finalCash: number | null;
  totalSales: number | null;
  totalOrders: number | null;
  cashDifference: number | null;
  expectedCash?: number | null;
  notes: string | null;
  closeNotes: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  email?: string;
  firstName: string;
  lastName: string;
}

export interface ShiftSummary {
  shift: Shift;
  ordersCount: number;
  totalSales: number;
  paymentMethodsSummary: PaymentMethodSummary[];
  productsSummary: ProductSummary[];
}

export interface PaymentMethodSummary {
  method: string;
  count: number;
  total: number;
}

export interface ProductSummary {
  productName: string;
  quantity: number;
  total: number;
}

export interface ShiftOrder {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  paymentMethod: string;
  customerName: string | null;
  createdAt: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  modifiers?: string[];
}
