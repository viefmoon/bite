import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { DrawerScreenProps as NavigationDrawerScreenProps } from '@react-navigation/drawer';
import type { NavigatorScreenParams } from '@react-navigation/native';
import type { MenuStackParamList } from '../../modules/menu/navigation/types';
import type { PreparationScreensStackParamList } from '../../modules/preparationScreens/navigation/types';
import type { AreasTablesStackParamList } from '../../modules/areasTables/navigation/types';
import type { PrintersStackParamList } from '../../modules/printers/navigation/types';
import type { ReceiptsStackParamList } from '../../modules/receipts/navigation/types';
import type { OrderFinalizationStackParamList } from '../../modules/orderFinalization/navigation/types';
import type { RestaurantConfigStackParamList } from '../../modules/restaurantConfig/navigation/types';
import type { CustomersStackParamList } from '../../modules/customers/navigation/CustomersStackNavigator';
import type { PizzaCustomizationsStackParamList } from '../../modules/pizzaCustomizations/navigation/types';
import type { SyncStackParamList } from '../../modules/sync/navigation/SyncStackNavigator';
import type { ShiftAuditStackParamList } from '../../modules/shiftAudit/navigation/types';
import type { OrdersStackParamList } from '../../modules/orders/navigation/types';
import type { ModifiersStackParamList } from '../../modules/modifiers/navigation/types';
import { NAVIGATION_PATHS } from '../constants/navigationPaths';

// Auth Stack
export type AuthStackParamList = {
  [NAVIGATION_PATHS.LOGIN]: undefined;
};

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

// App Drawer
export type AppDrawerParamList = {
  [NAVIGATION_PATHS.WELCOME]: undefined;
  [NAVIGATION_PATHS.MENU_STACK]: NavigatorScreenParams<MenuStackParamList>;
  [NAVIGATION_PATHS.MODIFIERS_STACK]: NavigatorScreenParams<ModifiersStackParamList>;
  [NAVIGATION_PATHS.PREPARATION_SCREENS_STACK]: NavigatorScreenParams<PreparationScreensStackParamList>;
  [NAVIGATION_PATHS.AREAS_TABLES_STACK]: NavigatorScreenParams<AreasTablesStackParamList>;
  [NAVIGATION_PATHS.ORDERS_STACK]: NavigatorScreenParams<OrdersStackParamList>;
  [NAVIGATION_PATHS.PRINTERS_STACK]: NavigatorScreenParams<PrintersStackParamList>;
  [NAVIGATION_PATHS.RECEIPTS_STACK]: NavigatorScreenParams<ReceiptsStackParamList>;
  [NAVIGATION_PATHS.AVAILABILITY_SCREEN]: undefined;
  [NAVIGATION_PATHS.ORDER_FINALIZATION_STACK]: NavigatorScreenParams<OrderFinalizationStackParamList>;
  [NAVIGATION_PATHS.RESTAURANT_CONFIG_STACK]: NavigatorScreenParams<RestaurantConfigStackParamList>;
  [NAVIGATION_PATHS.PIZZA_CUSTOMIZATIONS_STACK]: NavigatorScreenParams<PizzaCustomizationsStackParamList>;
  [NAVIGATION_PATHS.CUSTOMERS_STACK]: NavigatorScreenParams<CustomersStackParamList>;
  [NAVIGATION_PATHS.SYNC_STACK]: NavigatorScreenParams<SyncStackParamList>;
  [NAVIGATION_PATHS.USERS_SCREEN]: undefined;
  [NAVIGATION_PATHS.KITCHEN_SCREEN]: undefined;
  [NAVIGATION_PATHS.SHIFT_AUDIT_STACK]: NavigatorScreenParams<ShiftAuditStackParamList>;
  [NAVIGATION_PATHS.SERVER_SETTINGS]: undefined;
};

export type DrawerScreenProps<T extends keyof AppDrawerParamList> =
  NavigationDrawerScreenProps<AppDrawerParamList, T>;

export type DrawerNavigatorParamList = AppDrawerParamList;

// Root Stack - Unifica todos los ParamList
export type RootStackParamList = {
  AuthStack: NavigatorScreenParams<AuthStackParamList>;
  MainDrawer: NavigatorScreenParams<AppDrawerParamList>;
} & AuthStackParamList &
  AppDrawerParamList &
  ModifiersStackParamList &
  PreparationScreensStackParamList &
  AreasTablesStackParamList &
  OrdersStackParamList &
  PrintersStackParamList &
  ReceiptsStackParamList &
  OrderFinalizationStackParamList &
  RestaurantConfigStackParamList &
  PizzaCustomizationsStackParamList &
  CustomersStackParamList &
  SyncStackParamList &
  ShiftAuditStackParamList &
  MenuStackParamList;

// Export para uso en hooks de navegación
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

// Mantener compatibilidad con código existente que usa declare global
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
