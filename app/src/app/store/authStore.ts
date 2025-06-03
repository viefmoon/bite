import { create } from "zustand";
import EncryptedStorage from "react-native-encrypted-storage";
import type { User } from "../../modules/auth/schema/auth.schema"; // Corregida ruta de importación

const AUTH_TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_INFO_KEY = "user_info";

export interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  setTokens: (accessToken: string, refreshToken: string, user: User | null) => Promise<void>;
  setAccessToken: (accessToken: string) => Promise<void>;
  setUser: (user: User | null) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
  user: null,

  setTokens: async (accessToken: string, refreshToken: string, user: User | null) => {
    try {
      await EncryptedStorage.setItem(AUTH_TOKEN_KEY, accessToken);
      await EncryptedStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      if (user) {
          await EncryptedStorage.setItem(USER_INFO_KEY, JSON.stringify(user));
      } else {
          await EncryptedStorage.removeItem(USER_INFO_KEY);
      }
      set({ accessToken, refreshToken, user: user ?? null, isAuthenticated: true });
    } catch (error) {
      console.error("Error guardando tokens y user info:", error);
    }
  },

  setAccessToken: async (accessToken: string) => {
    try {
      await EncryptedStorage.setItem(AUTH_TOKEN_KEY, accessToken);
      set({ accessToken, isAuthenticated: true });
    } catch (error) {
      console.error("Error guardando access token:", error);
    }
  },

  setUser: async (user: User | null) => {
     try {
         if (user) {
             await EncryptedStorage.setItem(USER_INFO_KEY, JSON.stringify(user));
         } else {
             await EncryptedStorage.removeItem(USER_INFO_KEY);
         }
         set({ user });
     } catch (error) {
         console.error("Error guardando user info:", error);
     }
  },

  logout: async () => {
    try {
      await EncryptedStorage.removeItem(AUTH_TOKEN_KEY);
      await EncryptedStorage.removeItem(REFRESH_TOKEN_KEY);
      await EncryptedStorage.removeItem(USER_INFO_KEY);
      set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false });
      console.log("Sesión cerrada.");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  },
}));

export const initializeAuthStore = async () => {
  try {
    const accessToken = await EncryptedStorage.getItem(AUTH_TOKEN_KEY);
    const refreshToken = await EncryptedStorage.getItem(REFRESH_TOKEN_KEY);
    const userInfoString = await EncryptedStorage.getItem(USER_INFO_KEY);
    let user: User | null = null;
    if (userInfoString) {
        try {
            user = JSON.parse(userInfoString);
        } catch (parseError) {
            console.error("Error parsing user info from EncryptedStorage:", parseError);
            await EncryptedStorage.removeItem(USER_INFO_KEY);
        }
    }

    if (accessToken && refreshToken) {
      useAuthStore.setState({ accessToken, refreshToken, user, isAuthenticated: true });
      console.log("AuthStore inicializado con tokens.");
    } else {
       useAuthStore.setState({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false });
       console.log("AuthStore inicializado sin tokens.");
    }
  } catch (error) {
    console.error("Error inicializando auth store:", error);
     useAuthStore.setState({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false });
  }
};
