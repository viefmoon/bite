import { useCartStore } from '../stores/useCartStore';
import { useOrderFormStore } from '../stores/useOrderFormStore';
import { useOrderUIStore } from '../stores/useOrderUIStore';

/**
 * Limpia completamente el estado de la orden (carrito, formulario y UI)
 * Útil cuando se sale de la edición de una orden para evitar datos residuales
 */
export const cleanupOrderState = () => {
  try {
    useCartStore.getState().resetCart();
    useOrderFormStore.getState().resetForm();
    useOrderUIStore.getState().resetUI();
  } catch (error) {
    console.warn('Error al limpiar el estado:', error);
  }
};