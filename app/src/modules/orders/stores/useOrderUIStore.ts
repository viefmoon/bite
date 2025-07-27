import { create } from 'zustand';

interface OrderUIState {
  isCartVisible: boolean;
  isLoading: boolean;
  isConfirming: boolean;
  showCart: () => void;
  hideCart: () => void;
  setIsLoading: (loading: boolean) => void;
  setIsConfirming: (confirming: boolean) => void;
  resetUI: () => void;
}

export const useOrderUIStore = create<OrderUIState>((set) => ({
  isCartVisible: false,
  isLoading: false,
  isConfirming: false,

  showCart: () => {
    set({ isCartVisible: true });
  },

  hideCart: () => {
    set({ isCartVisible: false });
  },

  setIsLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setIsConfirming: (confirming: boolean) => {
    set({ isConfirming: confirming });
  },

  resetUI: () => {
    set({
      isCartVisible: false,
      isLoading: false,
      isConfirming: false,
    });
  },
}));
