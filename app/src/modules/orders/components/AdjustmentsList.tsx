import React from 'react';
import { View, StyleSheet } from 'react-native';
import { List, IconButton, Text, Chip, Divider } from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import type { OrderAdjustment } from '../types/adjustments.types';

interface AdjustmentsListProps {
  adjustments: OrderAdjustment[];
  onEdit: (adjustment: OrderAdjustment) => void;
  onDelete: (adjustment: OrderAdjustment) => void;
}

export const AdjustmentsList: React.FC<AdjustmentsListProps> = ({
  adjustments,
  onEdit,
  onDelete,
}) => {
  const theme = useAppTheme();

  if (adjustments.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>
        Ajustes aplicados
      </Text>
      <Divider style={styles.divider} />
      
      {adjustments.map((adjustment, index) => (
        <View key={adjustment.id || `new-${index}`}>
          <List.Item
            title={adjustment.name}
            left={() => (
              <View style={styles.leftContent}>
                <Chip
                  mode="flat"
                  compact
                  style={{
                    backgroundColor: adjustment.amount < 0
                      ? theme.colors.errorContainer
                      : theme.colors.primaryContainer,
                  }}
                  textStyle={{ fontSize: 12 }}
                >
                  {adjustment.isPercentage
                    ? `${adjustment.value}%`
                    : `$${Math.abs(adjustment.amount || 0).toFixed(2)}`}
                </Chip>
              </View>
            )}
            right={() => (
              <View style={styles.rightActions}>
                <Text
                  variant="titleMedium"
                  style={{
                    color: adjustment.amount < 0 
                      ? theme.colors.error 
                      : theme.colors.primary,
                  }}
                >
                  {adjustment.amount < 0 ? '-' : '+'}$
                  {Math.abs(adjustment.amount || 0).toFixed(2)}
                </Text>
                <IconButton
                  icon="pencil"
                  size={20}
                  onPress={() => onEdit(adjustment)}
                />
                <IconButton
                  icon="delete"
                  size={20}
                  iconColor={theme.colors.error}
                  onPress={() => onDelete(adjustment)}
                />
              </View>
            )}
          />
          {index < adjustments.length - 1 && <Divider />}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  title: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  divider: {
    marginBottom: 8,
  },
  leftContent: {
    justifyContent: 'center',
    marginRight: 8,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});