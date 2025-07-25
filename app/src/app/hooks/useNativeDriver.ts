import { Platform } from 'react-native';

/**
 * Hook para determinar si usar el driver nativo para animaciones
 * En web, siempre devuelve false para evitar advertencias
 */
export function useNativeDriver(): boolean {
  return Platform.OS !== 'web';
}
