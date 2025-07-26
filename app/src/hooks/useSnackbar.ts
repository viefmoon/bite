import { useSnackbarStore, SnackbarType } from '../app/store/snackbarStore';

export function useSnackbar() {
  const { showSnackbar: show, hideSnackbar } = useSnackbarStore();

  const showSnackbar = (
    message: string,
    type: SnackbarType = 'info',
    duration?: number,
  ) => {
    show({ message, type, duration });
  };

  return {
    showSnackbar,
    hideSnackbar,
  };
}
