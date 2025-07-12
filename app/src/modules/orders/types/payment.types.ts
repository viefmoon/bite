export enum PaymentMethodEnum {
  CASH = 'CASH',
  CARD = 'CARD', // Fusionado crédito y débito
  TRANSFER = 'TRANSFER',
}

export enum PaymentStatusEnum {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

export type PaymentMethod = keyof typeof PaymentMethodEnum;
export type PaymentStatus = keyof typeof PaymentStatusEnum;

export interface Payment {
  id: string;
  orderId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  order?: {
    id: string;
    shiftOrderNumber: number;
    total: number;
  };
}

export interface CreatePaymentDto {
  orderId: string;
  paymentMethod: PaymentMethod;
  amount: number;
}

export interface UpdatePaymentDto {
  paymentMethod?: PaymentMethod;
  amount?: number;
  paymentStatus?: PaymentStatus;
}
