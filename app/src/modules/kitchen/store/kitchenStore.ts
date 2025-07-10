import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import EncryptedStorage from 'react-native-encrypted-storage';
import { KitchenFilters, OrderType } from '../types/kitchen.types';

const KITCHEN_FILTERS_STORAGE_KEY = 'kitchen-filters-preferences';

interface KitchenStore {
  filters: KitchenFilters;
  setFilters: (filters: KitchenFilters) => void;
  resetFilters: () => void;
}

const defaultFilters: KitchenFilters = {
  orderType: undefined,
  showPrepared: true,
  showAllProducts: true,
  ungroupProducts: false,
};

export const useKitchenStore = create<KitchenStore>()(
  persist(
    (set) => ({
      filters: defaultFilters,
      setFilters: (filters) => set({ filters }),
      resetFilters: () => set({ filters: defaultFilters }),
    }),
    {
      name: KITCHEN_FILTERS_STORAGE_KEY,
      storage: createJSONStorage(() => EncryptedStorage),
      partialize: (state) => ({ filters: state.filters }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('Error rehydrating kitchen filters:', error);
            return;
          }
          if (!state) {
            console.warn(
              'State not available during kitchen filters rehydration',
            );
            return;
          }
          console.log('Kitchen filters restored:', state.filters);
        };
      },
    },
  ),
);
