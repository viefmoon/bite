import { z } from 'zod';

export interface BackendErrorResponse {
  statusCode: number;
  code: string;
  message: string;
  details?: any;
  timestamp?: string;
  path?: string;
}


export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
