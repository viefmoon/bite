import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import EncryptedStorage from '@/app/services/secureStorageService';
import { KitchenFilters } from '../schema/kitchen.schema';

const KITCHEN_FILTERS_STORAGE_KEY = 'kitchen_filters_preferences';

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
            return;
          }
          if (!state) {
            return;
          }
        };
      },
    },
  ),
);
