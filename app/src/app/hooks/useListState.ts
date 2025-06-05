import React, { useMemo } from "react";
import EmptyState from "../components/common/EmptyState";

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
}

export const useListState = ({
  isLoading,
  isError,
  data,
  emptyConfig,
}: UseListStateProps) => {
  const isEmpty = useMemo(() => {
    return !isLoading && !isError && data && data.length === 0;
  }, [isLoading, isError, data]);

  const ListEmptyComponent = useMemo(() => {
    // Return a function component instead of JSX directly
    return () => {
      if (isLoading) return null;
      
      if (isError) {
        return React.createElement(EmptyState, {
          icon: "alert-circle",
          title: "Error al cargar los datos",
          message: "Ocurrió un error al cargar la información. Por favor, intenta de nuevo.",
          actionLabel: "Reintentar",
          onAction: emptyConfig.onAction,
        });
      }

      if (isEmpty) {
        return React.createElement(EmptyState, {
          icon: emptyConfig.icon || "folder-open",
          title: emptyConfig.title,
          message: emptyConfig.message,
          actionLabel: emptyConfig.actionLabel,
          onAction: emptyConfig.onAction,
        });
      }

      return null;
    };
  }, [isLoading, isError, isEmpty, emptyConfig]);

  return {
    isEmpty,
    ListEmptyComponent,
  };
};