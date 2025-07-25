import apiClient from '@/app/services/apiClient';
import { API_PATHS } from '@/app/constants/apiPaths';
import type {
  User,
  CreateUserDto,
  UpdateUserDto,
  UsersQuery,
  UsersResponse,
} from '../types';

export const usersApiService = {
  async findAll(params?: UsersQuery): Promise<UsersResponse> {
    const queryParams: Record<string, any> = {};

    if (params?.page) queryParams.page = params.page.toString();
    if (params?.limit) queryParams.limit = params.limit.toString();
    if (params?.search) queryParams.search = params.search;
    if (params?.sortBy) queryParams.sortBy = params.sortBy;
    if (params?.sortOrder) queryParams.sortOrder = params.sortOrder;

    if (params?.filters) {
      if (params.filters.isActive !== undefined) {
        queryParams['filters[isActive]'] = params.filters.isActive.toString();
      }
      if (params.filters.roles && params.filters.roles.length > 0) {
        queryParams['filters[roles]'] = JSON.stringify(params.filters.roles);
      }
    }

    const response = await apiClient.get(API_PATHS.USERS, {
      params: queryParams,
    });

    return response.data;
  },

  async findOne(id: string): Promise<User> {
    const response = await apiClient.get(
      API_PATHS.USERS_BY_ID.replace(':id', id),
    );
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
