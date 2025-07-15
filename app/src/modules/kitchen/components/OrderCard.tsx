import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Animated,
  Pressable,
  Vibration,
} from 'react-native';
import {
  Card as _Card,
  Text,
  Divider,
  Surface,
  IconButton,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/app/styles/theme';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  KitchenOrder,
  OrderType,
  PreparationStatus as _PreparationStatus,
  PreparationScreenStatus,
} from '../types/kitchen.types';
import { OrderItemRow } from './OrderItemRow';
import { useResponsive } from '@/app/hooks/useResponsive';
import { Swipeable } from 'react-native-gesture-handler';
import { OrderHistoryModal } from './OrderHistoryModal';
import { useMarkItemPrepared } from '../hooks/useKitchenOrders';

interface OrderCardProps {
  order: KitchenOrder;
  onStartPreparation?: (orderId: string) => void;
  onCancelPreparation?: (orderId: string) => void;
  onCompletePreparation?: (orderId: string) => void;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
}

export const OrderCard = React.memo<OrderCardProps>(
  ({
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
        case OrderType.DELIVERY:
          return theme.colors.error;
        case OrderType.TAKE_AWAY:
          return '#00ACC1'; // Cyan/Turquesa
        case OrderType.DINE_IN:
          return theme.colors.primary;
        default:
          return theme.colors.surface;
      }
    };

    const getOrderTypeLabel = () => {
      switch (order.orderType) {
        case OrderType.DELIVERY:
          return 'DOMICILIO';
        case OrderType.TAKE_AWAY:
          return 'PARA LLEVAR';
        case OrderType.DINE_IN:
          return 'MESA';
        default:
          return '';
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
            color: '#4CAF50', // Verde
            textColor: '#FFFFFF',
            borderColor: null,
          };

        case PreparationScreenStatus.IN_PREPARATION:
          return {
            label: 'En preparación',
            color: '#FF6B35', // Naranja
            textColor: '#FFFFFF',
            borderColor: null,
          };

        case PreparationScreenStatus.PENDING:
        default:
          return {
            label: 'Pendiente',
            color: '#9C27B0', // Púrpura
            textColor: '#FFFFFF',
            borderColor: null,
          };
      }
    };

    const hasOrderDetails = () => {
      switch (order.orderType) {
        case OrderType.DELIVERY:
          return !!order.deliveryAddress;
        case OrderType.TAKE_AWAY:
          return !!order.receiptName;
        case OrderType.DINE_IN:
          return !!(order.areaName || order.tableName);
        default:
          return false;
      }
    };

    const orderStatus = getOrderPreparationStatus();

    // Verificar si mi pantalla está en preparación
    const isOrderInPreparation =
      order.myScreenStatus === PreparationScreenStatus.IN_PREPARATION;

    const handleToggleItemPrepared = (
      itemId: string,
      currentStatus: boolean,
    ) => {
      markItemPrepared.mutate({
        itemId,
        isPrepared: !currentStatus,
      });
    };

    // Verificar si la orden puede hacer swipe
    React.useEffect(() => {
      setIsSwipeable(!!swipeActions.rightAction || !!swipeActions.leftAction);
    }, [swipeActions]);

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
            name={swipeActions.rightAction.icon}
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
            name={swipeActions.leftAction.icon}
            size={24}
            color={swipeActions.leftAction.textColor}
          />
        </View>
      );
    };

    // Determinar qué acciones de swipe están disponibles basado en myScreenStatus
    const getSwipeActions = () => {
      const rightAction = (() => {
        // Solo permitir iniciar preparación si mi pantalla está PENDING
        if (order.myScreenStatus === PreparationScreenStatus.PENDING) {
          return {
            type: 'start',
            color: '#FF6B35', // Naranja
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
            color: '#9C27B0', // Púrpura
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

      // Limpiar cualquier timer o animación previa
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        if ((longPressTimer.current as any).interval) {
          clearInterval((longPressTimer.current as any).interval);
        }
        longPressTimer.current = null;
      }

      // Detener cualquier animación en curso y resetear
      animatedValue.stopAnimation();
      animatedValue.setValue(0);

      // Vibración suave al iniciar
      Vibration.vibrate(10);

      setIsPressing(true);

      // Iniciar animación
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();

      // Timer para completar después de 1 segundo
      longPressTimer.current = setTimeout(() => {
        // Vibración de éxito
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
          useNativeDriver: true,
        }).start();
      }, 1000);
    };

    // Manejar cuando se suelta la presión
    const handlePressOut = () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }

      setIsPressing(false);

      // Detener cualquier animación en curso
      animatedValue.stopAnimation();

      // Resetear el valor animado a 0
      animatedValue.setValue(0);
    };

    // Limpiar timer al desmontar
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

      // Cerrar el swipeable después de ejecutar la acción
      swipeableRef.current?.close();
    };

    // Manejar cuando se completa el swipe hacia la izquierda
    const handleLeftSwipeComplete = () => {
      if (!swipeActions.leftAction) return;

      if (swipeActions.leftAction.type === 'cancel') {
        if (onCancelPreparation) onCancelPreparation(order.id);
      }

      // Cerrar el swipeable después de ejecutar la acción
      swipeableRef.current?.close();
    };

    return (
      <Surface
        style={[styles.card, { backgroundColor: theme.colors.surface }]}
        elevation={1}
      >
        {/* Header */}
        {isSwipeable ? (
          <Swipeable
            ref={swipeableRef}
            renderRightActions={renderRightActions}
            renderLeftActions={renderLeftActions}
            onSwipeableWillOpen={() => onSwipeStart && onSwipeStart()}
            onSwipeableWillClose={() => onSwipeEnd && onSwipeEnd()}
            onSwipeableRightOpen={handleRightSwipeComplete}
            onSwipeableLeftOpen={handleLeftSwipeComplete}
            overshootRight={false}
            overshootLeft={false}
            friction={1.2}
            rightThreshold={50}
            leftThreshold={50}
            activationDistance={15}
          >
            <Pressable
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              delayLongPress={0}
            >
              <View
                style={[
                  styles.header,
                  {
                    backgroundColor: getOrderTypeColor(),
                  },
                ]}
              >
                <View style={styles.headerLeft}>
                  <View style={styles.headerTopRow}>
                    <Text
                      style={[
                        styles.orderNumber,
                        { color: theme.colors.surface },
                      ]}
                    >
                      #{order.shiftOrderNumber}
                    </Text>
                    <View
                      style={[
                        styles.typeChip,
                        { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.typeChipText,
                          { color: theme.colors.surface },
                        ]}
                      >
                        {getOrderTypeLabel()}
                      </Text>
                    </View>
                  </View>
                  {hasOrderDetails() && (
                    <Text
                      style={[
                        styles.headerDetails,
                        { color: theme.colors.surface },
                      ]}
                      numberOfLines={2}
                    >
                      {(() => {
                        switch (order.orderType) {
                          case OrderType.DELIVERY:
                            return `📍 ${order.deliveryAddress}${order.deliveryPhone ? `\n📱 ${order.deliveryPhone}` : ''}`;
                          case OrderType.TAKE_AWAY:
                            return `👤 ${order.receiptName}${order.customerPhone ? `\n📱 ${order.customerPhone}` : ''}`;
                          case OrderType.DINE_IN:
                            return `🪑 ${order.areaName} - ${order.tableName}`;
                          default:
                            return '';
                        }
                      })()}
                    </Text>
                  )}
                </View>
                <View style={styles.headerRight}>
                  <View
                    style={[
                      styles.statusChip,
                      {
                        backgroundColor: orderStatus.color,
                        borderWidth:
                          orderStatus.label === 'En progreso' ? 1 : 0,
                        borderColor: theme.colors.outline,
                      },
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
                  <Text
                    style={[styles.headerTime, { color: theme.colors.surface }]}
                  >
                    {format(new Date(order.createdAt), 'HH:mm', { locale: es })}
                  </Text>
                </View>
              </View>
              {/* Indicador de progreso del long press */}
              {isPressing && (canMarkAsReady() || canReturnToInProgress()) && (
                <>
                  {/* Barra de progreso superior clara y simple */}
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 20,
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      overflow: 'hidden',
                    }}
                  >
                    <Animated.View
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: '100%',
                        backgroundColor: canMarkAsReady()
                          ? '#4CAF50'
                          : '#FF6B35',
                        transform: [
                          {
                            scaleX: animatedValue,
                          },
                        ],
                        transformOrigin: 'left center',
                      }}
                    />
                  </View>
                </>
              )}
            </Pressable>
          </Swipeable>
        ) : (
          <View
            style={[
              styles.header,
              {
                backgroundColor: getOrderTypeColor(),
              },
            ]}
          >
            <View style={styles.headerLeft}>
              <View style={styles.headerTopRow}>
                <Text
                  style={[styles.orderNumber, { color: theme.colors.surface }]}
                >
                  #{order.shiftOrderNumber}
                </Text>
                <View
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: (() => {
                        switch (order.orderType) {
                          case OrderType.DELIVERY:
                            return '#FFEBEE'; // Rojo muy claro
                          case OrderType.TAKE_AWAY:
                            return '#E0F2F1'; // Cyan/Turquesa muy claro
                          case OrderType.DINE_IN:
                            return '#E3F2FD'; // Azul muy claro
                          default:
                            return theme.colors.surfaceVariant;
                        }
                      })(),
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      {
                        color: (() => {
                          switch (order.orderType) {
                            case OrderType.DELIVERY:
                              return '#C62828'; // Rojo oscuro
                            case OrderType.TAKE_AWAY:
                              return '#00838F'; // Cyan/Turquesa oscuro
                            case OrderType.DINE_IN:
                              return '#1565C0'; // Azul oscuro
                            default:
                              return theme.colors.onSurfaceVariant;
                          }
                        })(),
                      },
                    ]}
                  >
                    {getOrderTypeLabel()}
                  </Text>
                </View>
              </View>
              {hasOrderDetails() && (
                <Text
                  style={[
                    styles.headerDetails,
                    { color: theme.colors.surface },
                  ]}
                  numberOfLines={2}
                >
                  {(() => {
                    switch (order.orderType) {
                      case OrderType.DELIVERY:
                        return `📍 ${order.deliveryAddress}${order.deliveryPhone ? `\n📱 ${order.deliveryPhone}` : ''}`;
                      case OrderType.TAKE_AWAY:
                        return `👤 ${order.receiptName}${order.customerPhone ? `\n📱 ${order.customerPhone}` : ''}`;
                      case OrderType.DINE_IN:
                        return `🪑 ${order.areaName} - ${order.tableName}`;
                      default:
                        return '';
                    }
                  })()}
                </Text>
              )}
            </View>
            <View style={styles.headerRight}>
              <View
                style={[
                  styles.statusChip,
                  {
                    backgroundColor: orderStatus.color,
                    borderWidth: orderStatus.borderColor ? 1 : 0,
                    borderColor: orderStatus.borderColor || 'transparent',
                  },
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

        {/* Order Notes - Solo mostrar si hay notas */}
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
            <Divider
              style={{
                backgroundColor: theme.colors.outlineVariant,
                height: 0.5,
              }}
            />
          </>
        )}

        {/* Screen Statuses - Mostrar el estado de otras pantallas */}
        {order.screenStatuses && order.screenStatuses.length > 1 && (
          <>
            <View
              style={[
                styles.screenStatusContainer,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}
            >
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.screenStatusList}>
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
            <Divider
              style={{
                backgroundColor: theme.colors.outlineVariant,
                height: 0.5,
              }}
            />
          </>
        )}

        {/* Items */}
        <View style={styles.itemsWrapper}>
          {order.items && order.items.length > 0 ? (
            <ScrollView
              style={styles.itemsContainer}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              {order.items.map((item, index) => (
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
              <Text
                variant="bodyLarge"
                style={{ color: theme.colors.onSurfaceVariant, opacity: 0.6 }}
              >
                No hay productos para mostrar
              </Text>
            </View>
          )}
        </View>

        {/* Botón de detalles e historial */}
        <IconButton
          icon="file-document-multiple-outline"
          size={20}
          iconColor={theme.colors.onSurfaceVariant}
          style={styles.historyButton}
          onPress={() => setShowHistory(true)}
        />

        {/* Modal de historial */}
        <OrderHistoryModal
          visible={showHistory}
          onDismiss={() => setShowHistory(false)}
          orderId={order.id}
          orderNumber={order.shiftOrderNumber}
          orderData={order}
        />
      </Surface>
    );
  },
);

OrderCard.displayName = 'OrderCard';

// Crear estilos responsive
const createStyles = (responsive: any, theme: any) =>
  StyleSheet.create({
    card: {
      width: '100%',
      height: '100%',
      maxHeight:
        responsive.height -
        responsive.dimensions.headerHeight -
        responsive.spacing.s,
      borderRadius: theme.roundness / 2,
      overflow: 'hidden',
      borderWidth: 0.5,
      borderColor: 'rgba(0,0,0,0.05)',
      display: 'flex',
      flexDirection: 'column',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: responsive.spacing.s,
      paddingVertical: responsive.spacing.s,
      borderTopLeftRadius: theme.roundness,
      borderTopRightRadius: theme.roundness,
      minHeight: responsive.getResponsiveDimension(50, 60),
    },
    headerLeft: {
      flex: 1,
      flexDirection: 'column',
      gap: responsive.spacing.xxxs,
    },
    headerTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: responsive.spacing.xs,
    },
    headerDetails: {
      fontSize: responsive.getResponsiveDimension(12, 14),
      lineHeight: responsive.getResponsiveDimension(16, 18),
      opacity: 0.95,
      marginTop: responsive.spacing.xxxs,
      fontWeight: '500',
    },
    headerRight: {
      alignItems: 'flex-end',
      gap: responsive.spacing.xxs,
    },
    orderNumber: {
      fontWeight: 'bold',
      fontSize: responsive.isTablet
        ? responsive.fontSize.l
        : responsive.fontSize.m,
      lineHeight: responsive.getResponsiveDimension(24, 28),
    },
    typeChip: {
      paddingHorizontal: responsive.spacing.s,
      paddingVertical: responsive.spacing.xxs,
      borderRadius: theme.roundness / 2,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'flex-start',
    },
    typeChipText: {
      fontSize: responsive.getResponsiveDimension(10, 11),
      fontWeight: '700',
      letterSpacing: 0.4,
      textAlign: 'center',
      textAlignVertical: 'center',
    },
    headerTime: {
      fontWeight: '500',
      fontSize: responsive.getResponsiveDimension(12, 14),
    },
    statusChip: {
      paddingHorizontal: responsive.spacing.xs,
      paddingVertical: responsive.spacing.xxxs,
      borderRadius: theme.roundness / 2,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'flex-end',
    },
    statusChipText: {
      fontSize: responsive.getResponsiveDimension(10, 12),
      fontWeight: '600',
      letterSpacing: 0.3,
      textAlign: 'center',
      textAlignVertical: 'center',
    },
    details: {
      paddingHorizontal: responsive.spacing.s,
      paddingVertical: responsive.spacing.xs,
    },
    detailText: {
      marginBottom: 0,
      fontSize: responsive.isTablet
        ? responsive.fontSize.s
        : responsive.fontSize.xs - 1,
      lineHeight: responsive.isTablet ? 16 : 14,
    },
    notesContainer: {
      marginTop: responsive.spacing.xxs,
      padding: responsive.spacing.xxs,
      borderRadius: theme.roundness / 2,
    },
    notes: {
      fontStyle: 'italic',
      fontSize: responsive.isTablet
        ? responsive.fontSize.xs
        : responsive.fontSize.xs - 1,
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
      padding: responsive.spacing.s,
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
      gap: responsive.spacing.xs,
      paddingHorizontal: responsive.spacing.s,
    },
    swipeText: {
      fontWeight: 'bold',
      fontSize: responsive.fontSize.s,
    },
    historyButton: {
      position: 'absolute',
      bottom: responsive.spacing.xxs,
      right: responsive.spacing.xxs,
      backgroundColor: theme.colors.surfaceVariant,
      opacity: 0.8,
    },
    screenStatusContainer: {
      paddingVertical: responsive.spacing.xs,
      paddingHorizontal: responsive.spacing.s,
    },
    screenStatusList: {
      flexDirection: 'row',
      gap: responsive.spacing.xs,
    },
    screenStatusItem: {
      paddingHorizontal: responsive.spacing.s,
      paddingVertical: responsive.spacing.xxs,
      borderRadius: theme.roundness / 2,
    },
    screenStatusText: {
      fontSize: responsive.fontSize.xs,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });
