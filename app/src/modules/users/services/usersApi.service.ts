import apiClient from '@/app/services/apiClient';
import { API_PATHS } from '@/app/constants/apiPaths';
import type { User } from '@/app/schemas/domain/user.schema';
import type {
  CreateUserDto,
  UpdateUserDto,
  UsersQuery,
  UsersResponse,
} from '../schema/user.schema';

export const usersApiService = {
  async findAll(params?: UsersQuery): Promise<UsersResponse> {
    const queryParams: Record<string, any> = {};

    if (params?.page) queryParams.page = params.page.toString();
    if (params?.limit) queryParams.limit = params.limit.toString();
    if (params?.search) queryParams.search = params.search;
    if (params?.sortBy) queryParams.sortBy = params.sortBy;
    if (params?.sortOrder) queryParams.sortOrder = params.sortOrder;

    // El backend espera filters como un string JSON
    if (params?.filters && Object.keys(params.filters).length > 0) {
      queryParams.filters = JSON.stringify(params.filters);
    }

    const response = await apiClient.get(API_PATHS.USERS, {
      params: queryParams,
    });

    return response.data;
  },

  async create(data: CreateUserDto): Promise<User> {
    const response = await apiClient.post(API_PATHS.USERS, data);
    return response.data;
  },

  async update(id: string, data: UpdateUserDto): Promise<User> {
    const response = await apiClient.patch(
      API_PATHS.USERS_BY_ID.replace(':id', id),
      data,
    );
    return response.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(API_PATHS.USERS_BY_ID.replace(':id', id));
  },

  async resetPassword(id: string, newPassword: string): Promise<User> {
    const response = await apiClient.patch(
      API_PATHS.USERS_BY_ID.replace(':id', id),
      {
        password: newPassword,
      },
    );
    return response.data;
  },

  async toggleActive(id: string, isActive: boolean): Promise<User> {
    const response = await apiClient.patch(
      API_PATHS.USERS_BY_ID.replace(':id', id),
      {
        isActive,
      },
    );
    return response.data;
  },
};
