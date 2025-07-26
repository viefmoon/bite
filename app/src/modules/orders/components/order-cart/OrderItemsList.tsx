import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Text, IconButton, List } from 'react-native-paper';
import { Swipeable } from 'react-native-gesture-handler';
import { useAppTheme } from '@/app/styles/theme';
import type { CartItem } from '../../stores/useOrderStore';
import { PreparationStatusInfo } from '../../utils/formatters';

interface OrderItemsListProps {
  items: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onEditItem?: (item: CartItem) => void;
  isEditMode?: boolean;
  disabled?: boolean;
}

export const OrderItemsList: React.FC<OrderItemsListProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onEditItem,
  isEditMode = false,
  disabled = false,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
    _item: CartItem,
  ) => {
    const translateX = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: 'clamp',
    });

    const scale = dragX.interpolate({
      inputRange: [-100, -50, 0],
      outputRange: [1, 0.8, 0.5],
      extrapolate: 'clamp',
    });

    const opacity = dragX.interpolate({
      inputRange: [-100, -20, 0],
      outputRange: [1, 0.5, 0],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.deleteActionContainer,
          {
            opacity,
            transform: [{ translateX }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.deleteAction,
            {
              backgroundColor: theme.colors.error,
              transform: [{ scale }],
            },
          ]}
        >
          <View style={styles.deleteIconContainer}>
            <IconButton
              icon="delete-sweep"
              size={28}
              iconColor="white"
              style={styles.deleteIcon}
            />
          </View>
          <Text style={styles.swipeActionText}>ELIMINAR</Text>
        </Animated.View>
      </Animated.View>
    );
  };

  const renderItem = (item: CartItem) => {
    const basePrice = item.unitPrice || 0;
    const modifiersPrice = item.modifiers.reduce(
      (sum, mod) => sum + (mod.price || 0),
      0,
    );
    const unitPriceWithModifiers = basePrice + modifiersPrice;
    const itemTotal = item.totalPrice || unitPriceWithModifiers * item.quantity;

    const canDelete =
      !isEditMode ||
      (item.preparationStatus !== 'READY' &&
        item.preparationStatus !== 'DELIVERED');

    const content = (
      <TouchableOpacity
        onPress={() => onEditItem && onEditItem(item)}
        disabled={disabled || !onEditItem}
        activeOpacity={0.7}
      >
        <List.Item
          title={() => (
            <View>
              <View>
                <Text style={styles.itemTitle}>
                  {item.quantity}x {item.variantName || item.productName}
                </Text>
              </View>
            </View>
          )}
          description={() => (
            <View>
              {item.modifiers.length > 0 && (
                <Text style={styles.modifiersText}>
                  {item.modifiers.map((m) => m.name).join(', ')}
                </Text>
              )}
              {item.selectedPizzaCustomizations &&
                item.selectedPizzaCustomizations.length > 0 && (
                  <Text style={styles.customizationText}>
                    {item.selectedPizzaCustomizations.length} personalizaciones
                  </Text>
                )}
              {item.preparationNotes && (
                <Text style={styles.notesText}>
                  Nota: {item.preparationNotes}
                </Text>
              )}
              {isEditMode && item.preparationStatus && (
                <View style={styles.statusContainer}>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          PreparationStatusInfo.getColor(
                            item.preparationStatus,
                            theme,
                          ) + '20',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor: PreparationStatusInfo.getColor(
                            item.preparationStatus,
                            theme,
                          ),
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color: PreparationStatusInfo.getColor(
                            item.preparationStatus,
                            theme,
                          ),
                        },
                      ]}
                    >
                      {PreparationStatusInfo.getLabel(item.preparationStatus)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}
          right={() => (
            <View style={styles.itemActionsContainer}>
              <View style={styles.quantityActions}>
                <IconButton
                  icon="minus-circle-outline"
                  size={24}
                  onPress={() => onUpdateQuantity(item.id, item.quantity - 1)}
                  disabled={
                    disabled ||
                    (isEditMode &&
                      (item.preparationStatus === 'READY' ||
                        item.preparationStatus === 'DELIVERED'))
                  }
                  style={styles.quantityButton}
                />
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <IconButton
                  icon="plus-circle-outline"
                  size={24}
                  onPress={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  disabled={
                    disabled ||
                    (isEditMode &&
                      (item.preparationStatus === 'READY' ||
                        item.preparationStatus === 'DELIVERED'))
                  }
                  style={styles.quantityButton}
                />
              </View>
              <View style={styles.priceContainer}>
                <Text style={styles.itemPrice}>${itemTotal.toFixed(2)}</Text>
                {item.quantity > 1 && (
                  <Text style={styles.unitPriceText}>
                    (${unitPriceWithModifiers.toFixed(2)} c/u)
                  </Text>
                )}
              </View>
            </View>
          )}
          style={styles.listItem}
        />
      </TouchableOpacity>
    );

    if (!canDelete || disabled) {
      return content;
    }

    return (
      <Swipeable
        renderRightActions={(progress, dragX) =>
          renderRightActions(progress, dragX, item)
        }
        overshootRight={false}
        friction={2}
        rightThreshold={90}
        leftThreshold={100}
        onSwipeableOpen={(direction) => {
          if (direction === 'right') {
            setTimeout(() => {
              onRemoveItem(item.id);
            }, 150);
          }
        }}
        enabled={!disabled}
      >
        {content}
      </Swipeable>
    );
  };

  return (
    <View style={styles.container}>
      {items.map((item) => (
        <View key={item.id}>{renderItem(item)}</View>
      ))}
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      marginVertical: theme.spacing.s,
    },
    listItem: {
      backgroundColor: theme.colors.surface,
      marginBottom: theme.spacing.xs,
      paddingVertical: theme.spacing.s,
      paddingHorizontal: theme.spacing.s,
      minHeight: 80,
    },
    modifiersText: {
      fontSize: 12,
      color: theme.colors.primary,
      marginTop: 2,
    },
    customizationText: {
      fontSize: 12,
      color: theme.colors.secondary,
      marginTop: 2,
    },
    notesText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
      marginTop: 2,
    },
    itemActionsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      flexShrink: 0,
    },
    quantityActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    quantityButton: {
      marginHorizontal: -4,
      padding: 0,
    },
    quantityText: {
      fontSize: 14,
      fontWeight: 'bold',
      minWidth: 20,
      textAlign: 'center',
      marginHorizontal: 2,
    },
    itemTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    itemPrice: {
      alignSelf: 'center',
      marginRight: theme.spacing.xs,
      color: theme.colors.onSurfaceVariant,
      fontSize: 15,
      fontWeight: 'bold',
      minWidth: 55,
      textAlign: 'right',
    },
    priceContainer: {
      flexDirection: 'column',
      alignItems: 'flex-end',
      marginRight: theme.spacing.xs,
    },
    unitPriceText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
    },
    deleteActionContainer: {
      width: 120,
      height: '100%',
      justifyContent: 'center',
      alignItems: 'flex-end',
      paddingRight: theme.spacing.m,
    },
    deleteAction: {
      backgroundColor: theme.colors.error,
      justifyContent: 'center',
      alignItems: 'center',
      width: 90,
      height: '90%',
      borderRadius: theme.roundness * 2,
      flexDirection: 'column',
      shadowColor: theme.colors.error,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    deleteIconContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
    },
    deleteIcon: {
      margin: 0,
      padding: 0,
    },
    swipeActionText: {
      color: 'white',
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
      justifyContent: 'flex-start',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.s,
      paddingVertical: 2,
      borderRadius: 12,
      gap: 4,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
  });
