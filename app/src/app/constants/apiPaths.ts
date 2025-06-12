export const API_PATHS = {
  SUBCATEGORIES: '/api/v1/subcategories',
  PRODUCTS: '/api/v1/products',
  CATEGORIES: '/api/v1/categories',
  FILES_UPLOAD: '/api/v1/files/upload',

  PREPARATION_SCREENS: '/api/v1/preparation-screens',

  AUTH_EMAIL_LOGIN: '/api/v1/auth/email/login',
  AUTH_EMAIL_REGISTER: '/api/v1/auth/email/register',

  AREAS: '/api/v1/areas',
  TABLES: '/api/v1/tables',

  MODIFIERS: '/api/v1/product-modifiers',
  MODIFIER_GROUPS: '/api/v1/modifier-groups',

  ORDERS: '/api/v1/orders',
  ORDERS_OPEN_TODAY: '/api/v1/orders/open-today',
  PRINT_ORDER_TICKET: '/api/v1/print/order', // Ruta para solicitar impresión de ticket

  THERMAL_PRINTERS: '/api/v1/thermal-printers',
  
  ADJUSTMENTS: '/api/v1/adjustments',

  RESTAURANT_CONFIG: '/api/v1/restaurant-config',
} as const;
