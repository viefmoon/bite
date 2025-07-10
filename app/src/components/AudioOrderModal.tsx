import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {
  Modal,
  Portal,
  Text,
  Button,
  Card,
  List,
  Divider,
  Surface,
  IconButton,
  Chip,
  TextInput,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/app/styles/theme';
import { useGetFullMenu } from '@/modules/orders/hooks/useMenuQueries';
import type {
  AIOrderItem,
  DeliveryInfoData,
  ScheduledDeliveryData,
} from '@/services/audioOrderService';
import ProductCustomizationModal from '@/modules/orders/components/ProductCustomizationModal';
import type { FullMenuProduct as Product } from '@/modules/orders/types/orders.types';
import type {
  CartItem,
  CartItemModifier,
} from '@/modules/orders/context/CartContext';
import { useSnackbarStore } from '@/app/store/snackbarStore';
import type { SelectedPizzaCustomization } from '@/app/schemas/domain/order.schema';
import { Swipeable } from 'react-native-gesture-handler';

interface AudioOrderModalProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: (
    items: AIOrderItem[],
    deliveryInfo?: DeliveryInfoData,
    scheduledDelivery?: ScheduledDeliveryData,
    orderType?: 'DELIVERY' | 'TAKE_AWAY' | 'DINE_IN',
  ) => void;
  isProcessing: boolean;
  orderData?: {
    orderItems?: AIOrderItem[];
    deliveryInfo?: DeliveryInfoData;
    scheduledDelivery?: ScheduledDeliveryData;
    orderType?: 'DELIVERY' | 'TAKE_AWAY' | 'DINE_IN';
    warnings?: string;
    processingTime?: number;
  };
  error?: string;
}

const { width: screenWidth } = Dimensions.get('window');
const modalWidth = Math.min(screenWidth * 0.9, 400);

export const AudioOrderModal: React.FC<AudioOrderModalProps> = ({
  visible,
  onDismiss,
  onConfirm,
  isProcessing,
  orderData,
  error,
}) => {
  const theme = useAppTheme();
  const { colors, fonts } = theme;
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [editableDeliveryInfo, setEditableDeliveryInfo] =
    useState<DeliveryInfoData>({});
  const [editableItems, setEditableItems] = useState<AIOrderItem[]>([]);
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);

  const { data: menu } = useGetFullMenu();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  // Sincronizar la información cuando cambie orderData
  useEffect(() => {
    if (orderData?.deliveryInfo) {
      setEditableDeliveryInfo(orderData.deliveryInfo);
    }
    if (orderData?.orderItems) {
      setEditableItems(orderData.orderItems);
    }
  }, [orderData?.deliveryInfo, orderData?.orderItems]);

  const toggleItemExpansion = (itemId: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleConfirm = () => {
    if (editableItems && editableItems.length > 0) {
      // Validar información de entrega si hay datos
      if (
        editableDeliveryInfo &&
        Object.keys(editableDeliveryInfo).length > 0
      ) {
        if (
          editableDeliveryInfo.recipientName &&
          !editableDeliveryInfo.recipientName.trim()
        ) {
          showSnackbar({
            message: 'Por favor ingresa el nombre del destinatario',
            type: 'error',
          });
          return;
        }
        if (
          editableDeliveryInfo.recipientPhone &&
          !editableDeliveryInfo.recipientPhone.trim()
        ) {
          showSnackbar({
            message: 'Por favor ingresa el teléfono',
            type: 'error',
          });
          return;
        }
        if (
          editableDeliveryInfo.fullAddress &&
          !editableDeliveryInfo.fullAddress.trim()
        ) {
          showSnackbar({
            message: 'Por favor ingresa la dirección',
            type: 'error',
          });
          return;
        }
      }

      onConfirm(
        editableItems,
        editableDeliveryInfo,
        orderData?.scheduledDelivery,
        orderData?.orderType,
      );
    }
  };

  // Función para actualizar la cantidad de un item
  const updateItemQuantity = useCallback(
    (itemId: string, index: number, newQuantity: number) => {
      if (newQuantity < 1) {
        return; // No permitir cantidad menor a 1 con los botones
      }

      setEditableItems((prev) =>
        prev.map((item, i) => {
          if (i === index) {
            return { ...item, quantity: newQuantity };
          }
          return item;
        }),
      );
    },
    [],
  );

  // Función para eliminar un item
  const removeItem = useCallback(
    (index: number) => {
      setEditableItems((prev) => prev.filter((_, i) => i !== index));
      showSnackbar({
        message: 'Producto eliminado',
        type: 'info',
      });
    },
    [showSnackbar],
  );

  // Función para manejar la edición de un item
  const handleEditItem = useCallback(
    (item: AIOrderItem, index: number) => {
      if (!menu) {
        showSnackbar({
          message: 'El menú no está disponible',
          type: 'error',
        });
        return;
      }

      // Buscar el producto en el menú
      let foundProduct: Product | null = null;
      outer: for (const category of menu) {
        for (const subcategory of category.subcategories || []) {
          for (const product of subcategory.products || []) {
            if (product.id === item.productId) {
              foundProduct = product;
              break outer;
            }
          }
        }
      }

      if (!foundProduct) {
        showSnackbar({
          message: 'Producto no encontrado en el menú',
          type: 'error',
        });
        return;
      }

      // Convertir AIOrderItem a CartItem para el modal
      const cartItem: CartItem = {
        id: `${item.productId}-${index}`,
        productId: item.productId,
        productName: foundProduct.name,
        quantity: item.quantity,
        unitPrice:
          foundProduct.variants?.find((v) => v.id === item.variantId)?.price ||
          foundProduct.price ||
          0,
        totalPrice: 0, // Se calculará en el modal
        modifiers:
          item.modifiers?.map((modName) => {
            // Buscar el modificador en el producto
            for (const modGroup of foundProduct.modifierGroups || []) {
              const modifier = modGroup.productModifiers?.find(
                (m) => m.name === modName,
              );
              if (modifier) {
                return {
                  id: modifier.id,
                  modifierGroupId: modGroup.id,
                  name: modifier.name,
                  price: modifier.price || 0,
                };
              }
            }
            return {
              id: modName,
              modifierGroupId: '',
              name: modName,
              price: 0,
            };
          }) || [],
        variantId: item.variantId,
        variantName: foundProduct.variants?.find((v) => v.id === item.variantId)
          ?.name,
        selectedPizzaCustomizations: item.pizzaCustomizations?.map((pc) => ({
          pizzaCustomizationId: pc.customizationId,
          half: pc.half as any,
          action: pc.action as any,
        })),
      };

      setEditingItem(cartItem);
      setEditingProduct(foundProduct);
      setShowCustomizationModal(true);
    },
    [menu, showSnackbar],
  );

  // Función para manejar la actualización desde el modal
  const handleUpdateEditedItem = useCallback(
    (
      itemId: string,
      quantity: number,
      modifiers: CartItemModifier[],
      preparationNotes?: string,
      variantId?: string,
      variantName?: string,
      unitPrice?: number,
      selectedPizzaCustomizations?: SelectedPizzaCustomization[],
      pizzaExtraCost?: number,
    ) => {
      const index = parseInt(itemId.split('-').pop() || '0');

      setEditableItems((prev) =>
        prev.map((item, i) => {
          if (i === index) {
            return {
              ...item,
              quantity,
              variantId,
              modifiers: modifiers.map((m) => m.name),
              pizzaCustomizations: selectedPizzaCustomizations?.map((pc) => ({
                customizationId: pc.pizzaCustomizationId,
                half: pc.half,
                action: pc.action,
              })),
            };
          }
          return item;
        }),
      );

      setShowCustomizationModal(false);
      setEditingItem(null);
      setEditingProduct(null);

      showSnackbar({
        message: 'Producto actualizado',
        type: 'success',
      });
    },
    [showSnackbar],
  );

  // Función para obtener el nombre del producto desde el menú
  const getProductDetails = (productId: string, variantId?: string) => {
    if (!menu)
      return {
        productName: `Producto ${productId.slice(-4)}`,
        variantName: undefined,
      };

    for (const category of menu) {
      for (const subcategory of category.subcategories || []) {
        for (const product of subcategory.products || []) {
          if (product.id === productId) {
            const variant = variantId
              ? product.variants?.find((v) => v.id === variantId)
              : undefined;
            return {
              productName: product.name,
              variantName: variant?.name,
            };
          }
        }
      }
    }
    return {
      productName: `Producto ${productId.slice(-4)}`,
      variantName: undefined,
    };
  };

  // Función para formatear personalizaciones de pizza
  const formatPizzaCustomizations = (customizations?: any[]) => {
    if (!customizations || customizations.length === 0) return '';

    const groupedByHalf = customizations.reduce(
      (acc, curr) => {
        const half = curr.half || 'FULL';
        if (!acc[half]) {
          acc[half] = { ingredients: [] };
        }

        let name = curr.customizationName;
        if (!name && menu) {
          // Buscar el nombre en el menú
          outer: for (const category of menu) {
            for (const subcategory of category.subcategories || []) {
              for (const product of subcategory.products || []) {
                if (product.pizzaCustomizations) {
                  const customization = product.pizzaCustomizations.find(
                    (pc) => pc.id === curr.customizationId,
                  );
                  if (customization) {
                    name = customization.name;
                    break outer;
                  }
                }
              }
            }
          }
        }

        if (!name) {
          name = curr.customizationId.slice(-4);
        }

        const prefix = curr.action === 'ADD' ? '+ ' : '- ';
        acc[half].ingredients.push(prefix + name);

        return acc;
      },
      {} as Record<string, { ingredients: string[] }>,
    );

    if (groupedByHalf.FULL) {
      return groupedByHalf.FULL.ingredients.join(', ');
    } else if (groupedByHalf.HALF_1 || groupedByHalf.HALF_2) {
      const half1 = groupedByHalf.HALF_1
        ? `Mitad 1: ${groupedByHalf.HALF_1.ingredients.join(', ')}`
        : '';
      const half2 = groupedByHalf.HALF_2
        ? `Mitad 2: ${groupedByHalf.HALF_2.ingredients.join(', ')}`
        : '';
      return [half1, half2].filter(Boolean).join(' / ');
    }

    return '';
  };

  const renderProcessingState = () => (
    <View style={styles.processingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.processingText}>Procesando tu orden por voz...</Text>
      <Text style={styles.processingSubtext}>
        Esto puede tomar unos segundos
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <MaterialIcons name="error-outline" size={64} color={colors.error} />
      <Text style={[styles.errorText, { color: colors.error }]}>
        Error al procesar la orden
      </Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <Button mode="contained" onPress={onDismiss} style={styles.errorButton}>
        Intentar de nuevo
      </Button>
    </View>
  );

  const renderOrderSummary = () => {
    if (!orderData) return null;

    const {
      orderItems = [],
      deliveryInfo,
      scheduledDelivery,
      orderType,
      warnings,
    } = orderData;

    return (
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header con tiempo de procesamiento - REMOVIDO */}

        {/* Advertencias */}
        {warnings && (
          <Surface
            style={[
              styles.warningContainer,
              { backgroundColor: colors.tertiaryContainer },
            ]}
          >
            <MaterialIcons name="warning" size={20} color={colors.tertiary} />
            <Text
              style={[
                styles.warningText,
                { color: colors.onTertiaryContainer },
              ]}
            >
              {warnings}
            </Text>
          </Surface>
        )}

        {/* Items de la orden */}
        <Card style={styles.sectionCard}>
          <Card.Title
            title="Productos"
            left={(props) => (
              <MaterialIcons {...props} name="restaurant-menu" size={24} />
            )}
            right={undefined}
          />
          <Card.Content>
            {editableItems.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons
                  name="mic-off"
                  size={48}
                  color={colors.onSurfaceVariant}
                />
                <Text
                  style={[styles.emptyText, { color: colors.onSurfaceVariant }]}
                >
                  No se detectaron productos
                </Text>
                <Text
                  style={[
                    styles.emptySubtext,
                    { color: colors.onSurfaceVariant },
                  ]}
                >
                  Intenta dictar tu orden nuevamente
                </Text>
              </View>
            ) : (
              <List.Section>
                {editableItems.map((item, index) => {
                  const itemKey = `${item.productId}-${index}`;
                  const isExpanded = expandedItems.has(itemKey);
                  const { productName, variantName } = getProductDetails(
                    item.productId,
                    item.variantId,
                  );
                  const pizzaCustomizationsText = formatPizzaCustomizations(
                    item.pizzaCustomizations,
                  );

                  // Función para renderizar acciones de deslizar
                  const renderRightActions = (progress: any, dragX: any) => {
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
                              backgroundColor: colors.error,
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
                          <Text style={styles.deleteActionText}>ELIMINAR</Text>
                        </Animated.View>
                      </Animated.View>
                    );
                  };

                  return (
                    <View key={itemKey}>
                      <Swipeable
                        renderRightActions={renderRightActions}
                        overshootRight={false}
                        friction={2}
                        rightThreshold={90}
                        leftThreshold={100}
                        onSwipeableOpen={(direction) => {
                          if (direction === 'right') {
                            setTimeout(() => {
                              removeItem(index);
                            }, 150);
                          }
                        }}
                      >
                        <TouchableOpacity
                          onPress={() => handleEditItem(item, index)}
                          activeOpacity={0.7}
                        >
                          <List.Item
                            title={() => (
                              <View style={styles.itemTextContainer}>
                                <View>
                                  <Text style={styles.itemTitleText}>
                                    {`${item.quantity}x ${variantName || productName}`}
                                  </Text>
                                </View>
                                <View>
                                  {/* Renderizar personalizaciones de pizza */}
                                  {pizzaCustomizationsText && (
                                    <Text style={styles.itemDescription}>
                                      {pizzaCustomizationsText}
                                    </Text>
                                  )}

                                  {/* Renderizar modificadores */}
                                  {item.modifiers &&
                                    item.modifiers.length > 0 &&
                                    item.modifiers.map((mod, idx) => (
                                      <Text
                                        key={idx}
                                        style={styles.itemDescription}
                                      >
                                        • {mod}
                                      </Text>
                                    ))}
                                </View>
                              </View>
                            )}
                            right={() => (
                              <View style={styles.itemActionsContainer}>
                                <View style={styles.quantityActions}>
                                  <IconButton
                                    icon="minus-circle-outline"
                                    size={20}
                                    onPress={() =>
                                      updateItemQuantity(
                                        item.productId,
                                        index,
                                        item.quantity - 1,
                                      )
                                    }
                                    style={styles.quantityButton}
                                    disabled={item.quantity <= 1}
                                  />
                                  <View style={styles.quantityTextContainer}>
                                    <Text style={styles.quantityText}>
                                      {item.quantity}
                                    </Text>
                                  </View>
                                  <IconButton
                                    icon="plus-circle-outline"
                                    size={20}
                                    onPress={() =>
                                      updateItemQuantity(
                                        item.productId,
                                        index,
                                        item.quantity + 1,
                                      )
                                    }
                                    style={styles.quantityButton}
                                  />
                                </View>
                                <IconButton
                                  icon="pencil"
                                  size={18}
                                  onPress={() => handleEditItem(item, index)}
                                  style={styles.editButton}
                                />
                              </View>
                            )}
                            style={styles.listItem}
                          />
                        </TouchableOpacity>
                      </Swipeable>

                      {index < editableItems.length - 1 && (
                        <Divider style={styles.itemDivider} />
                      )}
                    </View>
                  );
                })}
              </List.Section>
            )}
          </Card.Content>
        </Card>

        {/* Información de entrega */}
        {deliveryInfo && Object.keys(deliveryInfo).length > 0 && (
          <Card style={styles.sectionCard}>
            <Card.Title
              title="Información de Entrega"
              left={(props) => (
                <MaterialIcons {...props} name="local-shipping" size={24} />
              )}
            />
            <Card.Content>
              <View style={styles.deliveryInfoContainer}>
                <TextInput
                  label="Nombre del destinatario"
                  value={editableDeliveryInfo.recipientName || ''}
                  onChangeText={(text) =>
                    setEditableDeliveryInfo((prev) => ({
                      ...prev,
                      recipientName: text,
                    }))
                  }
                  mode="outlined"
                  left={<TextInput.Icon icon="account" />}
                  style={styles.textInput}
                  dense
                />

                <TextInput
                  label="Teléfono"
                  value={editableDeliveryInfo.recipientPhone || ''}
                  onChangeText={(text) =>
                    setEditableDeliveryInfo((prev) => ({
                      ...prev,
                      recipientPhone: text,
                    }))
                  }
                  mode="outlined"
                  left={<TextInput.Icon icon="phone" />}
                  style={styles.textInput}
                  keyboardType="phone-pad"
                  dense
                />

                <TextInput
                  label="Dirección"
                  value={editableDeliveryInfo.fullAddress || ''}
                  onChangeText={(text) =>
                    setEditableDeliveryInfo((prev) => ({
                      ...prev,
                      fullAddress: text,
                    }))
                  }
                  mode="outlined"
                  left={<TextInput.Icon icon="map-marker" />}
                  style={styles.textInput}
                  multiline
                  numberOfLines={2}
                  dense
                />
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Hora programada */}
        {scheduledDelivery?.time && (
          <Card style={styles.sectionCard}>
            <Card.Title
              title="Entrega Programada"
              left={(props) => (
                <MaterialIcons {...props} name="schedule" size={24} />
              )}
            />
            <Card.Content>
              <Text style={styles.scheduledTime}>{scheduledDelivery.time}</Text>
            </Card.Content>
          </Card>
        )}

        {/* Tipo de orden */}
        {orderType && (
          <Card style={styles.sectionCard}>
            <Card.Title
              title="Tipo de Orden"
              left={(props) => (
                <MaterialIcons {...props} name="restaurant" size={24} />
              )}
            />
            <Card.Content>
              <View style={styles.orderTypeContainer}>
                <Chip
                  icon={
                    orderType === 'DELIVERY'
                      ? 'moped'
                      : orderType === 'TAKE_AWAY'
                        ? 'shopping-bag'
                        : 'restaurant'
                  }
                  style={[
                    styles.orderTypeChip,
                    { backgroundColor: colors.primaryContainer },
                  ]}
                  textStyle={{ color: colors.onPrimaryContainer }}
                >
                  {orderType === 'DELIVERY'
                    ? 'Entrega a domicilio'
                    : orderType === 'TAKE_AWAY'
                      ? 'Para llevar'
                      : 'Para comer aquí'}
                </Chip>
              </View>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    );
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modalContainer,
          { width: modalWidth, backgroundColor: colors.surface },
        ]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.onSurface }]}>
            Agregar a tu orden 🛒
          </Text>
          <IconButton
            icon="close"
            size={24}
            onPress={onDismiss}
            style={styles.closeButton}
          />
        </View>

        <Divider style={{ backgroundColor: colors.outlineVariant }} />

        {isProcessing && renderProcessingState()}
        {error && renderErrorState()}
        {!isProcessing && !error && orderData && renderOrderSummary()}

        {!isProcessing && !error && orderData && (
          <>
            <Divider style={{ backgroundColor: colors.outlineVariant }} />
            <View style={styles.footer}>
              {editableItems && editableItems.length > 0 ? (
                <>
                  <Button
                    mode="outlined"
                    onPress={onDismiss}
                    style={styles.footerButton}
                  >
                    Cancelar
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleConfirm}
                    style={styles.footerButton}
                    icon="plus"
                  >
                    Agregar
                  </Button>
                </>
              ) : (
                <Button
                  mode="contained"
                  onPress={onDismiss}
                  style={[styles.footerButton, { flex: 1 }]}
                >
                  Cerrar
                </Button>
              )}
            </View>
          </>
        )}
      </Modal>

      {/* Modal de personalización de producto */}
      {showCustomizationModal && editingProduct && editingItem && (
        <ProductCustomizationModal
          visible={showCustomizationModal}
          product={editingProduct}
          editingItem={editingItem}
          onDismiss={() => {
            setShowCustomizationModal(false);
            setEditingItem(null);
            setEditingProduct(null);
          }}
          onAddToCart={() => {}}
          onUpdateItem={handleUpdateEditedItem}
        />
      )}
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    borderRadius: 16,
    maxHeight: '80%',
    alignSelf: 'center',
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    margin: 0,
  },
  scrollView: {
    maxHeight: 400,
  },
  processingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  processingText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  processingSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  errorMessage: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  errorButton: {
    marginTop: 20,
  },
  // Estilos de processingTime removidos
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
  },
  sectionCard: {
    margin: 16,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 16,
  },
  itemRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expandedContent: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  modifiersContainer: {
    marginTop: 8,
  },
  modifierText: {
    fontSize: 14,
    marginLeft: 8,
    marginVertical: 2,
  },
  pizzaContainer: {
    marginTop: 8,
  },
  customizationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  customizationChip: {
    height: 24,
  },
  halfText: {
    fontSize: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 6,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
  },
  scheduledTime: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  footerButton: {
    flex: 1,
  },
  itemTextContainer: {
    flex: 1,
    paddingRight: 8,
  },
  itemTitleText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  listItem: {
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  itemDivider: {
    marginVertical: 8,
  },
  itemActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityBadge: {
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: 'center',
  },
  quantityBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  expandButton: {
    margin: 0,
  },
  deliveryInfoContainer: {
    gap: 12,
  },
  textInput: {
    backgroundColor: 'transparent',
  },
  quantityActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quantityButton: {
    margin: 0,
  },
  quantityTextContainer: {
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  editButton: {
    margin: 0,
    marginLeft: 8,
  },
  deleteActionContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  deleteAction: {
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    margin: 0,
  },
  deleteActionText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 16,
  },
  emptyAddButton: {
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  orderTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  orderTypeChip: {
    paddingHorizontal: 16,
  },
});
