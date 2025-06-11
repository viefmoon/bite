import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Icon } from 'react-native-paper';
import { useAppTheme, AppTheme } from '../../styles/theme';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    iconContainer: {
      marginBottom: theme.spacing.l,
    },
    title: {
      textAlign: 'center',
      marginBottom: theme.spacing.s,
      color: theme.colors.onSurface,
    },
    message: {
      textAlign: 'center',
      marginBottom: theme.spacing.l,
      color: theme.colors.onSurfaceVariant,
      paddingHorizontal: theme.spacing.xl,
    },
    button: {
      marginTop: theme.spacing.m,
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
  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Icon source={icon} size={64} color={theme.colors.onSurfaceVariant} />
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
