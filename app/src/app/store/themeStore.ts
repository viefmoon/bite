import { useEffect } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import EncryptedStorage from '@/app/services/secureStorageService';
import { useColorScheme, Appearance } from 'react-native';

import {
  ThemePreference,
  THEME_PREFERENCE_STORAGE_KEY,
  THEME_MODE,
} from '../types/theme.types';
import { lightTheme, darkTheme } from '../styles/theme';

interface ThemeState {
  themePreference: ThemePreference;
  activeTheme: typeof lightTheme | typeof darkTheme;
  isSystemDarkMode: boolean | null;
  setThemePreference: (preference: ThemePreference) => void;
  setSystemDarkMode: (isDark: boolean | null) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      themePreference: THEME_MODE.SYSTEM,
      activeTheme: lightTheme,
      isSystemDarkMode: null,

      setThemePreference: (preference: ThemePreference) => {
        const { isSystemDarkMode } = get();
        set({ themePreference: preference });

        if (preference === THEME_MODE.SYSTEM) {
          if (isSystemDarkMode !== null) {
            set({ activeTheme: isSystemDarkMode ? darkTheme : lightTheme });
          }
        } else {
          set({
            activeTheme:
              preference === THEME_MODE.DARK ? darkTheme : lightTheme,
          });
        }
      },

      setSystemDarkMode: (isDark: boolean | null) => {
        const { themePreference } = get();
        set({ isSystemDarkMode: isDark });

        if (themePreference === THEME_MODE.SYSTEM && isDark !== null) {
          set({ activeTheme: isDark ? darkTheme : lightTheme });
        }
      },
    }),

    {
      name: THEME_PREFERENCE_STORAGE_KEY,
      storage: createJSONStorage(() => EncryptedStorage),
      partialize: (state) => ({ themePreference: state.themePreference }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error || !state) {
            return;
          }

          const preference = state.themePreference;

          if (preference === THEME_MODE.LIGHT) {
            state.activeTheme = lightTheme;
            state.isSystemDarkMode = Appearance.getColorScheme() === 'dark';
          } else if (preference === THEME_MODE.DARK) {
            state.activeTheme = darkTheme;
            state.isSystemDarkMode = Appearance.getColorScheme() === 'dark';
          } else {
            const systemScheme = Appearance.getColorScheme();
            const isSystemDark = systemScheme === 'dark';
            state.isSystemDarkMode = isSystemDark;
            state.activeTheme = isSystemDark ? darkTheme : lightTheme;
          }
        };
      },
    },
  ),
);

export function useSystemThemeDetector() {
  const systemColorScheme = useColorScheme();
  const setSystemDarkMode = useThemeStore((state) => state.setSystemDarkMode);

  useEffect(() => {
    const isDarkMode = systemColorScheme === 'dark';
    if (useThemeStore.getState().isSystemDarkMode !== isDarkMode) {
      setSystemDarkMode(isDarkMode);
    }
  }, [systemColorScheme, setSystemDarkMode]);
}
