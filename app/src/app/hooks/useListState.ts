import { useMemo, createElement } from 'react';
import EmptyState from '../components/common/EmptyState';

interface UseListStateProps {
  isLoading: boolean;
  isError: boolean;
  data: any[] | undefined;
  emptyConfig: {
    title: string;
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
    icon?: string;
  };
  errorConfig?: {
    title?: string;
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
    onRetry?: (...args: any[]) => any;
    icon?: string;
  };
}

export const useListState = ({
  isLoading,
  isError,
  data,
  emptyConfig,
  errorConfig,
}: UseListStateProps) => {
  const isEmpty = useMemo(() => {
    return !isLoading && !isError && data && data.length === 0;
  }, [isLoading, isError, data]);

  const ListEmptyComponent = useMemo(() => {
    // Return a function component instead of JSX directly
    return () => {
      if (isLoading) return null;

      if (isError) {
        return createElement(EmptyState, {
          icon: errorConfig?.icon || 'alert-circle',
          title: errorConfig?.title || 'Error al cargar los datos',
          message:
            errorConfig?.message ||
            'Ocurrió un error al cargar la información. Por favor, intenta de nuevo.',
          actionLabel: errorConfig?.actionLabel || 'Reintentar',
          onAction: errorConfig?.onAction || errorConfig?.onRetry || emptyConfig.onAction,
        });
      }

      if (isEmpty) {
        return createElement(EmptyState, {
          icon: emptyConfig.icon || 'folder-open',
          title: emptyConfig.title,
          message: emptyConfig.message,
          actionLabel: emptyConfig.actionLabel,
          onAction: emptyConfig.onAction,
        });
      }

      return null;
    };
  }, [isLoading, isError, isEmpty, emptyConfig, errorConfig]);

  return {
    isEmpty,
    ListEmptyComponent,
  };
};
