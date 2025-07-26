import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Animated,
  Pressable,
  Vibration,
} from 'react-native';
import { Text, Divider, Surface, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAppTheme } from '@/app/styles/theme';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  KitchenOrder,
  OrderTypeEnum,
  PreparationStatus,
  PreparationScreenStatus,
} from '../schema/kitchen.schema';
import { OrderItemRow } from './OrderItemRow';
import { useResponsive } from '@/app/hooks/useResponsive';
import { Swipeable } from 'react-native-gesture-handler';
import { OrderHistoryModal } from '@/modules/shared/components/OrderHistoryModal';
import { useMarkItemPrepared } from '../hooks/useKitchenOrders';

interface OrderCardProps {
  order: KitchenOrder;
  onStartPreparation?: (orderId: string) => void;
  onCancelPreparation?: (orderId: string) => void;
  onCompletePreparation?: (orderId: string) => void;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onStartPreparation,
  onCancelPreparation,
  onCompletePreparation,
  onSwipeStart,
  onSwipeEnd,
}) => {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const styles = createStyles(responsive, theme);
  const [isSwipeable, setIsSwipeable] = React.useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const swipeableRef = useRef<Swipeable>(null);
  const [isPressing, setIsPressing] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const markItemPrepared = useMarkItemPrepared();

  const getOrderTypeColor = () => {
    switch (order.orderType) {
      case OrderTypeEnum.DELIVERY:
        return theme.colors.error;
      case OrderTypeEnum.TAKE_AWAY:
        return '#00ACC1'; // Cyan/Turquesa
      case OrderTypeEnum.DINE_IN:
        return theme.colors.primary;
      default:
        return theme.colors.surface;
    }
  };

  const getOrderTypeLabel = () => {
    switch (order.orderType) {
      case OrderTypeEnum.DELIVERY:
        return 'DOMICILIO';
      case OrderTypeEnum.TAKE_AWAY:
        return 'PARA LLEVAR';
      case OrderTypeEnum.DINE_IN:
        return 'MESA';
      default:
        return '';
    }
  };

  const getOrderTypeBackgroundColor = () => {
    switch (order.orderType) {
      case OrderTypeEnum.DELIVERY:
        return '#FFEBEE'; // Rojo muy claro
      case OrderTypeEnum.TAKE_AWAY:
        return '#E0F2F1'; // Cyan/Turquesa muy claro
      case OrderTypeEnum.DINE_IN:
        return '#E3F2FD'; // Azul muy claro
      default:
        return theme.colors.surfaceVariant;
    }
  };

  const getOrderTypeTextColor = () => {
    switch (order.orderType) {
      case OrderTypeEnum.DELIVERY:
        return '#C62828';
      case OrderTypeEnum.TAKE_AWAY:
        return '#00838F';
      case OrderTypeEnum.DINE_IN:
        return '#1565C0';
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const getOrderTypeIcon = () => {
    switch (order.orderType) {
      case OrderTypeEnum.DELIVERY:
        return 'moped';
      case OrderTypeEnum.TAKE_AWAY:
        return 'shopping-outline';
      case OrderTypeEnum.DINE_IN:
        return 'silverware-fork-knife';
      default:
        return 'help-circle-outline';
    }
  };

  // Calcular el estado de preparación basado en myScreenStatus
  const getOrderPreparationStatus = () => {
    // Primero verificar si hay items
    if (!order.items || order.items.length === 0) {
      return {
        label: 'Sin items',
        color: '#E0E0E0',
        textColor: '#424242',
        borderColor: '#BDBDBD',
      };
    }

    const myItems = order.items.filter((item) => item.belongsToMyScreen);
    if (myItems.length === 0) {
      return {
        label: 'Sin items asignados',
        color: '#E0E0E0',
        textColor: '#424242',
        borderColor: '#BDBDBD',
      };
    }

    // Usar el estado de mi pantalla específica
    switch (order.myScreenStatus) {
      case PreparationScreenStatus.READY:
        return {
          label: 'Lista',
          color: '#4CAF50',
          textColor: '#FFFFFF',
          borderColor: null,
        };

      case PreparationScreenStatus.IN_PREPARATION:
        return {
          label: 'En preparación',
          color: '#FF6B35',
          textColor: '#FFFFFF',
          borderColor: null,
        };

      case PreparationScreenStatus.PENDING:
      default:
        return {
          label: 'Pendiente',
          color: '#9C27B0',
          textColor: '#FFFFFF',
          borderColor: null,
        };
    }
  };

  const hasOrderDetails = () => {
    switch (order.orderType) {
      case OrderTypeEnum.DELIVERY:
        return !!order.deliveryAddress;
      case OrderTypeEnum.TAKE_AWAY:
        return !!order.receiptName;
      case OrderTypeEnum.DINE_IN:
        return !!(order.areaName || order.tableName);
      default:
        return false;
    }
  };

  const orderStatus = getOrderPreparationStatus();

  // Verificar si mi pantalla está en preparación
  const isOrderInPreparation =
    order.myScreenStatus === PreparationScreenStatus.IN_PREPARATION;

  const handleToggleItemPrepared = (itemId: string, currentStatus: boolean) => {
    markItemPrepared.mutate({
      itemId,
      isPrepared: !currentStatus,
    });
  };

  // Determinar qué acciones de swipe están disponibles basado en myScreenStatus
  const getSwipeActions = () => {
    const rightAction = (() => {
      // Solo permitir iniciar preparación si mi pantalla está PENDING
      if (order.myScreenStatus === PreparationScreenStatus.PENDING) {
        return {
          type: 'start',
          color: '#FF6B35',
          textColor: '#FFFFFF',
          icon: 'chef-hat',
          text: 'En Preparación',
        };
      }
      return null;
    })();

    const leftAction = (() => {
      // Permitir regresar si mi pantalla está en preparación o lista
      if (
        order.myScreenStatus === PreparationScreenStatus.IN_PREPARATION ||
        order.myScreenStatus === PreparationScreenStatus.READY
      ) {
        return {
          type: 'cancel',
          color: '#9C27B0',
          textColor: '#FFFFFF',
          icon: 'arrow-left',
          text: 'Regresar',
        };
      }
      return null;
    })();

    return { rightAction, leftAction };
  };

  const swipeActions = getSwipeActions();

  // Verificar si la orden puede hacer swipe
  React.useEffect(() => {
    setIsSwipeable(!!swipeActions.rightAction || !!swipeActions.leftAction);
  }, [swipeActions.rightAction, swipeActions.leftAction]);

  // Renderizar las acciones del swipe hacia la derecha (lo que aparece detrás)
  const renderRightActions = () => {
    if (!swipeActions.rightAction) return null;

    return (
      <View
        style={[
          styles.swipeAction,
          { backgroundColor: swipeActions.rightAction.color },
        ]}
      >
        <Icon
          name={swipeActions.rightAction.icon as any}
          size={24}
          color={swipeActions.rightAction.textColor}
        />
        <Text
          style={[
            styles.swipeText,
            { color: swipeActions.rightAction.textColor },
          ]}
        >
          {swipeActions.rightAction.text}
        </Text>
      </View>
    );
  };

  // Renderizar las acciones del swipe hacia la izquierda
  const renderLeftActions = () => {
    if (!swipeActions.leftAction) return null;

    return (
      <View
        style={[
          styles.swipeAction,
          { backgroundColor: swipeActions.leftAction.color },
        ]}
      >
        <Text
          style={[
            styles.swipeText,
            { color: swipeActions.leftAction.textColor },
          ]}
        >
          {swipeActions.leftAction.text}
        </Text>
        <Icon
          name={swipeActions.leftAction.icon as any}
          size={24}
          color={swipeActions.leftAction.textColor}
        />
      </View>
    );
  };

  // Verificar si la orden puede ser marcada como lista con long press
  const canMarkAsReady = () => {
    // Solo se puede marcar como lista si mi pantalla está en preparación
    return (
      order.myScreenStatus === PreparationScreenStatus.IN_PREPARATION &&
      onCompletePreparation
    );
  };

  // Verificar si la orden puede regresar a en preparación con long press
  const canReturnToInProgress = () => {
    // Solo permitir long press para regresar si mi pantalla está EN PREPARACIÓN (no READY)
    // Si está READY, debe usar el swipe
    return (
      order.myScreenStatus === PreparationScreenStatus.IN_PREPARATION &&
      onCancelPreparation
    );
  };

  // Manejar el inicio del long press
  const handlePressIn = () => {
    const canComplete = canMarkAsReady();
    const canReturn = canReturnToInProgress();

    if (!canComplete && !canReturn) return;

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      if ((longPressTimer.current as any).interval) {
        clearInterval((longPressTimer.current as any).interval);
      }
      longPressTimer.current = null;
    }

    animatedValue.stopAnimation();
    animatedValue.setValue(0);

    Vibration.vibrate(10);

    setIsPressing(true);
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start();

    longPressTimer.current = setTimeout(() => {
      Vibration.vibrate([0, 50, 100, 50]);

      if (canComplete && onCompletePreparation) {
        onCompletePreparation(order.id);
      } else if (canReturn && onCancelPreparation) {
        onCancelPreparation(order.id);
      }

      setIsPressing(false);
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }, 2000);
  };

  // Manejar cuando se suelta la presión
  const handlePressOut = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    setIsPressing(false);

    animatedValue.stopAnimation();
    animatedValue.setValue(0);
  };

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  // Manejar cuando se completa el swipe hacia la derecha
  const handleRightSwipeComplete = () => {
    if (!swipeActions.rightAction) return;

    switch (swipeActions.rightAction.type) {
      case 'start':
        if (onStartPreparation) onStartPreparation(order.id);
        break;
    }

    swipeableRef.current?.close();
  };

  // Manejar cuando se completa el swipe hacia la izquierda
  const handleLeftSwipeComplete = () => {
    if (!swipeActions.leftAction) return;

    if (swipeActions.leftAction.type === 'cancel') {
      if (onCancelPreparation) onCancelPreparation(order.id);
    }

    swipeableRef.current?.close();
  };

  return (
    <Surface
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
      elevation={1}
    >
      <View style={styles.cardContent}>
        {isSwipeable ? (
          <Swipeable
            ref={swipeableRef}
            renderRightActions={renderRightActions}
            renderLeftActions={renderLeftActions}
            onSwipeableOpen={() => onSwipeStart && onSwipeStart()}
            onSwipeableClose={() => onSwipeEnd && onSwipeEnd()}
            onSwipeableRightOpen={handleRightSwipeComplete}
            onSwipeableLeftOpen={handleLeftSwipeComplete}
            overshootRight={false}
            overshootLeft={false}
            friction={1.2}
            rightThreshold={50}
            leftThreshold={50}
          >
            <Pressable
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              delayLongPress={0}
            >
              <View
                style={[
                  styles.header,
                  styles.headerSwipeable,
                  { backgroundColor: getOrderTypeColor() },
                ]}
              >
                <View style={styles.headerLeft}>
                  <Text style={[styles.orderNumber, styles.headerText]}>
                    #{order.shiftOrderNumber}
                  </Text>
                  {hasOrderDetails() && (
                    <Text
                      style={[styles.headerDetails, styles.headerText]}
                      numberOfLines={2}
                    >
                      {(() => {
                        switch (order.orderType) {
                          case OrderTypeEnum.DELIVERY:
                            return `📍 ${order.deliveryAddress}${order.deliveryPhone ? `\n📱 ${order.deliveryPhone}` : ''}`;
                          case OrderTypeEnum.TAKE_AWAY:
                            return `👤 ${order.receiptName}${order.customerPhone ? `\n📱 ${order.customerPhone}` : ''}`;
                          case OrderTypeEnum.DINE_IN:
                            return `🪑 ${order.areaName} - ${order.tableName}`;
                          default:
                            return '';
                        }
                      })()}
                    </Text>
                  )}

                  {/* Badge de WhatsApp */}
                  {order.isFromWhatsApp && (
                    <View style={styles.whatsappBadgeContainer}>
                      <View style={styles.whatsappBadge}>
                        <Icon
                          name="whatsapp"
                          size={12}
                          color={theme.colors.surface}
                        />
                      </View>
                    </View>
                  )}
                </View>
                <View style={[styles.headerRight, styles.headerRightSwipeable]}>
                  <View style={[styles.typeChip, styles.typeChipSwipeable]}>
                    <Icon
                      name={getOrderTypeIcon()}
                      size={responsive.isWeb ? 18 : 14}
                      color={theme.colors.surface}
                      style={styles.typeChipIcon}
                    />
                    <Text style={[styles.typeChipText, styles.headerText]}>
                      {getOrderTypeLabel()}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusChip,
                      styles.statusChipSwipeable,
                      { backgroundColor: orderStatus.color },
                      orderStatus.label === 'En progreso'
                        ? styles.statusChipWithBorder
                        : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        {
                          color:
                            orderStatus.label === 'En progreso'
                              ? theme.colors.onSurface
                              : theme.colors.surface,
                        },
                      ]}
                    >
                      {orderStatus.label}
                    </Text>
                  </View>
                  <Text style={[styles.headerTime, styles.headerText]}>
                    {format(new Date(order.createdAt), 'HH:mm', { locale: es })}
                  </Text>
                </View>
              </View>
              {isPressing && (canMarkAsReady() || canReturnToInProgress()) && (
                <View style={styles.progressBarContainer}>
                  <Animated.View
                    style={[
                      styles.progressBar,
                      canMarkAsReady()
                        ? styles.progressBarReady
                        : styles.progressBarInProgress,
                      {
                        width: animatedValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  />
                </View>
              )}
            </Pressable>
          </Swipeable>
        ) : (
          <View
            style={[
              styles.header,
              styles.headerSwipeable,
              { backgroundColor: getOrderTypeColor() },
            ]}
          >
            <View style={styles.headerLeft}>
              <Text style={[styles.orderNumber, styles.headerText]}>
                #{order.shiftOrderNumber}
              </Text>
              {hasOrderDetails() && (
                <Text
                  style={[styles.headerDetails, styles.headerText]}
                  numberOfLines={2}
                >
                  {(() => {
                    switch (order.orderType) {
                      case OrderTypeEnum.DELIVERY:
                        return `📍 ${order.deliveryAddress}${order.deliveryPhone ? `\n📱 ${order.deliveryPhone}` : ''}`;
                      case OrderTypeEnum.TAKE_AWAY:
                        return `👤 ${order.receiptName}${order.customerPhone ? `\n📱 ${order.customerPhone}` : ''}`;
                      case OrderTypeEnum.DINE_IN:
                        return `🪑 ${order.areaName} - ${order.tableName}`;
                      default:
                        return '';
                    }
                  })()}
                </Text>
              )}
            </View>
            <View style={[styles.headerRight, styles.headerRightNormal]}>
              <View
                style={[
                  styles.typeChip,
                  styles.typeChipNormal,
                  { backgroundColor: getOrderTypeBackgroundColor() },
                ]}
              >
                <Icon
                  name={getOrderTypeIcon()}
                  size={responsive.isTablet ? 13 : 14}
                  color={getOrderTypeTextColor()}
                  style={styles.typeChipIcon}
                />
                <Text
                  style={[
                    styles.typeChipText,
                    { color: getOrderTypeTextColor() },
                  ]}
                >
                  {getOrderTypeLabel()}
                </Text>
              </View>
              <View
                style={[
                  styles.statusChip,
                  styles.statusChipNormal,
                  { backgroundColor: orderStatus.color },
                  orderStatus.borderColor
                    ? [
                        styles.statusChipWithBorderColor,
                        { borderColor: orderStatus.borderColor },
                      ]
                    : null,
                ]}
              >
                <Text
                  style={[
                    styles.statusChipText,
                    { color: orderStatus.textColor },
                  ]}
                >
                  {orderStatus.label}
                </Text>
              </View>
              <Text
                style={[styles.headerTime, { color: theme.colors.surface }]}
              >
                {format(new Date(order.createdAt), 'HH:mm', { locale: es })}
              </Text>
            </View>
          </View>
        )}

        {order.orderNotes && (
          <>
            <View
              style={[
                styles.details,
                { backgroundColor: theme.colors.errorContainer },
              ]}
            >
              <Text
                variant="bodyMedium"
                style={[styles.notes, { color: theme.colors.onErrorContainer }]}
              >
                📝 {order.orderNotes}
              </Text>
            </View>
            <Divider style={styles.divider} />
          </>
        )}

        {order.screenStatuses && order.screenStatuses.length > 1 && (
          <>
            <View
              style={[
                styles.screenStatusContainer,
                styles.screenStatusContainerWithBackground,
              ]}
            >
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View
                  style={[
                    styles.screenStatusList,
                    styles.screenStatusListWithGap,
                  ]}
                >
                  {order.screenStatuses.map((screenStatus) => (
                    <View
                      key={screenStatus.screenId}
                      style={[
                        styles.screenStatusItem,
                        {
                          backgroundColor: (() => {
                            switch (screenStatus.status) {
                              case PreparationScreenStatus.READY:
                                return '#4CAF50';
                              case PreparationScreenStatus.IN_PREPARATION:
                                return '#FF6B35';
                              default:
                                return '#9C27B0';
                            }
                          })(),
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

        <View style={styles.itemsWrapper}>
          {order.items && order.items.length > 0 ? (
            <ScrollView
              style={styles.itemsContainer}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              {(() => {
                const myScreenItems = order.items
                  .map((item, originalIndex) => ({ item, originalIndex }))
                  .filter(({ item }) => item.belongsToMyScreen);

                const otherScreenItems = order.items
                  .map((item, originalIndex) => ({ item, originalIndex }))
                  .filter(({ item }) => !item.belongsToMyScreen);

                const sortedMyScreenItems = myScreenItems.sort((a, b) => {
                  const aIsPrepared =
                    a.item.preparationStatus === PreparationStatus.READY;
                  const bIsPrepared =
                    b.item.preparationStatus === PreparationStatus.READY;

                  if (aIsPrepared === bIsPrepared) {
                    return a.originalIndex - b.originalIndex;
                  }

                  return a.originalIndex - b.originalIndex;
                });

                const sortedOtherScreenItems = otherScreenItems;

                return [...sortedMyScreenItems, ...sortedOtherScreenItems];
              })().map(({ item }, index) => (
                <OrderItemRow
                  key={`${item.id}-${index}`}
                  item={item}
                  onTogglePrepared={handleToggleItemPrepared}
                  isOrderInPreparation={isOrderInPreparation}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyItemsContainer}>
              <Text variant="bodyLarge" style={styles.emptyItemsText}>
                No hay productos para mostrar
              </Text>
            </View>
          )}
        </View>

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
            onPress={() => setShowHistory(true)}
          />
        </View>
      </View>

      <OrderHistoryModal
        visible={showHistory}
        onDismiss={() => setShowHistory(false)}
        orderId={order.id}
        orderNumber={order.shiftOrderNumber}
      />
    </Surface>
  );
};

const createStyles = (responsive: any, theme: any) =>
  StyleSheet.create({
    card: {
      width: '100%',
      height: '100%',
      maxHeight:
        responsive.height -
        responsive.dimensions.headerHeight -
        responsive.spacingPreset.s,
      borderRadius: theme.roundness / 2,
      borderWidth: 0.5,
      borderColor: 'rgba(0,0,0,0.05)',
    },
    cardContent: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: responsive.isWeb
        ? responsive.spacingPreset.l
        : responsive.spacingPreset.m,
      paddingVertical: responsive.isWeb
        ? responsive.spacingPreset.m
        : responsive.spacingPreset.s,
      borderTopLeftRadius: theme.roundness,
      borderTopRightRadius: theme.roundness,
      minHeight: responsive.isWeb
        ? 80
        : responsive.getResponsiveDimension(50, 60),
    },
    headerLeft: {
      flex: 1,
      flexDirection: 'column',
      gap: responsive.spacingPreset.xxxs,
    },
    headerTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: responsive.spacingPreset.xs,
    },
    headerDetails: {
      fontSize: responsive.isWeb ? 16 : responsive.isTablet ? 12 : 13,
      lineHeight: responsive.isWeb ? 22 : responsive.isTablet ? 16 : 18,
      opacity: 0.95,
      marginTop: responsive.spacingPreset.xxxs,
      fontWeight: '500',
    },
    headerRight: {
      alignItems: 'flex-end',
      gap: responsive.spacingPreset.xs,
      marginLeft: responsive.spacingPreset.xs,
    },
    orderNumber: {
      fontWeight: 'bold',
      fontSize: responsive.isWeb ? 24 : responsive.isTablet ? 18 : 20,
      lineHeight: responsive.isWeb ? 32 : responsive.isTablet ? 24 : 28,
    },
    typeChip: {
      paddingHorizontal: responsive.isWeb
        ? responsive.spacingPreset.m
        : responsive.spacingPreset.s,
      paddingVertical: responsive.isWeb ? 6 : 4,
      minHeight: responsive.isWeb ? 36 : 28,
      borderRadius: theme.roundness / 2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'flex-end',
      marginBottom: responsive.spacingPreset.xxxs,
    },
    typeChipText: {
      fontSize: responsive.isWeb ? 14 : responsive.isTablet ? 11 : 12,
      fontWeight: '700',
      letterSpacing: 0.4,
      textAlign: 'center',
      textAlignVertical: 'center',
      lineHeight: responsive.isTablet ? 16 : 18,
      includeFontPadding: false,
    },
    headerTime: {
      fontWeight: '500',
      fontSize: responsive.isWeb ? 16 : responsive.isTablet ? 12 : 13,
    },
    statusChip: {
      paddingHorizontal: responsive.isWeb
        ? responsive.spacingPreset.m
        : responsive.spacingPreset.xs,
      paddingVertical: responsive.isWeb ? 6 : 4,
      minHeight: responsive.isWeb ? 36 : 28,
      borderRadius: theme.roundness / 2,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'flex-end',
      marginBottom: responsive.spacingPreset.xxxs,
    },
    statusChipText: {
      fontSize: responsive.isWeb ? 15 : responsive.isTablet ? 12 : 13,
      fontWeight: '600',
      letterSpacing: 0.3,
      textAlign: 'center',
      textAlignVertical: 'center',
      lineHeight: responsive.isWeb ? 22 : responsive.isTablet ? 18 : 20,
      includeFontPadding: false,
    },
    details: {
      paddingHorizontal: responsive.isWeb
        ? responsive.spacingPreset.m
        : responsive.spacingPreset.s,
      paddingVertical: responsive.isWeb
        ? responsive.spacingPreset.s
        : responsive.spacingPreset.xs,
    },
    detailText: {
      marginBottom: 0,
      fontSize: responsive.isWeb ? 15 : responsive.isTablet ? 11 : 12,
      lineHeight: responsive.isWeb ? 20 : responsive.isTablet ? 16 : 14,
    },
    notesContainer: {
      marginTop: responsive.spacingPreset.xxs,
      padding: responsive.spacingPreset.xxs,
      borderRadius: theme.roundness / 2,
    },
    notes: {
      fontStyle: 'italic',
      fontSize: responsive.isTablet ? 11 : 12,
      lineHeight: responsive.isTablet ? 16 : 14,
    },
    itemsWrapper: {
      flex: 1,
      minHeight: responsive.isTablet ? 100 : 60,
    },
    itemsContainer: {
      flex: 1,
    },
    emptyItemsContainer: {
      padding: responsive.spacingPreset.s,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: responsive.getResponsiveDimension(60, 80),
    },
    swipeAction: {
      width: 120,
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      gap: responsive.spacingPreset.xs,
      paddingHorizontal: responsive.spacingPreset.s,
    },
    swipeText: {
      fontWeight: 'bold',
      fontSize: responsive.fontSizePreset.s,
    },
    screenStatusContainer: {
      paddingVertical: responsive.spacingPreset.s,
      paddingHorizontal: responsive.spacingPreset.s,
      paddingRight: responsive.spacingPreset.m,
    },
    screenStatusList: {
      flexDirection: 'row',
      gap: responsive.spacingPreset.s,
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
    whatsappBadgeContainer: {
      marginTop: 4,
      alignItems: 'flex-start',
    },
    whatsappBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      backgroundColor: '#25D366',
    },
    headerText: {
      color: theme.colors.surface,
    },
    headerSwipeable: {
      paddingHorizontal: responsive.spacingPreset.s,
    },
    headerRightSwipeable: {
      marginLeft: responsive.spacingPreset.xs,
    },
    headerRightNormal: {
      marginLeft: responsive.spacingPreset.m,
    },
    typeChipSwipeable: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      marginTop: 2,
      marginBottom: 3,
    },
    typeChipNormal: {
      marginTop: 2,
      marginBottom: 3,
    },
    typeChipIcon: {
      marginRight: 4,
    },
    statusChipSwipeable: {
      marginBottom: 2,
    },
    statusChipNormal: {
      marginBottom: 2,
    },
    progressBarContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
    },
    notesContainerAlt: {
      backgroundColor: theme.colors.errorContainer,
    },
    notesText: {
      color: theme.colors.onErrorContainer,
    },
    divider: {
      backgroundColor: theme.colors.outlineVariant,
      height: 0.5,
    },
    screenStatusContainerStyle: {
      backgroundColor: theme.colors.surfaceVariant,
      paddingVertical: responsive.spacingPreset.s,
      paddingHorizontal: responsive.spacingPreset.s,
    },
    emptyItemsText: {
      color: theme.colors.onSurfaceVariant,
      opacity: 0.6,
    },
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
    statusChipWithBorder: {
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    progressBarReady: {
      backgroundColor: theme.colors.success,
    },
    progressBarInProgress: {
      backgroundColor: '#FF6B35',
    },
    screenStatusContainerWithBackground: {
      backgroundColor: theme.colors.surfaceVariant,
      paddingVertical: 8,
      paddingHorizontal: 8,
    },
    screenStatusListWithGap: {
      gap: 8,
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
    statusChipWithBorderColor: {
      borderWidth: 1,
    },
  });
