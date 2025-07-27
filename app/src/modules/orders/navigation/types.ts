import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type OrdersStackParamList = {
  Orders: undefined;
  CreateOrder: undefined;
  OpenOrders: undefined;
  AddProductsToOrder: {
    orderId: string;
    orderNumber: number;
    existingOrderItemsCount?: number;
    existingTempProducts?: import('../stores/useOrderStore').CartItem[];
    onProductsAdded?: (
      products: import('../stores/useOrderStore').CartItem[],
    ) => void;
  };
};

export type OrdersStackScreenProps<T extends keyof OrdersStackParamList> =
  NativeStackScreenProps<OrdersStackParamList, T>;
