import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { NAVIGATION_PATHS } from '@/app/constants/navigationPaths';

export type OrdersStackParamList = {
  [NAVIGATION_PATHS.ORDERS]: undefined;
  [NAVIGATION_PATHS.CREATE_ORDER]: undefined;
  [NAVIGATION_PATHS.OPEN_ORDERS]: undefined;
  [NAVIGATION_PATHS.ADD_PRODUCTS_TO_ORDER]: {
    orderId: string;
    orderNumber: number;
    existingOrderItemsCount?: number;
    existingTempProducts?: import('../utils/cartUtils').CartItem[];
    onProductsAdded?: (
      products: import('../utils/cartUtils').CartItem[],
    ) => void;
  };
};

export type OrdersStackScreenProps<T extends keyof OrdersStackParamList> =
  NativeStackScreenProps<OrdersStackParamList, T>;
