import { useEffect, useState } from 'react';
import { initializeAuthStore } from '../stores/authStore';
import { verifyStoredToken } from '../utils/tokenVerification';

export function useInitializeAuth() {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeAuthStore();
        // Verificar el token después de inicializar el store
        await verifyStoredToken();
      } catch (error) {
        // Silently ignore initialization error
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
  }, []);

  return isInitializing;
}
