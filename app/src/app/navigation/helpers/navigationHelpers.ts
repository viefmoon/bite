import { CommonActions } from '@react-navigation/native';
import { DrawerSection, hasPermission } from '@/app/constants/rolePermissions';

// Todas las rutas disponibles en el drawer en orden
export const ALL_DRAWER_ROUTES: DrawerSection[] = [
  'OrdersStack',
  'ReceiptsStack',
  'OrderFinalizationStack',
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
  'KitchenScreen',
];

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

  // Construir las rutas
  const routes = allowedRoutes.map((route) => ({
    name: route,
  }));

  return CommonActions.reset({
    index: targetIndex,
    routes,
  });
};
