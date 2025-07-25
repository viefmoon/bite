export const ERROR_CODES = {
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_INCORRECT_PASSWORD: 'AUTH_INCORRECT_PASSWORD',
  AUTH_DUPLICATE_EMAIL: 'AUTH_DUPLICATE_EMAIL',
  AUTH_DUPLICATE_USERNAME: 'AUTH_DUPLICATE_USERNAME',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  AUTH_FORBIDDEN: 'AUTH_FORBIDDEN',
  REFRESH_FAILED: 'REFRESH_FAILED',

  VALIDATION_ERROR: 'VALIDATION_ERROR',

  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',

  CONFLICT_ERROR: 'CONFLICT_ERROR',
  PRODUCT_NAME_EXISTS: 'PRODUCT_NAME_EXISTS',

  NETWORK_ERROR: 'NETWORK_ERROR',
  API_CLIENT_ERROR: 'API_CLIENT_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  UNKNOWN_API_ERROR: 'UNKNOWN_API_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',

  UPLOAD_FAILED: 'UPLOAD_FAILED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
} as const;

export type ApiErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
