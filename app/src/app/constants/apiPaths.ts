export const API_PATHS = {
  SUBCATEGORIES: '/api/v1/subcategories',
  SUBCATEGORIES_BY_ID: '/api/v1/subcategories/:id',
  PRODUCTS: '/api/v1/products',
  PRODUCTS_BY_ID: '/api/v1/products/:id',
  PRODUCTS_MODIFIER_GROUPS: '/api/v1/products/:productId/modifier-groups',
  PRODUCTS_PIZZA_CUSTOMIZATIONS:
    '/api/v1/products/:productId/pizza-customizations',
  CATEGORIES: '/api/v1/categories',
  CATEGORIES_BY_ID: '/api/v1/categories/:id',
  CATEGORIES_ORDER_MENU: '/api/v1/categories/order-menu',
  FILES_UPLOAD: '/api/v1/files/upload',

  PREPARATION_SCREENS: '/api/v1/preparation-screens',
  PREPARATION_SCREENS_BY_ID: '/api/v1/preparation-screens/:id',
  PREPARATION_SCREENS_PRODUCTS: '/api/v1/preparation-screens/:id/products',
  PREPARATION_SCREENS_MENU_WITH_ASSOCIATIONS:
    '/api/v1/preparation-screens/:id/menu-with-associations',

  AUTH_EMAIL_LOGIN: '/api/v1/auth/email/login',
  AUTH_EMAIL_REGISTER: '/api/v1/auth/email/register',
  AUTH_ME: '/api/v1/auth/me',
  AUTH_REFRESH: '/api/v1/auth/refresh',

  AREAS: '/api/v1/areas',
  AREAS_BY_ID: '/api/v1/areas/:id',
  TABLES: '/api/v1/tables',
  TABLES_BY_ID: '/api/v1/tables/:id',
  TABLES_BY_AREA: '/api/v1/tables/area/:areaId',

  MODIFIERS: '/api/v1/product-modifiers',
  MODIFIERS_BY_ID: '/api/v1/product-modifiers/:id',
  MODIFIERS_BY_GROUP: '/api/v1/product-modifiers/by-group/:modifierGroupId',
  MODIFIER_GROUPS: '/api/v1/modifier-groups',
  MODIFIER_GROUPS_BY_ID: '/api/v1/modifier-groups/:id',

  ORDERS: '/api/v1/orders',
  ORDERS_BY_ID: '/api/v1/orders/:orderId',
  ORDERS_OPEN_CURRENT_SHIFT: '/api/v1/orders/open-current-shift',
  ORDERS_OPEN_ORDERS_LIST: '/api/v1/orders/open-orders-list',
  ORDERS_FOR_FINALIZATION_LIST: '/api/v1/orders/for-finalization/list',
  ORDERS_FOR_FINALIZATION_DETAIL: '/api/v1/orders/for-finalization/:id',
  ORDERS_FINALIZE_MULTIPLE: '/api/v1/orders/finalize-multiple',
  ORDERS_DETAIL: '/api/v1/orders/:orderId/detail',
  ORDERS_RECEIPTS_LIST: '/api/v1/orders/receipts-list',
  ORDERS_RECEIPTS_BY_ID: '/api/v1/orders/receipts/:id',
  ORDERS_RECOVER: '/api/v1/orders/:id/recover',
  THERMAL_PRINTERS: '/api/v1/thermal-printers',
  THERMAL_PRINTERS_BY_ID: '/api/v1/thermal-printers/:id',
  THERMAL_PRINTERS_DISCOVER: '/api/v1/thermal-printers/discover',
  THERMAL_PRINTERS_PING: '/api/v1/thermal-printers/:id/ping',
  THERMAL_PRINTERS_TEST_PRINT: '/api/v1/thermal-printers/test-print',

  RESTAURANT_CONFIG: '/api/v1/restaurant-config',

  AVAILABILITY_MENU: '/api/v1/availability/menu',
  AVAILABILITY_MODIFIER_GROUPS: '/api/v1/availability/modifier-groups',
  AVAILABILITY_PIZZA_CUSTOMIZATIONS:
    '/api/v1/availability/pizza-customizations',
  AVAILABILITY_UPDATE: '/api/v1/availability/update',
  AVAILABILITY_BULK_UPDATE: '/api/v1/availability/bulk-update',

  PAYMENTS: '/api/v1/payments',
  PAYMENTS_BY_ID: '/api/v1/payments/:paymentId',
  PAYMENTS_BY_ORDER: '/api/v1/payments/order/:orderId',
  PAYMENTS_PREPAYMENT: '/api/v1/payments/prepayment',
  PAYMENTS_ASSOCIATE: '/api/v1/payments/:paymentId/associate/:orderId',

  PIZZA_CUSTOMIZATIONS: '/api/v1/pizza-customizations',
  PIZZA_CUSTOMIZATIONS_BY_ID: '/api/v1/pizza-customizations/:id',
  PIZZA_CUSTOMIZATIONS_SORT_ORDER: '/api/v1/pizza-customizations/sort-order',
  PIZZA_CONFIGURATIONS: '/api/v1/pizza-configurations',
  PIZZA_CONFIGURATIONS_BY_ID: '/api/v1/pizza-configurations/:id',
  PRODUCTS_PIZZAS: '/api/v1/products/pizzas/all',

  CUSTOMERS: '/api/v1/customers',
  CUSTOMERS_BY_ID: '/api/v1/customers/:id',
  ADDRESSES: '/api/v1/addresses',
  ADDRESSES_BY_ID: '/api/v1/addresses/:id',
  ADDRESSES_BY_CUSTOMER: '/api/v1/customers/:customerId/addresses',

  KITCHEN_ORDERS: '/api/v1/kitchen/orders',
  KITCHEN_ORDERS_START_PREPARATION:
    '/api/v1/kitchen/orders/:orderId/start-preparation',
  KITCHEN_ORDERS_CANCEL_PREPARATION:
    '/api/v1/kitchen/orders/:orderId/cancel-preparation',
  KITCHEN_ORDERS_COMPLETE_PREPARATION:
    '/api/v1/kitchen/orders/:orderId/complete-preparation',
  KITCHEN_MARK_PREPARED: '/api/v1/kitchen/order-items/:itemId/prepare',

  SHIFTS: '/api/v1/shifts',
  SHIFTS_OPEN: '/api/v1/shifts/open',
  SHIFTS_CLOSE: '/api/v1/shifts/close',
  SHIFTS_CURRENT: '/api/v1/shifts/current',
  SHIFTS_HISTORY: '/api/v1/shifts/history',
  SHIFTS_DETAIL: '/api/v1/shifts/:id',
  ORDERS_BY_SHIFT: '/api/v1/orders/shift/:shiftId',
  ORDERS_BY_SHIFT_SALES_SUMMARY: '/api/v1/orders/shift/:shiftId/sales-summary',

  USERS: '/api/v1/users',
  USERS_BY_ID: '/api/v1/users/:id',

  APP_CONFIG: '/api/v1/app-config',

  SYNC_STATUS: '/api/v1/sync-local/status',
  SYNC_ACTIVITY: '/api/v1/sync-local/activity',

  ORDERS_HISTORY: '/api/v1/orders/:orderId/history',
  ORDERS_QUICK_FINALIZE_MULTIPLE: '/api/v1/orders/quick-finalize-multiple',
  ORDERS_PRINT_TICKET: '/api/v1/orders/:orderId/print-ticket',

  AUDIO_ORDERS_PROCESS: '/api/v1/audio-orders/process',
  AUDIO_ORDERS_HEALTH: '/api/v1/audio-orders/health',

  HEALTH: '/api/v1/health',
  DISCOVERY: '/api/v1/discovery',
} as const;
