import { useState, useEffect } from 'react';
import { serverConnectionService } from '@/services/serverConnectionService';

export interface ServerConnectionState {
  isSearching: boolean;
  isConnected: boolean;
  error: string | null;
  serverUrl: string | null;
  hasWifi: boolean;
  isHealthy: boolean;
  retry: () => void;
}

export function useServerConnection(): ServerConnectionState {
  const [state, setState] = useState(() => {
    const serviceState = serverConnectionService.getState();
    return {
      isSearching: serviceState.isSearching,
      isConnected: serviceState.isConnected,
      error: serviceState.error,
      serverUrl: serviceState.currentUrl,
      hasWifi: serviceState.hasWifi,
      isHealthy: serviceState.isHealthy,
      retry: () => {},
    };
  });

  useEffect(() => {
    const serviceState = serverConnectionService.getState();
    setState({
      isSearching: serviceState.isSearching,
      isConnected: serviceState.isConnected,
      error: serviceState.error,
      serverUrl: serviceState.currentUrl,
      hasWifi: serviceState.hasWifi,
      isHealthy: serviceState.isHealthy,
      retry: () => serverConnectionService.retry(),
    });

    const unsubscribe = serverConnectionService.subscribe((newState) => {
      setState({
        isSearching: newState.isSearching,
        isConnected: newState.isConnected,
        error: newState.error,
        serverUrl: newState.currentUrl,
        hasWifi: newState.hasWifi,
        isHealthy: newState.isHealthy,
        retry: () => serverConnectionService.retry(),
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return state;
}
