export interface Shift {
  id: number;
  openedAt: string;
  closedAt: string | null;
  initialCash: number;
  finalCash: number | null;
  totalSales: number | null;
  totalOrders: number | null;
  openedBy: User;
  closedBy: User | null;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
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
  id: number;
  orderNumber: string;
  total: number;
  status: string;
  paymentMethod: string;
  customerName: string | null;
  createdAt: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  modifiers?: string[];
}
