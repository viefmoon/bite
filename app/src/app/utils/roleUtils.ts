import { RoleEnum, type User } from '../schemas/domain/user.schema';

/**
 * Verifica si el usuario tiene alguno de los roles especificados
 */
const hasAnyRole = (user: User | null, roleIds: RoleEnum[]): boolean => {
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
