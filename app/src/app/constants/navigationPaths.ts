export const NAVIGATION_PATHS = {
  LOGIN: 'Login',

  MAIN_DRAWER: 'MainDrawer',

  ORDERS_STACK: 'OrdersStack',
  ORDERS: 'Orders',
  CREATE_ORDER: 'CreateOrder',
  OPEN_ORDERS: 'OpenOrders',
  ADD_PRODUCTS_TO_ORDER: 'AddProductsToOrder',

  MENU_STACK: 'MenuStack',
  CATEGORIES: 'CategoriesScreen',
  SUBCATEGORIES: 'SubcategoriesScreen',
  PRODUCTS: 'Products',

  AREAS_TABLES_STACK: 'AreasTablesStack',
  AREAS_LIST: 'AreasList',
  TABLES_LIST: 'TablesList',

  MODIFIERS_STACK: 'ModifiersStack',
  MODIFIER_GROUPS: 'ModifierGroupsScreen',
  MODIFIERS: 'ModifiersScreen',

  KITCHEN_SCREEN: 'KitchenScreen',

  RECEIPTS_STACK: 'ReceiptsStack',
  RECEIPTS_LIST: 'ReceiptsList',

  ORDER_FINALIZATION_STACK: 'OrderFinalizationStack',
  ORDER_FINALIZATION: 'OrderFinalizationScreen',

  AVAILABILITY_SCREEN: 'AvailabilityScreen',

  RESTAURANT_CONFIG_STACK: 'RestaurantConfigStack',
  RESTAURANT_CONFIG: 'RestaurantConfig',

  CUSTOMERS_STACK: 'CustomersStack',
  CUSTOMERS: 'Customers',

  PIZZA_CUSTOMIZATIONS_STACK: 'PizzaCustomizationsStack',
  PIZZA_CUSTOMIZATIONS_LIST: 'PizzaCustomizationsList',

  SYNC_STACK: 'SyncStack',
  SYNC_STATUS: 'SyncStatus',

  USERS_SCREEN: 'UsersScreen',

  SHIFT_AUDIT_STACK: 'ShiftAuditStack',
  SHIFTS_LIST: 'ShiftsList',

  PRINTERS_STACK: 'PrintersStack',
  PRINTERS_LIST: 'PrintersList',

  PREPARATION_SCREENS_STACK: 'PreparationScreensStack',
  PREPARATION_SCREENS_LIST: 'PreparationScreensList',

  SERVER_SETTINGS: 'ServerSettings',
  WELCOME: 'Welcome',
} as const;

export type RootStackParamList = {
  [NAVIGATION_PATHS.LOGIN]: undefined;
  [NAVIGATION_PATHS.MAIN_DRAWER]: undefined;
};

// KitchenScreen ahora es una pantalla directa, no requiere ParamList
