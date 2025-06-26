import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { DrawerScreenProps as NavigationDrawerScreenProps } from '@react-navigation/drawer';
import type { NavigatorScreenParams } from '@react-navigation/native';
import type { MenuStackParamList } from '../../modules/menu/navigation/types';
import type { PreparationScreensStackParamList } from '../../modules/preparationScreens/navigation/types';
import type { AreasTablesStackParamList } from '../../modules/areasTables/navigation/types';
import type { PrintersStackParamList } from '../../modules/printers/navigation/types'; // Importar tipos de impresoras
import type { ReceiptsStackParamList } from '../../modules/receipts/navigation/types'; // Importar tipos de recibos
import type { AvailabilityStackParamList } from '../../modules/availability/navigation/types';
import type { OrderFinalizationStackParamList } from '../../modules/orderFinalization/navigation/types';
import type { RestaurantConfigStackParamList } from '../../modules/restaurantConfig/navigation/types';
import type { CustomersStackParamList } from '../../modules/customers/navigation/CustomersStackNavigator';
import type { PizzaCustomizationsStackParamList } from '../../modules/pizzaCustomizations/navigation/types';
import type { SyncStackParamList } from '../../modules/sync/navigation/SyncStackNavigator';
import type { UsersStackParamList } from '../../modules/users/navigation/UsersStackNavigator';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type OrdersStackParamList = {
  Orders: undefined; // Pantalla principal del módulo de órdenes
  CreateOrder: undefined; // Pantalla para crear una nueva orden
  OpenOrders: undefined; // Pantalla para ver órdenes abiertas
  AddProductsToOrder: {
    orderId: string; // ID de la orden a la que se están agregando productos
    orderNumber: number; // Número de la orden
    existingOrderItemsCount?: number; // Número de items que ya están en la orden
    existingTempProducts?: import('../../modules/orders/context/CartContext').CartItem[]; // Productos temporales existentes
    onProductsAdded?: (
      products: import('../../modules/orders/context/CartContext').CartItem[],
    ) => void; // Callback cuando se añaden productos
  }; // Pantalla para añadir productos a una orden existente
};

export type OrdersStackScreenProps<T extends keyof OrdersStackParamList> =
  NativeStackScreenProps<OrdersStackParamList, T>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type ModifiersStackParamList = {
  ModifierGroupsScreen: undefined;
  ModifiersScreen: { groupId: string; groupName: string };
};

export type ModifiersStackScreenProps<T extends keyof ModifiersStackParamList> =
  NativeStackScreenProps<ModifiersStackParamList, T>;

export type AppDrawerParamList = {
  Welcome: undefined; // Mantener si existe una pantalla de bienvenida
  MenuStack: NavigatorScreenParams<MenuStackParamList>; // Renombrado
  ModifiersStack: NavigatorScreenParams<ModifiersStackParamList>; // Renombrado
  PreparationScreensStack: NavigatorScreenParams<PreparationScreensStackParamList>; // Renombrado para consistencia
  AreasTablesStack: NavigatorScreenParams<AreasTablesStackParamList>; // Añadir el nuevo stack al Drawer
  OrdersStack: NavigatorScreenParams<OrdersStackParamList>; // Añadir el stack de órdenes al Drawer
  PrintersStack: NavigatorScreenParams<PrintersStackParamList>; // Añadir el stack de impresoras DENTRO del bloque
  ReceiptsStack: NavigatorScreenParams<ReceiptsStackParamList>; // Añadir el stack de recibos
  AvailabilityStack: NavigatorScreenParams<AvailabilityStackParamList>; // Stack de disponibilidad
  OrderFinalizationStack: NavigatorScreenParams<OrderFinalizationStackParamList>; // Stack de finalización de órdenes
  RestaurantConfigStack: NavigatorScreenParams<RestaurantConfigStackParamList>; // Stack de configuración del restaurante
  PizzaCustomizationsStack: NavigatorScreenParams<PizzaCustomizationsStackParamList>; // Stack de personalización de pizzas
  CustomersStack: NavigatorScreenParams<CustomersStackParamList>; // Stack de clientes
  SyncStack: NavigatorScreenParams<SyncStackParamList>; // Stack de sincronización
  UsersStack: NavigatorScreenParams<UsersStackParamList>; // Stack de usuarios
};

export type DrawerScreenProps<T extends keyof AppDrawerParamList> =
  NavigationDrawerScreenProps<AppDrawerParamList, T>;

declare global {
  namespace ReactNavigation {
    interface RootParamList
      extends AuthStackParamList,
        AppDrawerParamList,
        ModifiersStackParamList,
        PreparationScreensStackParamList,
        AreasTablesStackParamList,
        OrdersStackParamList,
        PrintersStackParamList,
        ReceiptsStackParamList,
        AvailabilityStackParamList,
        OrderFinalizationStackParamList,
        RestaurantConfigStackParamList,
        PizzaCustomizationsStackParamList,
        CustomersStackParamList,
        SyncStackParamList,
        UsersStackParamList {}
  }
}
