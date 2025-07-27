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
import type { SettingsStackParamList } from '../../modules/settings/navigation/types';
import type { OrdersStackParamList } from '../../modules/orders/navigation/types';
import type { ModifiersStackParamList } from '../../modules/modifiers/navigation/types';

export type AuthStackParamList = {
  Login: undefined;
};

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type AppDrawerParamList = {
  Welcome: undefined;
  MenuStack: NavigatorScreenParams<MenuStackParamList>;
  ModifiersStack: NavigatorScreenParams<ModifiersStackParamList>;
  PreparationScreensStack: NavigatorScreenParams<PreparationScreensStackParamList>;
  AreasTablesStack: NavigatorScreenParams<AreasTablesStackParamList>;
  OrdersStack: NavigatorScreenParams<OrdersStackParamList>;
  PrintersStack: NavigatorScreenParams<PrintersStackParamList>;
  ReceiptsStack: NavigatorScreenParams<ReceiptsStackParamList>;
  AvailabilityScreen: undefined;
  OrderFinalizationStack: NavigatorScreenParams<OrderFinalizationStackParamList>;
  RestaurantConfigStack: NavigatorScreenParams<RestaurantConfigStackParamList>;
  PizzaCustomizationsStack: NavigatorScreenParams<PizzaCustomizationsStackParamList>;
  CustomersStack: NavigatorScreenParams<CustomersStackParamList>;
  SyncStack: NavigatorScreenParams<SyncStackParamList>;
  UsersScreen: undefined;
  KitchenScreen: undefined;
  ShiftAuditStack: NavigatorScreenParams<ShiftAuditStackParamList>;
  SettingsStack: NavigatorScreenParams<SettingsStackParamList>;
  ServerSettings: undefined;
};

export type DrawerScreenProps<T extends keyof AppDrawerParamList> =
  NavigationDrawerScreenProps<AppDrawerParamList, T>;

export type DrawerNavigatorParamList = AppDrawerParamList;

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
        OrderFinalizationStackParamList,
        RestaurantConfigStackParamList,
        PizzaCustomizationsStackParamList,
        CustomersStackParamList,
        SyncStackParamList,
        ShiftAuditStackParamList,
        SettingsStackParamList {}
  }
}
