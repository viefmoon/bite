// DEPRECATED: This file is being refactored into smaller, focused stores.
// Use the new stores instead:
// - useCartStore for cart-related operations
// - useOrderFormStore for form data
// - useOrderUIStore for UI state
// - useOrderManagement for combined operations

import {
  useOrderManagement,
  useOrderValidation,
  useOrderSubtotal,
  useOrderTotal,
  useOrderItemsCount,
  useIsOrderEmpty,
  useOrderConfirmation,
} from './useOrderManagement';

// Re-export types for backward compatibility
export type { CartItem, CartItemModifier } from '../utils/cartUtils';
export type { OrderDetailsForBackend } from '../utils/orderUtils';

// Legacy hook for backward compatibility
// This wraps the new refactored stores to maintain the same API
export const useOrderStore = () => {
  return useOrderManagement();
};

// Re-export the individual hooks
export {
  useOrderValidation,
  useOrderSubtotal,
  useOrderTotal,
  useOrderItemsCount,
  useIsOrderEmpty,
  useOrderConfirmation,
};
