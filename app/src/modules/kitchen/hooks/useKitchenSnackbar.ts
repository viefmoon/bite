import { useSnackbar } from '@/hooks/useSnackbar';

export function useKitchenSnackbar() {
  const { showSnackbar } = useSnackbar();

  const showError = (message: string) => {
    // Mostrar errores de forma más discreta con duración más corta
    showSnackbar(message, 'error', 2000); // 2 segundos en lugar del default
  };

  return {
    showError,
  };
}
