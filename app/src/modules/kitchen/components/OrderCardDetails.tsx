import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import { useResponsive } from '@/app/hooks/useResponsive';
import {
  KitchenOrder,
  PreparationScreenStatus,
} from '../schema/kitchen.schema';

interface OrderCardDetailsProps {
  order: KitchenOrder;
}

export const OrderCardDetails: React.FC<OrderCardDetailsProps> = ({
  order,
}) => {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const styles = createStyles(responsive, theme);

  const hasMultipleScreens =
    order.screenStatuses && order.screenStatuses.length > 1;

  const getScreenStatusColor = (status: PreparationScreenStatus) => {
    switch (status) {
      case PreparationScreenStatus.READY:
        return '#4CAF50';
      case PreparationScreenStatus.IN_PREPARATION:
        return '#FF6B35';
      default:
        return '#9C27B0';
    }
  };

  return (
    <>
      {order.orderNotes && (
        <>
          <View style={styles.details}>
            <Text variant="bodyMedium" style={styles.notes}>
              📝 {order.orderNotes}
            </Text>
          </View>
          <Divider style={styles.divider} />
        </>
      )}

      {hasMultipleScreens && (
        <>
          <View style={styles.screenStatusContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.screenStatusList}>
                {order.screenStatuses.map((screenStatus) => (
                  <View
                    key={screenStatus.screenId}
                    style={[
                      styles.screenStatusItem,
                      {
                        backgroundColor: getScreenStatusColor(
                          screenStatus.status,
                        ),
                      },
                    ]}
                  >
                    <Text style={styles.screenStatusText}>
                      {screenStatus.screenName}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
          <Divider style={styles.divider} />
        </>
      )}
    </>
  );
};

const createStyles = (responsive: any, theme: any) =>
  StyleSheet.create({
    details: {
      paddingHorizontal: responsive.isWeb
        ? responsive.spacingPreset.m
        : responsive.spacingPreset.s,
      paddingVertical: responsive.isWeb
        ? responsive.spacingPreset.s
        : responsive.spacingPreset.xs,
      backgroundColor: theme.colors.errorContainer,
    },
    notes: {
      fontStyle: 'italic',
      fontSize: responsive.isTablet ? 11 : 12,
      lineHeight: responsive.isTablet ? 16 : 14,
      color: theme.colors.onErrorContainer,
    },
    screenStatusContainer: {
      paddingVertical: 8,
      paddingHorizontal: 8,
      backgroundColor: theme.colors.surfaceVariant,
    },
    screenStatusList: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: responsive.spacingPreset.xs,
    },
    screenStatusItem: {
      paddingHorizontal: responsive.spacingPreset.s,
      paddingVertical: responsive.spacingPreset.xs,
      borderRadius: theme.roundness / 2,
      minHeight: 24,
      justifyContent: 'center',
    },
    screenStatusText: {
      fontSize: responsive.fontSizePreset.xs,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    divider: {
      backgroundColor: theme.colors.outlineVariant,
      height: 0.5,
    },
  });
