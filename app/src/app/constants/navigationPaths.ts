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

  KITCHEN_STACK: 'KitchenStack',
  KITCHEN_ORDERS: 'KitchenOrders',
  KITCHEN: 'Kitchen',

  RECEIPTS_STACK: 'ReceiptsStack',
  RECEIPTS_LIST: 'ReceiptsList',

  ORDER_FINALIZATION_STACK: 'OrderFinalizationStack',
  ORDER_FINALIZATION: 'OrderFinalizationScreen',

  AVAILABILITY_STACK: 'AvailabilityStack',
  AVAILABILITY: 'AvailabilityScreen',

  RESTAURANT_CONFIG_STACK: 'RestaurantConfigStack',
  RESTAURANT_CONFIG: 'RestaurantConfig',

  CUSTOMERS_STACK: 'CustomersStack',
  CUSTOMERS: 'Customers',

  PIZZA_CUSTOMIZATIONS_STACK: 'PizzaCustomizationsStack',
  PIZZA_CUSTOMIZATIONS_LIST: 'PizzaCustomizationsList',

  SYNC_STACK: 'SyncStack',
  SYNC_STATUS: 'SyncStatus',

  USERS_STACK: 'UsersStack',
  USERS_LIST: 'UsersList',

  SHIFT_AUDIT_STACK: 'ShiftAuditStack',
  SHIFTS_LIST: 'ShiftsList',

  PRINTERS_STACK: 'PrintersStack',
  PRINTERS_LIST: 'PrintersList',

  PREPARATION_SCREENS_STACK: 'PreparationScreensStack',
  PREPARATION_SCREENS_LIST: 'PreparationScreensList',
} as const;

export type RootStackParamList = {
  [NAVIGATION_PATHS.LOGIN]: undefined;
  [NAVIGATION_PATHS.MAIN_DRAWER]: undefined;
};

export type OrdersStackParamList = {
  [NAVIGATION_PATHS.ORDERS]: undefined;
  [NAVIGATION_PATHS.CREATE_ORDER]: undefined;
  [NAVIGATION_PATHS.OPEN_ORDERS]: undefined;
  [NAVIGATION_PATHS.ADD_PRODUCTS_TO_ORDER]: {
    orderId: number;
    orderNumber: string;
    existingOrderItemsCount: number;
    existingTempProducts?: any[];
    onProductsAdded?: () => void;
  };
};

export type MenuStackParamList = {
  [NAVIGATION_PATHS.CATEGORIES]: undefined;
  [NAVIGATION_PATHS.SUBCATEGORIES]: {
    categoryId: number;
    categoryName: string;
  };
  [NAVIGATION_PATHS.PRODUCTS]: {
    subcategoryId: number;
    subCategoryName: string;
  };
};

export type AreasTablesStackParamList = {
  [NAVIGATION_PATHS.AREAS_LIST]: undefined;
  [NAVIGATION_PATHS.TABLES_LIST]: {
    areaId: number;
    areaName: string;
  };
};

export type ModifiersStackParamList = {
  [NAVIGATION_PATHS.MODIFIER_GROUPS]: undefined;
  [NAVIGATION_PATHS.MODIFIERS]: {
    groupId: number;
    groupName: string;
  };
};

export type KitchenStackParamList = {
  [NAVIGATION_PATHS.KITCHEN_ORDERS]: undefined;
};
