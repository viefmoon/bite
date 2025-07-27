import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import EncryptedStorage from '@/app/services/secureStorageService';
import { STORAGE_KEYS } from '@/app/constants/storageKeys';
import { KitchenFilters } from '../schema/kitchen.schema';

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
      name: STORAGE_KEYS.KITCHEN_FILTERS_PREFERENCES,
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
