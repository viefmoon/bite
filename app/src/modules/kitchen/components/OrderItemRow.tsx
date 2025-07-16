import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Text, useTheme, Chip } from 'react-native-paper';
import { KitchenOrderItem, PreparationStatus } from '../types/kitchen.types';
import { useResponsive } from '@/app/hooks/useResponsive';

interface OrderItemRowProps {
  item: KitchenOrderItem;
  onPress?: () => void;
  onTogglePrepared?: (itemId: string, currentStatus: boolean) => void;
  isOrderInPreparation?: boolean;
}

export const OrderItemRow = React.memo<OrderItemRowProps>(
  ({ item, onTogglePrepared, isOrderInPreparation }) => {
    const theme = useTheme();
    const responsive = useResponsive();

    const isPrepared = item.preparationStatus === PreparationStatus.READY;
    const isInProgress =
      item.preparationStatus === PreparationStatus.IN_PROGRESS;
    const isDisabled = !item.belongsToMyScreen;
    // Permitir toggle si la orden está en preparación, el item pertenece a esta pantalla y está IN_PROGRESS o READY
    const canToggle =
      isOrderInPreparation &&
      (isInProgress || isPrepared) &&
      item.belongsToMyScreen &&
      onTogglePrepared;

    const buildItemName = () => {
      // Si tiene variante, solo mostrar la variante
      // Si no tiene variante, mostrar el nombre del producto
      const displayName = item.variantName || item.productName;
      return `${item.quantity}x ${displayName}`;
    };

    const buildItemDetails = () => {
      const details: string[] = [];

      // Combinar mods y customizations en una línea si es posible
      const allCustoms: string[] = [];

      if (item.modifiers.length > 0) {
        allCustoms.push(...item.modifiers);
      }

      if (item.pizzaCustomizations && item.pizzaCustomizations.length > 0) {
        const customizations = item.pizzaCustomizations.map((pc) => {
          let text = pc.customizationName;
          if (pc.action) text += ` (${pc.action})`;
          if (pc.half) text += ` - ${pc.half}`;
          return text;
        });
        allCustoms.push(...customizations);
      }

      if (allCustoms.length > 0) {
        details.push(allCustoms.join(', '));
      }

      if (item.preparationNotes) {
        details.push(`📝 ${item.preparationNotes}`);
      }

      return details;
    };

    const styles = StyleSheet.create({
      container: {
        paddingHorizontal: responsive.isWeb ? responsive.spacing.m : responsive.spacing.s,
        paddingVertical: responsive.isWeb ? responsive.spacing.s : responsive.spacing.xs,
        minHeight: responsive.isWeb ? 52 : (responsive.isTablet ? 40 : 36),
        display: 'flex',
        justifyContent: 'center',
      },
      disabled: {
        opacity: 0.5,
      },
      row: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
      },
      content: {
        flex: 1,
      },
      withBorder: {
        borderRadius: theme.roundness / 2,
        borderWidth: 1,
        borderColor: theme.colors.outline,
        borderStyle: 'dashed',
      },
      clickable: {
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
      },
      itemName: {
        fontWeight: '500',
        fontSize: responsive.isWeb ? 16 : (responsive.isTablet ? 13 : 14),
        lineHeight: responsive.isWeb ? 24 : (responsive.isTablet ? 18 : 20),
      },
      detail: {
        color: theme.colors.onSurfaceVariant,
        marginTop: responsive.isWeb ? 2 : -1,
        fontSize: responsive.isWeb ? 14 : (responsive.isTablet ? 11 : 12),
        lineHeight: responsive.isWeb ? 20 : (responsive.isTablet ? 14 : 16),
      },
      strikethrough: {
        textDecorationLine: 'line-through',
        textDecorationStyle: 'solid',
        textDecorationColor: theme.colors.error,
        opacity: 0.7,
      },
      disabledText: {
        color: theme.colors.onSurfaceDisabled || '#999',
      },
    });

    const handlePress = () => {
      if (canToggle) {
        onTogglePrepared(item.id, isPrepared);
      }
    };

    const Container = canToggle ? TouchableOpacity : View;

    return (
      <Container
        onPress={canToggle ? handlePress : undefined}
        activeOpacity={0.7}
        style={[
          styles.container,
          styles.withBorder,
          isDisabled && styles.disabled,
          canToggle && styles.clickable,
        ]}
      >
        <View style={styles.row}>
          <View style={styles.content}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: responsive.spacing.xs,
              }}
            >
              <Text
                variant="bodyMedium"
                style={[
                  styles.itemName,
                  isPrepared && styles.strikethrough,
                  isDisabled && styles.disabledText,
                ]}
              >
                {buildItemName()}
              </Text>
            </View>
            {buildItemDetails().map((detail, index) => (
              <Text
                key={index}
                variant="labelSmall"
                style={[
                  styles.detail,
                  isPrepared && styles.strikethrough,
                  isDisabled && styles.disabledText,
                ]}
              >
                {detail}
              </Text>
            ))}
          </View>
        </View>
      </Container>
    );
  },
);

OrderItemRow.displayName = 'OrderItemRow';
