import apiClient from '@/app/services/apiClient';
import { ApiError } from '@/app/lib/errors';
import { API_PATHS } from '@/app/constants/apiPaths';
import {
  Customer,
  CreateCustomerDto,
  UpdateCustomerDto,
  FindAllCustomersQuery,
  ChatMessage,
} from '../types/customer.types';

async function findAll(params?: FindAllCustomersQuery): Promise<Customer[]> {
  const response = await apiClient.get<Customer[]>(API_PATHS.CUSTOMERS, params);
  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(response.data, response.status);
  }
  return response.data;
}

async function findOne(id: string): Promise<Customer> {
  const response = await apiClient.get<Customer>(
    `${API_PATHS.CUSTOMERS}/${id}`,
  );
  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(response.data, response.status);
  }
  return response.data;
}

async function create(data: CreateCustomerDto): Promise<Customer> {
  const response = await apiClient.post<Customer>(API_PATHS.CUSTOMERS, data);
  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(response.data, response.status);
  }
  return response.data;
}

async function update(id: string, data: UpdateCustomerDto): Promise<Customer> {
  const response = await apiClient.patch<Customer>(
    `${API_PATHS.CUSTOMERS}/${id}`,
    data,
  );
  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(response.data, response.status);
  }
  return response.data;
}

async function remove(id: string): Promise<void> {
  const response = await apiClient.delete(`${API_PATHS.CUSTOMERS}/${id}`);
  if (!response.ok) {
    throw ApiError.fromApiResponse(response.data, response.status);
  }
}

// Métodos específicos para chat history
async function appendChatMessage(
  customerId: string,
  message: Omit<ChatMessage, 'timestamp'>,
): Promise<Customer> {
  const response = await apiClient.post<Customer>(
    `${API_PATHS.CUSTOMERS}/${customerId}/chat-message`,
    message,
  );
  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(response.data, response.status);
  }
  return response.data;
}

async function updateRelevantChatHistory(
  customerId: string,
  relevantHistory: ChatMessage[],
): Promise<Customer> {
  const response = await apiClient.patch<Customer>(
    `${API_PATHS.CUSTOMERS}/${customerId}/relevant-chat-history`,
    { relevantHistory },
  );
  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(response.data, response.status);
  }
  return response.data;
}

async function updateCustomerStats(
  customerId: string,
  stats: { totalOrders?: number; totalSpent?: number },
): Promise<Customer> {
  const response = await apiClient.patch<Customer>(
    `${API_PATHS.CUSTOMERS}/${customerId}/stats`,
    stats,
  );
  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(response.data, response.status);
  }
  return response.data;
}

async function getActiveWithRecentInteraction(
  daysAgo: number = 30,
): Promise<Customer[]> {
  const response = await apiClient.get<Customer[]>(
    `${API_PATHS.CUSTOMERS}/active/recent`,
    { daysAgo },
  );
  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(response.data, response.status);
  }
  return response.data;
}

export const customersService = {
  findAll,
  findOne,
  create,
  update,
  remove,
  appendChatMessage,
  updateRelevantChatHistory,
  updateCustomerStats,
  getActiveWithRecentInteraction,
};
