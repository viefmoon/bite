import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Icon } from 'react-native-paper';
import { useAppTheme, AppTheme } from '../../styles/theme';
import { useResponsive } from '../../hooks/useResponsive';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const getStyles = (theme: AppTheme, responsive: ReturnType<typeof useResponsive>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: responsive.isTablet ? responsive.spacing.l : theme.spacing.xl,
    },
    iconContainer: {
      marginBottom: responsive.isTablet ? responsive.spacing.m : theme.spacing.l,
    },
    title: {
      textAlign: 'center',
      marginBottom: theme.spacing.s,
      color: theme.colors.onSurface,
    },
    message: {
      textAlign: 'center',
      marginBottom: responsive.isTablet ? responsive.spacing.m : theme.spacing.l,
      color: theme.colors.onSurfaceVariant,
      paddingHorizontal: responsive.isTablet ? responsive.spacing.l : theme.spacing.xl,
      fontSize: responsive.isTablet ? 14 : 16,
      lineHeight: responsive.isTablet ? 20 : 24,
    },
    button: {
      marginTop: responsive.isTablet ? responsive.spacing.s : theme.spacing.m,
    },
  });

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'folder-open',
  title,
  message,
  actionLabel,
  onAction,
}) => {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const styles = getStyles(theme, responsive);

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Icon source={icon} size={responsive.isTablet ? 56 : 64} color={theme.colors.onSurfaceVariant} />
      </View>
      <Text variant="headlineSmall" style={styles.title}>
        {title}
      </Text>
      {message && (
        <Text variant="bodyLarge" style={styles.message}>
          {message}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button mode="contained" onPress={onAction} style={styles.button}>
          {actionLabel}
        </Button>
      )}
    </View>
  );
};

export default EmptyState;
