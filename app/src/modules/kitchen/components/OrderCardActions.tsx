import React from 'react';
import { View, StyleSheet } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import { useResponsive } from '@/app/hooks/useResponsive';

interface OrderCardActionsProps {
  onShowHistory: () => void;
}

export const OrderCardActions: React.FC<OrderCardActionsProps> = ({
  onShowHistory,
}) => {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const styles = createStyles(responsive, theme);

  return (
    <View style={styles.floatingButtonContainer}>
      <IconButton
        icon="file-document-multiple-outline"
        size={responsive.isWeb ? 32 : 28}
        iconColor={theme.colors.surface}
        style={[
          styles.floatingButton,
          styles.floatingButtonBackground,
          responsive.isWeb
            ? styles.floatingButtonWeb
            : styles.floatingButtonMobile,
        ]}
        onPress={onShowHistory}
      />
    </View>
  );
};

const createStyles = (_responsive: any, theme: any) =>
  StyleSheet.create({
    floatingButtonContainer: {
      position: 'absolute',
      bottom: 10,
      right: 10,
      width: 48,
      height: 48,
    },
    floatingButton: {
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      margin: 0,
      opacity: 0.7,
    },
    floatingButtonBackground: {
      backgroundColor: theme.colors.primary,
    },
    floatingButtonWeb: {
      width: 56,
      height: 56,
      borderRadius: 28,
    },
    floatingButtonMobile: {
      width: 48,
      height: 48,
      borderRadius: 24,
    },
  });
