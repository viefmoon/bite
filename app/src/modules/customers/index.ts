// Services
export { customersService } from './services/customersService';
export { addressesService } from './services/addressesService';

// Hooks
export * from './hooks/useCustomersQueries';

// Types
export type {
  Customer,
  Address,
  ChatMessage,
  FindAllCustomersQuery,
} from './types/customer.types';

// Schema types
export type {
  CreateCustomerInput,
  UpdateCustomerInput,
  AddressFormInputs,
  CustomerFormInputs,
} from './schema/customer.schema';

// Schemas
export {
  createCustomerSchema,
  updateCustomerSchema,
  addressSchema,
  customerFormSchema,
} from './schema/customer.schema';