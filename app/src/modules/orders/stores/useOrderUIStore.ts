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

const initialState = {
  isCartVisible: false,
  isLoading: false,
  isConfirming: false,
};

export const useOrderUIStore = create<OrderUIState>((set) => ({
  ...initialState,

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
    set(initialState);
  },
}));
