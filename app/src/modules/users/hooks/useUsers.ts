import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApiService } from '../services';
import { useSnackbarStore } from '@/app/store/snackbarStore';
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
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  return useMutation({
    mutationFn: (data: CreateUserDto) => usersApiService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      showSnackbar({
        message: 'Usuario creado exitosamente',
        type: 'success',
      });
    },
    onError: (error: any) => {
      showSnackbar({
        message: error.response?.data?.message || 'Error al crear usuario',
        type: 'error',
      });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserDto }) =>
      usersApiService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY, id] });
      showSnackbar({
        message: 'Usuario actualizado exitosamente',
        type: 'success',
      });
    },
    onError: (error: any) => {
      showSnackbar({
        message: error.response?.data?.message || 'Error al actualizar usuario',
        type: 'error',
      });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  return useMutation({
    mutationFn: async (id: string) => {
      await usersApiService.remove(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      showSnackbar({
        message: 'Usuario eliminado exitosamente',
        type: 'success',
      });
    },
    onError: (error: any) => {
      showSnackbar({
        message: error.response?.data?.message || 'Error al eliminar usuario',
        type: 'error',
      });
    },
  });
}

export function useResetPassword() {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      usersApiService.resetPassword(id, password),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY, id] });
      showSnackbar({
        message: 'Contraseña actualizada exitosamente',
        type: 'success',
      });
    },
    onError: (error: any) => {
      showSnackbar({
        message: error.response?.data?.message || 'Error al cambiar contraseña',
        type: 'error',
      });
    },
  });
}

export function useToggleUserActive() {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      usersApiService.toggleActive(id, isActive),
    onSuccess: (_, { id, isActive }) => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY, id] });
      showSnackbar({
        message: `Usuario ${isActive ? 'activado' : 'desactivado'} exitosamente`,
        type: 'success',
      });
    },
    onError: (error: any) => {
      showSnackbar({
        message:
          error.response?.data?.message ||
          'Error al cambiar estado del usuario',
        type: 'error',
      });
    },
  });
}
