import type { User } from '@/modules/auth/schema/auth.schema';

/**
 * Enum de roles basado en los IDs del backend
 */
export enum RoleEnum {
  ADMIN = 1,
  MANAGER = 2,
  CASHIER = 3,
  WAITER = 4,
  KITCHEN = 5,
}

/**
 * Verifica si el usuario tiene un rol específico
 */
export const hasRole = (user: User | null, roleId: RoleEnum): boolean => {
  return user?.role?.id === roleId;
};

/**
 * Verifica si el usuario tiene alguno de los roles especificados
 */
export const hasAnyRole = (user: User | null, roleIds: RoleEnum[]): boolean => {
  if (!user?.role?.id) return false;
  return roleIds.includes(user.role.id);
};

/**
 * Verificaciones de roles específicos
 */
export const isAdmin = (user: User | null): boolean => {
  return hasRole(user, RoleEnum.ADMIN);
};

export const isManager = (user: User | null): boolean => {
  return hasRole(user, RoleEnum.MANAGER);
};

export const isCashier = (user: User | null): boolean => {
  return hasRole(user, RoleEnum.CASHIER);
};

export const isWaiter = (user: User | null): boolean => {
  return hasRole(user, RoleEnum.WAITER);
};

export const isKitchen = (user: User | null): boolean => {
  return hasRole(user, RoleEnum.KITCHEN);
};

/**
 * Permisos específicos de funcionalidad
 */
export const canOpenShift = (user: User | null): boolean => {
  return hasAnyRole(user, [RoleEnum.ADMIN, RoleEnum.MANAGER]);
};


export const canRegisterPayments = (user: User | null): boolean => {
  return hasAnyRole(user, [RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.CASHIER]);
};

export const canManageOrders = (user: User | null): boolean => {
  return hasAnyRole(user, [RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.WAITER, RoleEnum.CASHIER]);
};

export const canAccessKitchen = (user: User | null): boolean => {
  return hasRole(user, RoleEnum.KITCHEN);
};

/**
 * Obtiene el nombre del rol para mostrar en la UI
 */
export const getRoleName = (user: User | null): string => {
  if (!user?.role) return 'Sin rol';
  
  // Usar el nombre del rol si está disponible
  if (user.role.name) {
    return user.role.name;
  }
  
  // Fallback basado en el ID
  switch (user.role.id) {
    case RoleEnum.ADMIN:
      return 'Administrador';
    case RoleEnum.MANAGER:
      return 'Gerente';
    case RoleEnum.CASHIER:
      return 'Cajero';
    case RoleEnum.WAITER:
      return 'Mesero';
    case RoleEnum.KITCHEN:
      return 'Cocina';
    default:
      return 'Usuario';
  }
};