import { RoleEnum } from '@/modules/users/schema/user.schema';

export type DrawerSection =
  | 'OrdersStack'
  | 'ReceiptsStack'
  | 'OrderFinalizationStack'
  | 'MenuStack'
  | 'AvailabilityScreen'
  | 'ModifiersStack'
  | 'PizzaCustomizationsStack'
  | 'PreparationScreensStack'
  | 'AreasTablesStack'
  | 'PrintersStack'
  | 'RestaurantConfigStack'
  | 'CustomersStack'
  | 'SyncStack'
  | 'UsersScreen'
  | 'KitchenScreen'
  | 'ShiftAuditStack';

// Definir permisos por rol
export const ROLE_PERMISSIONS: Record<RoleEnum, DrawerSection[]> = {
  // Admin - Acceso completo
  [RoleEnum.ADMIN]: [
    'OrdersStack',
    'OrderFinalizationStack',
    'ReceiptsStack',
    'MenuStack',
    'AvailabilityScreen',
    'ModifiersStack',
    'PizzaCustomizationsStack',
    'PreparationScreensStack',
    'AreasTablesStack',
    'PrintersStack',
    'RestaurantConfigStack',
    'CustomersStack',
    'SyncStack',
    'UsersScreen',
    'ShiftAuditStack',
  ],

  // Manager - Acceso completo excepto usuarios
  [RoleEnum.MANAGER]: [
    'OrdersStack',
    'OrderFinalizationStack',
    'ReceiptsStack',
    'MenuStack',
    'AvailabilityScreen',
    'ModifiersStack',
    'PizzaCustomizationsStack',
    'PreparationScreensStack',
    'AreasTablesStack',
    'PrintersStack',
    'RestaurantConfigStack',
    'CustomersStack',
    'SyncStack',
    'ShiftAuditStack',
  ],

  // Cashier - Ventas, clientes y configuración básica
  [RoleEnum.CASHIER]: [
    'OrdersStack',
    'OrderFinalizationStack',
    'ReceiptsStack',
    'MenuStack',
    'AvailabilityScreen',
    'AreasTablesStack',
    'CustomersStack',
  ],

  // Waiter - Órdenes, mesas y disponibilidad
  [RoleEnum.WAITER]: [
    'OrdersStack',
    'MenuStack',
    'AvailabilityScreen',
    'AreasTablesStack',
    'CustomersStack',
  ],

  // Kitchen - Solo acceso a pantalla de preparación
  // Los usuarios con pantalla asignada van directo a KitchenScreen
  [RoleEnum.KITCHEN]: ['KitchenScreen'],

  // Delivery - Órdenes, clientes y áreas
  [RoleEnum.DELIVERY]: [
    'OrdersStack',
    'OrderFinalizationStack',
    'CustomersStack',
    'AreasTablesStack',
  ],
};

// Helper para verificar si un rol tiene permiso para una sección
export const hasPermission = (
  roleId: number | undefined,
  section: DrawerSection,
): boolean => {
  if (!roleId) return false;

  const permissions = ROLE_PERMISSIONS[roleId as RoleEnum];
  return permissions ? permissions.includes(section) : false;
};

// Agrupar secciones por categoría para facilitar el renderizado
export const DRAWER_SECTIONS = {
  sales: {
    title: 'Ventas',
    items: [
      {
        route: 'OrdersStack',
        label: 'Órdenes',
        icon: 'clipboard-list-outline',
      },
      {
        route: 'OrderFinalizationStack',
        label: 'Finalización',
        icon: 'clipboard-check-outline',
      },
      { route: 'ReceiptsStack', label: 'Recibos', icon: 'receipt' },
    ],
  },
  configuration: {
    title: 'Configuración',
    items: [
      { route: 'MenuStack', label: 'Menú', icon: 'menu' },
      {
        route: 'AvailabilityScreen',
        label: 'Disponibilidad',
        icon: 'eye-off-outline',
      },
      { route: 'ModifiersStack', label: 'Modificadores', icon: 'tune' },
      {
        route: 'PizzaCustomizationsStack',
        label: 'Personalización Pizzas',
        icon: 'pizza',
      },
      {
        route: 'PreparationScreensStack',
        label: 'Pantallas Preparación',
        icon: 'monitor-dashboard',
      },
      {
        route: 'AreasTablesStack',
        label: 'Áreas y Mesas',
        icon: 'map-marker-radius-outline',
      },
      { route: 'PrintersStack', label: 'Impresoras', icon: 'printer' },
      {
        route: 'RestaurantConfigStack',
        label: 'Configuración',
        icon: 'cog-outline',
      },
      {
        route: 'CustomersStack',
        label: 'Clientes',
        icon: 'account-group-outline',
      },
      { route: 'SyncStack', label: 'Sincronización', icon: 'sync' },
    ],
  },
  administration: {
    title: 'Administración',
    items: [
      { route: 'UsersScreen', label: 'Usuarios', icon: 'account-multiple' },
      {
        route: 'ShiftAuditStack',
        label: 'Historial de Turnos',
        icon: 'history',
      },
    ],
  },
} as const;
