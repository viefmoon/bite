import { useMemo } from 'react';
import { useAppTheme } from '@/app/styles/theme';

export const useOrderScreenStyles = () => {
  const theme = useAppTheme();

  const styles = useMemo(
    () => ({
      safeArea: {
        flex: 1,
        backgroundColor: theme.colors.background,
      },
      appBar: {
        backgroundColor: theme.colors.elevation.level2,
        alignItems: 'center' as const,
      },
      appBarTitle: {
        ...theme.fonts.titleMedium,
        color: theme.colors.onSurface,
        fontWeight: 'bold' as const,
        textAlign: 'center' as const,
      },
      appBarContent: {},
      spacer: {
        width: 48,
      },
    }),
    [theme],
  );

  return { styles };
};
