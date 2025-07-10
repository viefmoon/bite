import { CommonActions } from '@react-navigation/native';
import { DrawerSection, hasPermission } from '@/app/constants/rolePermissions';

// Todas las rutas disponibles en el drawer en orden
export const ALL_DRAWER_ROUTES: DrawerSection[] = [
  'OrdersStack',
  'ReceiptsStack',
  'OrderFinalizationStack',
  'MenuStack',
  'AvailabilityStack',
  'ModifiersStack',
  'PizzaCustomizationsStack',
  'PreparationScreensStack',
  'AreasTablesStack',
  'PrintersStack',
  'RestaurantConfigStack',
  'CustomersStack',
  'SyncStack',
  'UsersStack',
  'KitchenStack',
];

// Mapa de rutas a sus pantallas iniciales
export const ROUTE_INITIAL_SCREENS: Record<DrawerSection, string> = {
  OrdersStack: 'Orders',
  ReceiptsStack: 'ReceiptsList',
  OrderFinalizationStack: 'OrderFinalizationScreen',
  MenuStack: 'CategoriesScreen',
  AvailabilityStack: 'AvailabilityScreen',
  ModifiersStack: 'ModifierGroupsScreen',
  PizzaCustomizationsStack: 'PizzaCustomizationsList',
  PreparationScreensStack: 'PreparationScreensList',
  AreasTablesStack: 'AreasList',
  PrintersStack: 'PrintersList',
  RestaurantConfigStack: 'RestaurantConfig',
  CustomersStack: 'Customers',
  SyncStack: 'SyncStatus',
  UsersStack: 'UsersList',
  KitchenStack: 'KitchenOrders',
};

// Helper para generar la acción de navegación
export const generateNavigationAction = (
  targetRoute: DrawerSection,
  userRoleId: number | undefined,
) => {
  // Filtrar rutas basándose en permisos
  const allowedRoutes = ALL_DRAWER_ROUTES.filter((route) =>
    hasPermission(userRoleId, route),
  );

  // Encontrar el índice de la ruta objetivo
  const targetIndex = allowedRoutes.indexOf(targetRoute);

  if (targetIndex === -1) {
    return null;
  }

  // Construir las rutas con sus estados iniciales
  const routes = allowedRoutes.map((route, index) => {
    const baseRoute = { name: route };

    // Solo agregar state a la ruta activa
    if (index === targetIndex) {
      return {
        ...baseRoute,
        state: {
          routes: [{ name: ROUTE_INITIAL_SCREENS[route] }],
        },
      };
    }

    return baseRoute;
  });

  return CommonActions.reset({
    index: targetIndex,
    routes,
  });
};
