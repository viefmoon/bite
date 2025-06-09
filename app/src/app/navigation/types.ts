
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DrawerScreenProps as NavigationDrawerScreenProps } from "@react-navigation/drawer";
import type { NavigatorScreenParams } from "@react-navigation/native";
import type { MenuStackParamList } from "../../modules/menu/navigation/types";
import type { PreparationScreensStackParamList } from "../../modules/preparationScreens/navigation/types";
import type { AreasTablesStackParamList } from "../../modules/areasTables/navigation/types";
import type { PrintersStackParamList } from '../../modules/printers/navigation/types'; // Importar tipos de impresoras

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined; 
};

export type OrdersStackParamList = {
  Orders: undefined; // Pantalla principal del módulo de órdenes
  CreateOrder: {
    isAddingToOrder?: boolean; // Indica si estamos agregando productos a una orden existente
    orderId?: string; // ID de la orden a la que estamos agregando productos
    orderNumber?: number; // Número de la orden
    orderDate?: string; // Fecha de la orden en ISO string
    existingItems?: any[]; // Items existentes de la orden
    orderType?: string; // Tipo de orden
    tableId?: string; // ID de la mesa
    customerName?: string; // Nombre del cliente
    phoneNumber?: string; // Teléfono
    deliveryAddress?: string; // Dirección
    notes?: string; // Notas
    scheduledAt?: string; // Hora programada en ISO string
  } | undefined; // Pantalla para crear una nueva orden
  OpenOrders: {
    addedItems?: any[]; // Items agregados desde CreateOrder
    orderId?: string; // ID de la orden a la que se agregaron items
  } | undefined; // Pantalla para ver órdenes abiertas
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
        PrintersStackParamList {} 
  }
}
