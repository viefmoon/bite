import { create } from 'zustand';
import EncryptedStorage from '@/app/services/secureStorageService';
import { STORAGE_KEYS } from '../constants/storageKeys';
import type { User } from '../schemas/domain/user.schema';
import * as ScreenOrientation from 'expo-screen-orientation';

export interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  setTokens: (
    accessToken: string,
    refreshToken: string,
    user: User | null,
  ) => Promise<void>;
  setAccessToken: (accessToken: string) => Promise<void>;
  setRefreshToken: (refreshToken: string) => Promise<void>;
  setUser: (user: User | null) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
  user: null,

  setTokens: async (
    accessToken: string,
    refreshToken: string,
    user: User | null,
  ) => {
    // Verificar si el usuario está activo antes de guardar los tokens
    if (user && 'isActive' in user && !user.isActive) {
      throw new Error('Usuario inactivo');
    }

    await EncryptedStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken);
    await EncryptedStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    if (user) {
      await EncryptedStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user));
    } else {
      await EncryptedStorage.removeItem(STORAGE_KEYS.USER_INFO);
    }
    set({
      accessToken,
      refreshToken,
      user: user ?? null,
      isAuthenticated: true,
    });
  },

  setAccessToken: async (accessToken: string) => {
    try {
      await EncryptedStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken);
      set({ accessToken, isAuthenticated: true });
    } catch (error) {
      // Silently ignore storage error
    }
  },

  setRefreshToken: async (refreshToken: string) => {
    try {
      await EncryptedStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      set({ refreshToken });
    } catch (error) {
      // Silently ignore storage error
    }
  },

  setUser: async (user: User | null) => {
    try {
      if (user) {
        // Si el usuario se actualiza y está inactivo, cerrar sesión
        if ('isActive' in user && !user.isActive) {
          await useAuthStore.getState().logout();
          return;
        }
        await EncryptedStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user));
      } else {
        await EncryptedStorage.removeItem(STORAGE_KEYS.USER_INFO);
      }
      set({ user });
    } catch (error) {
      // Silently ignore storage error
    }
  },

  logout: async () => {
    const ORIENTATION_DELAYS = {
      UNLOCK: 100,
      LOCK: 200,
    };

    const clearAuthData = async () => {
      await EncryptedStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      await EncryptedStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      await EncryptedStorage.removeItem(STORAGE_KEYS.USER_INFO);
      set({
        accessToken: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
      });
    };

    try {
      await ScreenOrientation.unlockAsync();
      await new Promise((resolve) =>
        setTimeout(resolve, ORIENTATION_DELAYS.UNLOCK),
      );
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      );
      await new Promise((resolve) =>
        setTimeout(resolve, ORIENTATION_DELAYS.LOCK),
      );
      await clearAuthData();
    } catch (error) {
      try {
        await clearAuthData();
      } catch (fallbackError) {
        // Silently handle critical error
      }
    }
  },
}));

export const initializeAuthStore = async () => {
  try {
    const accessToken = await EncryptedStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const refreshToken = await EncryptedStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    const userInfoString = await EncryptedStorage.getItem(STORAGE_KEYS.USER_INFO);
    let user: User | null = null;
    if (userInfoString) {
      try {
        user = JSON.parse(userInfoString);
      } catch (parseError) {
        await EncryptedStorage.removeItem(STORAGE_KEYS.USER_INFO);
      }
    }

    if (accessToken && refreshToken) {
      // Verificar si el usuario está activo antes de restaurar la sesión
      if (user && 'isActive' in user && !user.isActive) {
        await EncryptedStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        await EncryptedStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        await EncryptedStorage.removeItem(STORAGE_KEYS.USER_INFO);
        useAuthStore.setState({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        });
        return;
      }

      // Primero establecemos el token en el estado para que el apiClient pueda usarlo
      useAuthStore.setState({
        accessToken,
        refreshToken,
        user,
        isAuthenticated: true,
      });

      // La verificación del token se hará de manera lazy cuando sea necesario
      // Esto evita el ciclo de dependencias con authService
    } else {
      useAuthStore.setState({
        accessToken: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
      });
    }
  } catch (error) {
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    });
  }
};
