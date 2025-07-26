import apiClient from '@/app/services/apiClient';
import { API_PATHS } from '@/app/constants/apiPaths';
import {
  Customer,
  FindAllCustomersQuery,
  ChatMessage,
} from '../types/customer.types';
import {
  CreateCustomerInput,
  UpdateCustomerInput,
} from '../schema/customer.schema';

async function findAll(params?: FindAllCustomersQuery): Promise<Customer[]> {
  const response = await apiClient.get<Customer[]>(API_PATHS.CUSTOMERS, {
    params,
  });
  return response.data;
}

async function findOne(id: string): Promise<Customer> {
  const response = await apiClient.get<Customer>(
    API_PATHS.CUSTOMERS_BY_ID.replace(':id', id),
  );
  return response.data;
}

async function create(data: CreateCustomerInput): Promise<Customer> {
  const response = await apiClient.post<Customer>(API_PATHS.CUSTOMERS, data);
  return response.data;
}

async function update(id: string, data: UpdateCustomerInput): Promise<Customer> {
  const response = await apiClient.patch<Customer>(
    API_PATHS.CUSTOMERS_BY_ID.replace(':id', id),
    data,
  );
  return response.data;
}

async function remove(id: string): Promise<void> {
  await apiClient.delete(API_PATHS.CUSTOMERS_BY_ID.replace(':id', id));
}

// Métodos específicos para chat history
async function appendChatMessage(
  customerId: string,
  message: Omit<ChatMessage, 'timestamp'>,
): Promise<Customer> {
  const response = await apiClient.post<Customer>(
    API_PATHS.CUSTOMERS_CHAT_MESSAGE.replace(':customerId', customerId),
    message,
  );
  return response.data;
}

async function updateRelevantChatHistory(
  customerId: string,
  relevantHistory: ChatMessage[],
): Promise<Customer> {
  const response = await apiClient.patch<Customer>(
    API_PATHS.CUSTOMERS_CHAT_HISTORY.replace(':customerId', customerId),
    { relevantHistory },
  );
  return response.data;
}

async function updateCustomerStats(
  customerId: string,
  stats: { totalOrders?: number; totalSpent?: number },
): Promise<Customer> {
  const response = await apiClient.patch<Customer>(
    API_PATHS.CUSTOMERS_STATS.replace(':customerId', customerId),
    stats,
  );
  return response.data;
}

async function getActiveWithRecentInteraction(
  daysAgo: number = 30,
): Promise<Customer[]> {
  const response = await apiClient.get<Customer[]>(
    API_PATHS.CUSTOMERS_ACTIVE_RECENT,
    { params: { daysAgo } },
  );
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
