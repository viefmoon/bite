export const API_PATHS = {
  SUBCATEGORIES: '/api/v1/subcategories',
  PRODUCTS: '/api/v1/products',
  CATEGORIES: '/api/v1/categories',
  FILES_UPLOAD: '/api/v1/files/upload',

  PREPARATION_SCREENS: '/api/v1/preparation-screens',

  AUTH_EMAIL_LOGIN: '/api/v1/auth/email/login',
  AUTH_EMAIL_REGISTER: '/api/v1/auth/email/register',
  AUTH_ME: '/api/v1/auth/me',

  AREAS: '/api/v1/areas',
  TABLES: '/api/v1/tables',

  MODIFIERS: '/api/v1/product-modifiers',
  MODIFIER_GROUPS: '/api/v1/modifier-groups',

  ORDERS: '/api/v1/orders',
  ORDERS_OPEN_TODAY: '/api/v1/orders/open-today',
  ORDERS_FOR_FINALIZATION: '/api/v1/orders/for-finalization',
  ORDERS_FINALIZE_MULTIPLE: '/api/v1/orders/finalize-multiple',
  ORDERS_DETAIL: '/api/v1/orders/:orderId/detail',
  PRINT_ORDER_TICKET: '/api/v1/print/order', // Ruta para solicitar impresión de ticket

  THERMAL_PRINTERS: '/api/v1/thermal-printers',
  
  ADJUSTMENTS: '/api/v1/adjustments',

  RESTAURANT_CONFIG: '/api/v1/restaurant-config',

  AVAILABILITY_MENU: '/api/v1/availability/menu',
  AVAILABILITY_MODIFIER_GROUPS: '/api/v1/availability/modifier-groups',
  AVAILABILITY_UPDATE: '/api/v1/availability/update',
  AVAILABILITY_BULK_UPDATE: '/api/v1/availability/bulk-update',

  PAYMENTS: '/api/v1/payments',
  PAYMENTS_BY_ORDER: '/api/v1/payments/order/:orderId',
} as const;
