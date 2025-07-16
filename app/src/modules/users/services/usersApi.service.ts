import apiClient from '@/app/services/apiClient';
import { ApiError } from '@/app/lib/errors';
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
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    if (params?.filters) {
      if (params.filters.isActive !== undefined) {
        queryParams.append(
          'filters[isActive]',
          params.filters.isActive.toString(),
        );
      }
      if (params.filters.roles && params.filters.roles.length > 0) {
        queryParams.append(
          'filters[roles]',
          JSON.stringify(params.filters.roles),
        );
      }
    }

    const response = await apiClient.get(
      `${API_PATHS.USERS}?${queryParams.toString()}`,
    );

    if (!response.ok || !response.data) {
      throw ApiError.fromApiResponse(response.data, response.status);
    }

    return response.data;
  },

  async findOne(id: string): Promise<User> {
    const response = await apiClient.get(API_PATHS.USERS_BY_ID.replace(':id', id));
    if (!response.ok || !response.data) {
      throw ApiError.fromApiResponse(response.data, response.status);
    }
    return response.data;
  },

  async create(data: CreateUserDto): Promise<User> {
    const response = await apiClient.post(API_PATHS.USERS, data);
    if (!response.ok || !response.data) {
      throw ApiError.fromApiResponse(response.data, response.status);
    }
    return response.data;
  },

  async update(id: string, data: UpdateUserDto): Promise<User> {
    const response = await apiClient.patch(API_PATHS.USERS_BY_ID.replace(':id', id), data);
    if (!response.ok || !response.data) {
      throw ApiError.fromApiResponse(response.data, response.status);
    }
    return response.data;
  },

  async remove(id: string): Promise<void> {
    const response = await apiClient.delete(API_PATHS.USERS_BY_ID.replace(':id', id));
    if (!response.ok) {
      throw ApiError.fromApiResponse(response.data, response.status);
    }
  },

  async resetPassword(id: string, newPassword: string): Promise<User> {
    const response = await apiClient.patch(API_PATHS.USERS_BY_ID.replace(':id', id), {
      password: newPassword,
    });
    if (!response.ok || !response.data) {
      throw ApiError.fromApiResponse(response.data, response.status);
    }
    return response.data;
  },

  async toggleActive(id: string, isActive: boolean): Promise<User> {
    const response = await apiClient.patch(API_PATHS.USERS_BY_ID.replace(':id', id), {
      isActive,
    });
    if (!response.ok || !response.data) {
      throw ApiError.fromApiResponse(response.data, response.status);
    }
    return response.data;
  },
};
