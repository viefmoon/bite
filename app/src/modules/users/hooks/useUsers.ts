import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApiService } from '../services';
import { useApiMutation } from '@/app/hooks/useApiMutation';
import { useSnackbarStore } from '@/app/stores/snackbarStore';
import type {
  CreateUserDto,
  UpdateUserDto,
  UsersQuery,
} from '../schema/user.schema';

const USERS_QUERY_KEY = 'users';

export function useGetUsers(params?: UsersQuery) {
  return useQuery({
    queryKey: [USERS_QUERY_KEY, params],
    queryFn: () => usersApiService.findAll(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useGetUser(id?: string) {
  return useQuery({
    queryKey: [USERS_QUERY_KEY, id],
    queryFn: () => (id ? usersApiService.findOne(id) : Promise.resolve(null)),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useApiMutation((data: CreateUserDto) => usersApiService.create(data), {
    successMessage: 'Usuario creado exitosamente',
    onSuccess: () => {
      // Invalidar todas las queries que empiecen con USERS_QUERY_KEY
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useApiMutation(
    ({ id, data }: { id: string; data: UpdateUserDto }) =>
      usersApiService.update(id, data),
    {
      successMessage: 'Usuario actualizado exitosamente',
      onSuccess: (_, { id }) => {
        // Invalidar todas las queries que empiecen con USERS_QUERY_KEY
        queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
        // También invalidar la query específica del usuario
        queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY, id] });
      },
    },
  );
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useApiMutation(
    async (id: string) => {
      await usersApiService.remove(id);
      return id;
    },
    {
      successMessage: 'Usuario eliminado exitosamente',
      onSuccess: () => {
        // Invalidar todas las queries que empiecen con USERS_QUERY_KEY
        queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      },
    },
  );
}

export function useResetPassword() {
  const queryClient = useQueryClient();

  return useApiMutation(
    ({ id, password }: { id: string; password: string }) =>
      usersApiService.resetPassword(id, password),
    {
      successMessage: 'Contraseña actualizada exitosamente',
      onSuccess: (_, { id }) => {
        queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY, id] });
      },
    },
  );
}

export function useToggleUserActive() {
  const queryClient = useQueryClient();

  return useApiMutation(
    ({ id, isActive }: { id: string; isActive: boolean }) =>
      usersApiService.toggleActive(id, isActive),
    {
      suppressSuccessMessage: true,
      invalidateQueryKeys: [[USERS_QUERY_KEY]],
      onSuccess: (_, { id, isActive }) => {
        queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY, id] });
        const showSnackbar = useSnackbarStore.getState().showSnackbar;
        showSnackbar({
          message: `Usuario ${isActive ? 'activado' : 'desactivado'} exitosamente`,
          type: 'success',
        });
      },
    },
  );
}
