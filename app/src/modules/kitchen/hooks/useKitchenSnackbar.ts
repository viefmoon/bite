import { useSnackbarStore } from '@/app/stores/snackbarStore';

export function useKitchenSnackbar() {
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  const showError = (message: string) => {
    // Mostrar errores de forma más discreta con duración más corta
    showSnackbar({ message, type: 'error', duration: 2000 }); // 2 segundos en lugar del default
  };

  return {
    showError,
  };
}
