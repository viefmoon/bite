import type { User } from '@/app/schemas/domain/user.schema';

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
 * Permisos específicos de funcionalidad
 */
export const canOpenShift = (user: User | null): boolean => {
  return hasAnyRole(user, [RoleEnum.ADMIN, RoleEnum.MANAGER]);
};

export const canRegisterPayments = (user: User | null): boolean => {
  return hasAnyRole(user, [RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.CASHIER]);
};


