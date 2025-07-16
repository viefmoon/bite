import { useEffect, useState } from 'react';
import { initializeAuthStore } from '../store/authStore';

export function useInitializeAuth() {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeAuthStore();
      } catch (error) {
        // Error al inicializar auth store
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
  }, []);

  return isInitializing;
}
