// Services
export { customersService } from './services/customersService';
export { addressesService } from './services/addressesService';

// Hooks
export * from './hooks/useCustomersQueries';

// Types and Schema types
export type {
  Customer,
  Address,
  ChatMessage,
  FindAllCustomersQuery,
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