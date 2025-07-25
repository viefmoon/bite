import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Divider,
  Surface,
  IconButton,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/app/styles/theme';
import { useGetOrderMenu } from '@/modules/orders/hooks/useMenuQueries';
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
import {
  OrderTypeEnum,
  type OrderType,
} from '@/modules/orders/types/orders.types';
import SpeechRecognitionInput from '@/app/components/common/SpeechRecognitionInput';
import { useGetAreas } from '@/modules/areasTables/services/areaService';
import { useGetTablesByArea } from '@/modules/areasTables/services/tableService';
import type { Table } from '@/modules/areasTables/types/areasTables.types';
import AnimatedLabelSelector from '@/app/components/common/AnimatedLabelSelector';
import { Menu, Checkbox, HelperText } from 'react-native-paper';
import type { DeliveryInfo } from '@/app/schemas/domain/delivery-info.schema';
import ConfirmationModal from '@/app/components/common/ConfirmationModal';

interface AudioOrderModalProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: (
    items: AIOrderItem[],
    deliveryInfo?: DeliveryInfoData,
    scheduledDelivery?: ScheduledDeliveryData,
    orderType?: OrderType,
  ) => void;
  isProcessing: boolean;
  orderData?: {
    orderItems?: AIOrderItem[];
    deliveryInfo?: DeliveryInfoData;
    scheduledDelivery?: ScheduledDeliveryData;
    orderType?: OrderType;
    warnings?: string;
    processingTime?: number;
  };
  error?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const modalWidth = Math.min(screenWidth * 0.95, 500);

export const AudioOrderModal: React.FC<AudioOrderModalProps> = ({
  visible,
  onDismiss,
  onConfirm,
  isProcessing,
  orderData,
  error,
}) => {
  const theme = useAppTheme();
  const { colors } = theme;
  const [editableDeliveryInfo, setEditableDeliveryInfo] =
    useState<DeliveryInfo>({});
  const [editableItems, setEditableItems] = useState<AIOrderItem[]>([]);
  const [editableOrderType, setEditableOrderType] = useState<OrderType>(
    OrderTypeEnum.DINE_IN,
  );
  const [editableSelectedAreaId, setEditableSelectedAreaId] = useState<
    string | null
  >(null);
  const [editableSelectedTableId, setEditableSelectedTableId] = useState<
    string | null
  >(null);
  const [editableIsTemporaryTable, setEditableIsTemporaryTable] =
    useState<boolean>(false);
  const [editableTemporaryTableName, setEditableTemporaryTableName] =
    useState<string>('');
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);

  // Estados para validación de productos
  const [itemsWithErrors, setItemsWithErrors] = useState<Set<number>>(
    new Set(),
  );
  const [itemValidationErrors, setItemValidationErrors] = useState<
    Record<number, string[]>
  >({});

  // Estados de error
  const [areaError, setAreaError] = useState<string | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);
  const [recipientNameError, setRecipientNameError] = useState<string | null>(
    null,
  );
  const [recipientPhoneError, setRecipientPhoneError] = useState<string | null>(
    null,
  );
  const [addressError, setAddressError] = useState<string | null>(null);

  // Estado para modal de confirmación de salida
  const [showExitConfirmationModal, setShowExitConfirmationModal] =
    useState(false);

  // Estados de menús
  const [areaMenuVisible, setAreaMenuVisible] = useState(false);
  const [tableMenuVisible, setTableMenuVisible] = useState(false);

  const { data: menu } = useGetOrderMenu();

  // Queries para áreas y mesas
  const {
    data: areasData,
    isLoading: isLoadingAreas,
    error: errorAreas,
  } = useGetAreas();
  const {
    data: tablesData,
    isLoading: isLoadingTables,
    error: errorTables,
  } = useGetTablesByArea(editableSelectedAreaId);
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  // Nombres computed para área y mesa
  const selectedAreaName = useMemo(
    () => areasData?.find((a: any) => a.id === editableSelectedAreaId)?.name,
    [areasData, editableSelectedAreaId],
  );
  const selectedTableName = useMemo(() => {
    return tablesData?.find((t) => t.id === editableSelectedTableId)?.name;
  }, [tablesData, editableSelectedTableId]);

  // Función para validar un producto según las reglas del ProductCustomizationModal
  const validateProductItem = useCallback(
    (item: AIOrderItem, product?: Product) => {
      if (!menu || !product) return [];

      const errors: string[] = [];

      // 1. Validar variante requerida
      if (
        product.hasVariants &&
        product.variants &&
        product.variants.length > 0
      ) {
        if (!item.variantId) {
          errors.push('Variante requerida');
        }
      }

      // 2. Validar modificadores requeridos
      if (product.modifierGroups && product.modifierGroups.length > 0) {
        for (const group of product.modifierGroups) {
          const selectedModifiersInGroup = (item.modifiers || []).filter(
            (modName) => {
              // Buscar si este modificador pertenece a este grupo
              return group.productModifiers?.some((pm) => pm.name === modName);
            },
          );

          const selectedCount = selectedModifiersInGroup.length;
          const minRequired = Math.max(
            group.minSelections || 0,
            group.isRequired ? 1 : 0,
          );

          if (selectedCount < minRequired) {
            if (group.isRequired && minRequired === 1) {
              errors.push(`${group.name}: Requerido`);
            } else {
              errors.push(`${group.name}: Mínimo ${minRequired}`);
            }
          }

          // Validar máximo
          if (group.maxSelections && selectedCount > group.maxSelections) {
            errors.push(`${group.name}: Máximo ${group.maxSelections}`);
          }
        }
      }

      // 3. Validar personalizaciones de pizza
      if (
        product.category?.name?.toLowerCase().includes('pizza') &&
        item.pizzaCustomizations
      ) {
        // Las pizzas necesitan al menos una personalización válida
        const validCustomizations = item.pizzaCustomizations.filter(
          (custom) => custom.customizationId && custom.action,
        );

        if (validCustomizations.length === 0) {
          errors.push('Pizza requiere personalizaciones');
        }
      }

      return errors;
    },
    [menu],
  );

  // Función para encontrar el producto completo en el menú
  const findProductInMenu = useCallback(
    (productId: string): Product | undefined => {
      if (!menu) return undefined;

      for (const category of menu) {
        for (const subcategory of category.subcategories || []) {
          for (const product of subcategory.products || []) {
            if (product.id === productId) {
              return product;
            }
          }
        }
      }
      return undefined;
    },
    [menu],
  );

  // Validar todos los productos cuando cambien
  useEffect(() => {
    if (!editableItems || editableItems.length === 0) {
      setItemsWithErrors(new Set());
      setItemValidationErrors({});
      return;
    }

    const newItemsWithErrors = new Set<number>();
    const newValidationErrors: Record<number, string[]> = {};

    editableItems.forEach((item, index) => {
      const product = findProductInMenu(item.productId);
      const errors = validateProductItem(item, product);

      if (errors.length > 0) {
        newItemsWithErrors.add(index);
        newValidationErrors[index] = errors;
      }
    });

    setItemsWithErrors(newItemsWithErrors);
    setItemValidationErrors(newValidationErrors);
  }, [editableItems, findProductInMenu, validateProductItem]);

  // Función para abrir modal de personalización para un producto específico
  // Se definirá después de handleEditItem para evitar problemas de dependencias

  // Verificar si hay productos con errores que bloqueen el guardado
  const hasValidationErrors = useMemo(() => {
    return itemsWithErrors.size > 0;
  }, [itemsWithErrors]);

  // Verificar si hay datos modificados que se perderían al salir
  const hasUnsavedChanges = useMemo(() => {
    // Si hay productos procesados o datos editados, hay cambios sin guardar
    return (
      editableItems.length > 0 ||
      editableDeliveryInfo.recipientName?.trim() ||
      editableDeliveryInfo.recipientPhone?.trim() ||
      editableDeliveryInfo.fullAddress?.trim() ||
      editableSelectedAreaId ||
      editableSelectedTableId ||
      editableTemporaryTableName?.trim()
    );
  }, [
    editableItems.length,
    editableDeliveryInfo.recipientName,
    editableDeliveryInfo.recipientPhone,
    editableDeliveryInfo.fullAddress,
    editableSelectedAreaId,
    editableSelectedTableId,
    editableTemporaryTableName,
  ]);

  // Sincronizar la información cuando cambie orderData
  useEffect(() => {
    if (orderData?.deliveryInfo) {
      setEditableDeliveryInfo(orderData.deliveryInfo as DeliveryInfo);
    }
    if (orderData?.orderItems) {
      setEditableItems(orderData.orderItems);
    }
    // Si orderType viene del backend, usarlo; si es undefined, usar DELIVERY como defecto
    if (orderData?.orderType !== undefined) {
      setEditableOrderType(orderData.orderType);
    } else if (orderData) {
      // Solo cambiar a DELIVERY si hay datos de la orden pero orderType es undefined
      setEditableOrderType(OrderTypeEnum.DELIVERY);
    }
  }, [orderData?.deliveryInfo, orderData?.orderItems, orderData?.orderType]);

  // Limpiar errores cuando cambie el tipo de orden
  useEffect(() => {
    setAreaError(null);
    setTableError(null);
    setRecipientNameError(null);
    setRecipientPhoneError(null);
    setAddressError(null);
  }, [editableOrderType]);

  const handleConfirm = () => {
    // Resetear errores
    setAreaError(null);
    setTableError(null);
    setRecipientNameError(null);
    setRecipientPhoneError(null);
    setAddressError(null);

    if (editableItems && editableItems.length > 0) {
      // Solo verificar errores de validación de productos
      if (hasValidationErrors) {
        showSnackbar({
          message:
            'Hay productos con errores que deben corregirse antes de continuar',
          type: 'error',
        });
        return;
      }

      // Crear deliveryInfo adaptada
      const adaptedDeliveryInfo: DeliveryInfoData = {
        recipientName: editableDeliveryInfo.recipientName,
        recipientPhone: editableDeliveryInfo.recipientPhone,
        fullAddress: editableDeliveryInfo.fullAddress,
      };

      onConfirm(
        editableItems,
        adaptedDeliveryInfo,
        orderData?.scheduledDelivery,
        editableOrderType,
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

  // Funciones para manejo de confirmación de salida
  const handleAttemptExit = useCallback(() => {
    if (!hasUnsavedChanges) {
      onDismiss();
    } else {
      setShowExitConfirmationModal(true);
    }
  }, [hasUnsavedChanges, onDismiss]);

  const handleConfirmExit = useCallback(() => {
    setShowExitConfirmationModal(false);
    onDismiss();
  }, [onDismiss]);

  const handleCancelExit = useCallback(() => {
    setShowExitConfirmationModal(false);
  }, []);

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
      <View style={styles.processingContent}>
        <MaterialIcons
          name="mic"
          size={80}
          color={colors.primary}
          style={styles.processingIcon}
        />
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.processingSpinner}
        />
        <Text style={[styles.processingTitle, { color: colors.onSurface }]}>
          Analizando tu solicitud
        </Text>
        <Text
          style={[styles.processingSubtext, { color: colors.onSurfaceVariant }]}
        >
          Extrayendo productos y detalles de tu pedido por voz...
        </Text>
        <View style={styles.processingSteps}>
          <View style={styles.processingStep}>
            <MaterialIcons name="hearing" size={24} color={colors.primary} />
            <Text style={[styles.stepText, { color: colors.onSurfaceVariant }]}>
              Transcribiendo audio
            </Text>
          </View>
          <View style={styles.processingStep}>
            <MaterialIcons name="psychology" size={24} color={colors.primary} />
            <Text style={[styles.stepText, { color: colors.onSurfaceVariant }]}>
              Analizando productos
            </Text>
          </View>
          <View style={styles.processingStep}>
            <MaterialIcons name="list-alt" size={24} color={colors.primary} />
            <Text style={[styles.stepText, { color: colors.onSurfaceVariant }]}>
              Generando orden
            </Text>
          </View>
        </View>
        <Text
          style={[styles.processingFooter, { color: colors.onSurfaceVariant }]}
        >
          ⏱️ Esto puede tomar unos segundos
        </Text>
      </View>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <View style={styles.errorContent}>
        <MaterialIcons name="error-outline" size={80} color={colors.error} />
        <Text style={[styles.errorTitle, { color: colors.error }]}>
          No se pudo procesar tu solicitud
        </Text>
        <Text style={[styles.errorMessage, { color: colors.onSurfaceVariant }]}>
          {error}
        </Text>
        <View style={styles.errorActions}>
          <Button
            mode="outlined"
            onPress={onDismiss}
            style={styles.errorButton}
            icon="refresh"
          >
            Intentar de nuevo
          </Button>
          <Button
            mode="contained"
            onPress={handleAttemptExit}
            style={styles.errorButton}
            icon="close"
          >
            Cerrar
          </Button>
        </View>
        <Text style={[styles.errorFooter, { color: colors.onSurfaceVariant }]}>
          💡 Asegúrate de hablar claramente y mencionar los productos que deseas
        </Text>
      </View>
    </View>
  );

  const renderOrderSummary = () => {
    if (!orderData) return null;

    const { scheduledDelivery, warnings } = orderData;

    return (
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header con tiempo de procesamiento - REMOVIDO */}

        {/* Tipo de Orden - Always visible at top */}
        <View style={styles.orderTypeSection}>
          <View style={styles.compactSectionHeader}>
            <MaterialIcons name="restaurant" size={20} color={colors.primary} />
            <Text
              style={[styles.compactSectionTitle, { color: colors.onSurface }]}
            >
              Tipo de Orden
            </Text>
          </View>

          <View style={styles.orderTypeButtons}>
            <TouchableOpacity
              style={[
                styles.orderTypeButton,
                editableOrderType === OrderTypeEnum.DINE_IN &&
                  styles.orderTypeButtonActive,
                {
                  backgroundColor:
                    editableOrderType === OrderTypeEnum.DINE_IN
                      ? colors.primaryContainer
                      : colors.surface,
                },
              ]}
              onPress={() => setEditableOrderType(OrderTypeEnum.DINE_IN)}
            >
              <MaterialIcons
                name="restaurant"
                size={16}
                color={
                  editableOrderType === OrderTypeEnum.DINE_IN
                    ? colors.primary
                    : colors.onSurfaceVariant
                }
              />
              <Text
                style={[
                  styles.orderTypeButtonText,
                  {
                    color:
                      editableOrderType === OrderTypeEnum.DINE_IN
                        ? colors.primary
                        : colors.onSurfaceVariant,
                  },
                ]}
              >
                Comer aquí
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.orderTypeButton,
                editableOrderType === OrderTypeEnum.TAKE_AWAY &&
                  styles.orderTypeButtonActive,
                {
                  backgroundColor:
                    editableOrderType === OrderTypeEnum.TAKE_AWAY
                      ? colors.primaryContainer
                      : colors.surface,
                },
              ]}
              onPress={() => setEditableOrderType(OrderTypeEnum.TAKE_AWAY)}
            >
              <MaterialIcons
                name="shopping-bag"
                size={16}
                color={
                  editableOrderType === OrderTypeEnum.TAKE_AWAY
                    ? colors.primary
                    : colors.onSurfaceVariant
                }
              />
              <Text
                style={[
                  styles.orderTypeButtonText,
                  {
                    color:
                      editableOrderType === OrderTypeEnum.TAKE_AWAY
                        ? colors.primary
                        : colors.onSurfaceVariant,
                  },
                ]}
              >
                Para llevar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.orderTypeButton,
                editableOrderType === OrderTypeEnum.DELIVERY &&
                  styles.orderTypeButtonActive,
                {
                  backgroundColor:
                    editableOrderType === OrderTypeEnum.DELIVERY
                      ? colors.primaryContainer
                      : colors.surface,
                },
              ]}
              onPress={() => setEditableOrderType(OrderTypeEnum.DELIVERY)}
            >
              <MaterialIcons
                name="moped"
                size={16}
                color={
                  editableOrderType === OrderTypeEnum.DELIVERY
                    ? colors.primary
                    : colors.onSurfaceVariant
                }
              />
              <Text
                style={[
                  styles.orderTypeButtonText,
                  {
                    color:
                      editableOrderType === OrderTypeEnum.DELIVERY
                        ? colors.primary
                        : colors.onSurfaceVariant,
                  },
                ]}
              >
                Domicilio
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Renderizado condicional según tipo de orden - EXACTAMENTE como OrderCartDetail */}
        {editableOrderType === OrderTypeEnum.DINE_IN && (
          <View style={styles.compactSectionContainer}>
            <View style={styles.compactSectionHeader}>
              <MaterialIcons
                name="restaurant"
                size={20}
                color={colors.primary}
              />
              <Text
                style={[
                  styles.compactSectionTitle,
                  { color: colors.onSurface },
                ]}
              >
                Mesa y Área
              </Text>
            </View>

            <View style={styles.compactDeliveryContainer}>
              {/* Área y Mesa en la misma fila */}
              <View style={styles.dineInSelectorsRow}>
                {/* Área */}
                <View style={styles.dineInSelectorContainer}>
                  <Menu
                    visible={areaMenuVisible}
                    onDismiss={() => setAreaMenuVisible(false)}
                    anchor={
                      <AnimatedLabelSelector
                        label="Área *"
                        value={selectedAreaName}
                        onPress={() => setAreaMenuVisible(true)}
                        isLoading={isLoadingAreas}
                        error={!!areaError || !!errorAreas}
                        disabled={isLoadingAreas}
                      />
                    }
                  >
                    {areasData?.map((area: any) => (
                      <Menu.Item
                        key={area.id}
                        onPress={() => {
                          setEditableSelectedAreaId(area.id);
                          setEditableSelectedTableId(null);
                          setAreaMenuVisible(false);
                          setAreaError(null);
                        }}
                        title={area.name}
                      />
                    ))}
                    {errorAreas && (
                      <Menu.Item title="Error al cargar áreas" disabled />
                    )}
                  </Menu>
                  {areaError && !errorAreas && (
                    <HelperText
                      type="error"
                      visible={true}
                      style={styles.helperTextFix}
                    >
                      {areaError}
                    </HelperText>
                  )}
                  {errorAreas && (
                    <HelperText
                      type="error"
                      visible={true}
                      style={styles.helperTextFix}
                    >
                      Error al cargar áreas
                    </HelperText>
                  )}
                </View>

                {/* Mesa */}
                <View style={styles.dineInSelectorContainer}>
                  <Menu
                    visible={tableMenuVisible}
                    onDismiss={() => setTableMenuVisible(false)}
                    anchor={
                      <AnimatedLabelSelector
                        label="Mesa *"
                        value={selectedTableName}
                        onPress={() => setTableMenuVisible(true)}
                        isLoading={isLoadingTables}
                        error={!!tableError || !!errorTables}
                        disabled={
                          !editableSelectedAreaId ||
                          isLoadingTables ||
                          isLoadingAreas ||
                          editableIsTemporaryTable
                        }
                      />
                    }
                  >
                    {tablesData?.map((table: Table) => (
                      <Menu.Item
                        key={table.id}
                        onPress={() => {
                          if (table.isAvailable) {
                            setEditableSelectedTableId(table.id);
                            setTableMenuVisible(false);
                            setTableError(null);
                          }
                        }}
                        title={`${table.name}${!table.isAvailable ? ' (Ocupada)' : ''}`}
                        disabled={!table.isAvailable}
                        titleStyle={
                          !table.isAvailable
                            ? { color: colors.error }
                            : undefined
                        }
                      />
                    ))}
                    {editableSelectedAreaId &&
                      tablesData?.length === 0 &&
                      !isLoadingTables &&
                      !errorTables && (
                        <Menu.Item title="No hay mesas" disabled />
                      )}
                    {errorTables && (
                      <Menu.Item title="Error al cargar mesas" disabled />
                    )}
                  </Menu>
                  {tableError && !errorTables && !editableIsTemporaryTable && (
                    <HelperText
                      type="error"
                      visible={true}
                      style={styles.helperTextFix}
                    >
                      {tableError}
                    </HelperText>
                  )}
                  {errorTables && (
                    <HelperText
                      type="error"
                      visible={true}
                      style={styles.helperTextFix}
                    >
                      Error al cargar mesas
                    </HelperText>
                  )}
                </View>
              </View>

              {/* Opción de mesa temporal */}
              <TouchableOpacity
                onPress={() => {
                  setEditableIsTemporaryTable(!editableIsTemporaryTable);
                  if (!editableIsTemporaryTable) {
                    setEditableSelectedTableId(null);
                    setTableError(null);
                  } else {
                    setEditableTemporaryTableName('');
                  }
                }}
                style={styles.checkboxContainer}
              >
                <Checkbox.Android
                  status={editableIsTemporaryTable ? 'checked' : 'unchecked'}
                  onPress={() => {
                    setEditableIsTemporaryTable(!editableIsTemporaryTable);
                    if (!editableIsTemporaryTable) {
                      setEditableSelectedTableId(null);
                      setTableError(null);
                    } else {
                      setEditableTemporaryTableName('');
                    }
                  }}
                  color={colors.primary}
                />
                <Text style={styles.checkboxLabel}>Crear mesa temporal</Text>
              </TouchableOpacity>

              {/* Campo para nombre de mesa temporal */}
              {editableIsTemporaryTable && (
                <View style={styles.temporaryTableInputContainer}>
                  <SpeechRecognitionInput
                    label="Nombre de la Mesa Temporal *"
                    value={editableTemporaryTableName}
                    onChangeText={(text) => {
                      setEditableTemporaryTableName(text);
                      if (tableError) setTableError(null);
                    }}
                    error={!!tableError && editableIsTemporaryTable}
                    speechLang="es-MX"
                    autoCapitalize="words"
                    autoCorrect={false}
                    placeholder="Ej: Mesa Terraza 1"
                    style={styles.compactTextInput}
                    dense
                  />
                  {tableError && editableIsTemporaryTable && (
                    <HelperText
                      type="error"
                      visible={true}
                      style={styles.helperTextFix}
                    >
                      {tableError}
                    </HelperText>
                  )}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Para llevar - Solo nombre del cliente */}
        {editableOrderType === OrderTypeEnum.TAKE_AWAY && (
          <View style={styles.compactSectionContainer}>
            <View style={styles.compactSectionHeader}>
              <MaterialIcons name="person" size={20} color={colors.primary} />
              <Text
                style={[
                  styles.compactSectionTitle,
                  { color: colors.onSurface },
                ]}
              >
                Información del Cliente
              </Text>
            </View>

            <View style={styles.compactDeliveryContainer}>
              <SpeechRecognitionInput
                label="Nombre del Cliente *"
                value={editableDeliveryInfo.recipientName || ''}
                onChangeText={(text) => {
                  setEditableDeliveryInfo((prev) => ({
                    ...prev,
                    recipientName: text,
                  }));
                  if (recipientNameError) setRecipientNameError(null);
                }}
                error={!!recipientNameError}
                speechLang="es-MX"
                autoCapitalize="words"
                autoCorrect={false}
                style={styles.compactTextInput}
                dense
              />
              {recipientNameError && (
                <HelperText
                  type="error"
                  visible={true}
                  style={styles.helperTextFix}
                >
                  {recipientNameError}
                </HelperText>
              )}

              <SpeechRecognitionInput
                label="Teléfono (Opcional)"
                value={editableDeliveryInfo.recipientPhone || ''}
                onChangeText={(text) => {
                  setEditableDeliveryInfo((prev) => ({
                    ...prev,
                    recipientPhone: text,
                  }));
                  if (recipientPhoneError) setRecipientPhoneError(null);
                }}
                error={!!recipientPhoneError}
                speechLang="es-MX"
                keyboardType="phone-pad"
                style={styles.compactTextInput}
                dense
              />
              {recipientPhoneError && (
                <HelperText
                  type="error"
                  visible={true}
                  style={styles.helperTextFix}
                >
                  {recipientPhoneError}
                </HelperText>
              )}
            </View>
          </View>
        )}

        {/* Domicilio - Solo dirección y teléfono */}
        {editableOrderType === OrderTypeEnum.DELIVERY && (
          <View style={styles.compactSectionContainer}>
            <View style={styles.compactSectionHeader}>
              <MaterialIcons
                name="local-shipping"
                size={20}
                color={colors.primary}
              />
              <Text
                style={[
                  styles.compactSectionTitle,
                  { color: colors.onSurface },
                ]}
              >
                Información de Entrega
              </Text>
            </View>

            <View style={styles.compactDeliveryContainer}>
              <SpeechRecognitionInput
                label="Dirección completa *"
                value={editableDeliveryInfo.fullAddress || ''}
                onChangeText={(text) => {
                  setEditableDeliveryInfo((prev) => ({
                    ...prev,
                    fullAddress: text,
                  }));
                  if (addressError) setAddressError(null);
                }}
                error={!!addressError}
                speechLang="es-MX"
                multiline
                numberOfLines={2}
                style={styles.compactTextInput}
                dense
              />
              {addressError && (
                <HelperText
                  type="error"
                  visible={true}
                  style={styles.helperTextFix}
                >
                  {addressError}
                </HelperText>
              )}

              <SpeechRecognitionInput
                label="Teléfono *"
                value={editableDeliveryInfo.recipientPhone || ''}
                onChangeText={(text) => {
                  setEditableDeliveryInfo((prev) => ({
                    ...prev,
                    recipientPhone: text,
                  }));
                  if (recipientPhoneError) setRecipientPhoneError(null);
                }}
                error={!!recipientPhoneError}
                speechLang="es-MX"
                keyboardType="phone-pad"
                style={styles.compactTextInput}
                dense
              />
              {recipientPhoneError && (
                <HelperText
                  type="error"
                  visible={true}
                  style={styles.helperTextFix}
                >
                  {recipientPhoneError}
                </HelperText>
              )}
            </View>
          </View>
        )}

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

        {/* Items de la orden - Versión compacta */}
        <View
          style={[
            styles.compactSectionContainer,
            { borderTopWidth: 1, borderTopColor: colors.primary + '40' },
          ]}
        >
          <View style={styles.compactSectionHeader}>
            <MaterialIcons
              name="restaurant-menu"
              size={20}
              color={colors.primary}
            />
            <Text
              style={[styles.compactSectionTitle, { color: colors.onSurface }]}
            >
              Productos ({editableItems.length})
            </Text>
          </View>

          {editableItems.length === 0 ? (
            <View style={styles.emptyContainerCompact}>
              <MaterialIcons
                name="mic-off"
                size={32}
                color={colors.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.emptyTextCompact,
                  { color: colors.onSurfaceVariant },
                ]}
              >
                No se detectaron productos
              </Text>
            </View>
          ) : (
            <View style={styles.compactItemsList}>
              {editableItems.map((item, index) => {
                const itemKey = `${item.productId}-${index}`;
                const { productName, variantName } = getProductDetails(
                  item.productId,
                  item.variantId,
                );
                const pizzaCustomizationsText = formatPizzaCustomizations(
                  item.pizzaCustomizations,
                );

                // Función para renderizar acciones de deslizar
                const renderRightActions = (_progress: any, dragX: any) => {
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
                        style={[
                          styles.compactItemContainer,
                          itemsWithErrors.has(index) && {
                            borderWidth: 1,
                            borderColor: colors.error,
                            backgroundColor: colors.errorContainer + '20',
                          },
                        ]}
                      >
                        <View style={styles.compactItemContent}>
                          <View style={styles.compactItemLeft}>
                            <Text
                              style={[
                                styles.compactItemTitle,
                                { color: colors.onSurface },
                              ]}
                            >
                              {`${item.quantity}x ${variantName || productName}`}
                            </Text>

                            {/* Mostrar errores de validación */}
                            {itemValidationErrors[index] && (
                              <View style={styles.validationErrorsContainer}>
                                {itemValidationErrors[index].map(
                                  (error, errorIdx) => (
                                    <Text
                                      key={errorIdx}
                                      style={[
                                        styles.validationErrorText,
                                        { color: colors.error },
                                      ]}
                                    >
                                      ⚠️ {error}
                                    </Text>
                                  ),
                                )}
                              </View>
                            )}

                            {/* Renderizar personalizaciones de pizza */}
                            {pizzaCustomizationsText && (
                              <Text
                                style={[
                                  styles.compactItemSubtitle,
                                  { color: colors.onSurfaceVariant },
                                ]}
                              >
                                {pizzaCustomizationsText}
                              </Text>
                            )}

                            {/* Renderizar modificadores */}
                            {item.modifiers &&
                              item.modifiers.length > 0 &&
                              item.modifiers.map((mod, idx) => (
                                <Text
                                  key={idx}
                                  style={[
                                    styles.compactItemSubtitle,
                                    { color: colors.onSurfaceVariant },
                                  ]}
                                >
                                  • {mod}
                                </Text>
                              ))}
                          </View>

                          <View style={styles.compactItemRight}>
                            <View style={styles.compactQuantityActions}>
                              <IconButton
                                icon="minus-circle-outline"
                                size={18}
                                onPress={() =>
                                  updateItemQuantity(
                                    item.productId,
                                    index,
                                    item.quantity - 1,
                                  )
                                }
                                style={styles.compactQuantityButton}
                                disabled={item.quantity <= 1}
                              />
                              <Text
                                style={[
                                  styles.compactQuantityText,
                                  { color: colors.onSurface },
                                ]}
                              >
                                {item.quantity}
                              </Text>
                              <IconButton
                                icon="plus-circle-outline"
                                size={18}
                                onPress={() =>
                                  updateItemQuantity(
                                    item.productId,
                                    index,
                                    item.quantity + 1,
                                  )
                                }
                                style={styles.compactQuantityButton}
                              />
                            </View>
                            <IconButton
                              icon="pencil"
                              size={16}
                              onPress={() => handleEditItem(item, index)}
                              style={styles.compactEditButton}
                            />
                          </View>
                        </View>
                      </TouchableOpacity>
                    </Swipeable>

                    {index < editableItems.length - 1 && (
                      <Divider style={styles.compactItemDivider} />
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Hora programada - Versión compacta */}
        {scheduledDelivery?.time && (
          <View style={styles.compactSectionContainer}>
            <View style={styles.compactSectionHeader}>
              <MaterialIcons name="schedule" size={20} color={colors.primary} />
              <Text
                style={[
                  styles.compactSectionTitle,
                  { color: colors.onSurface },
                ]}
              >
                Entrega Programada
              </Text>
            </View>
            <Text
              style={[styles.compactScheduledTime, { color: colors.onSurface }]}
            >
              {scheduledDelivery.time}
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <>
      {visible && (
        <Portal>
          <Modal
            visible={visible}
            onDismiss={onDismiss}
            contentContainerStyle={[
              styles.modalContainer,
              {
                width: modalWidth,
                backgroundColor: colors.surface,
                maxHeight: screenHeight * 0.9,
                height: screenHeight * 0.85,
                // Borde grueso y muy visible
                borderWidth: 6,
                borderColor: colors.primary,
                // Sombra pronunciada con color primario
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.6,
                shadowRadius: 16,
                // Para Android - elevación alta
                elevation: 20,
              },
            ]}
          >
            {/* Header dinámico según el estado */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.onSurface }]}>
                {isProcessing && '🎤 Procesando orden por voz...'}
                {error && '⚠️ Error en el procesamiento'}
                {!isProcessing &&
                  !error &&
                  hasValidationErrors &&
                  '⚠️ Revisa los productos'}
                {!isProcessing &&
                  !error &&
                  !hasValidationErrors &&
                  'Agregar a tu orden 🛒'}
              </Text>
              <IconButton
                icon="close"
                size={24}
                onPress={handleAttemptExit}
                style={styles.closeButton}
              />
            </View>

            {/* Divider solo cuando no está procesando ni hay error */}
            {!isProcessing && !error && (
              <Divider style={{ backgroundColor: colors.outlineVariant }} />
            )}

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
                        onPress={handleAttemptExit}
                        style={styles.footerButton}
                      >
                        Cancelar
                      </Button>
                      <Button
                        mode="contained"
                        onPress={handleConfirm}
                        style={[
                          styles.footerButton,
                          hasValidationErrors && {
                            backgroundColor: colors.error,
                          },
                        ]}
                        icon={hasValidationErrors ? 'alert-circle' : 'plus'}
                        buttonColor={
                          hasValidationErrors ? colors.error : undefined
                        }
                      >
                        {hasValidationErrors ? 'Hay errores' : 'Agregar'}
                      </Button>
                    </>
                  ) : (
                    <Button
                      mode="contained"
                      onPress={handleAttemptExit}
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
      )}

      {/* Modal de confirmación de salida */}
      <ConfirmationModal
        visible={showExitConfirmationModal}
        title="¿Descartar datos?"
        message="Tienes datos sin guardar. Si sales, se perderán los productos y la información que has modificado. ¿Estás seguro?"
        confirmText="Salir y Descartar"
        cancelText="Cancelar"
        onConfirm={handleConfirmExit}
        onCancel={handleCancelExit}
        onDismiss={handleCancelExit}
        confirmButtonColor={colors.error}
      />
    </>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    borderRadius: 16,
    alignSelf: 'center',
    flex: 1,
    marginVertical: 16,
    marginHorizontal: 12,
    // Sombra base adicional en negro para mayor contraste
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 24,
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
    flex: 1,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  processingContent: {
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  processingIcon: {
    marginBottom: 16,
    opacity: 0.8,
  },
  processingSpinner: {
    marginBottom: 24,
  },
  processingTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  processingSubtext: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 22,
  },
  processingSteps: {
    width: '100%',
    marginBottom: 32,
    gap: 16,
  },
  processingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  stepText: {
    fontSize: 14,
    flex: 1,
  },
  processingFooter: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  errorContent: {
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    width: '100%',
  },
  errorButton: {
    flex: 1,
  },
  errorFooter: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
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
  // Nuevos estilos compactos
  compactSectionContainer: {
    margin: 16,
    marginBottom: 8,
  },
  compactSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    gap: 8,
  },
  compactSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainerCompact: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  emptyTextCompact: {
    fontSize: 14,
    textAlign: 'center',
  },
  compactItemsList: {
    gap: 2,
  },
  compactItemContainer: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  compactItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactItemLeft: {
    flex: 1,
    paddingRight: 8,
  },
  compactItemTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  compactItemSubtitle: {
    fontSize: 12,
    marginTop: 1,
    lineHeight: 16,
  },
  compactItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactQuantityActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactQuantityButton: {
    margin: 0,
    width: 32,
    height: 32,
  },
  compactQuantityText: {
    fontSize: 13,
    fontWeight: '600',
    minWidth: 20,
    textAlign: 'center',
  },
  compactEditButton: {
    margin: 0,
    width: 28,
    height: 28,
    marginLeft: 4,
  },
  compactItemDivider: {
    marginVertical: 4,
    marginHorizontal: 12,
  },
  compactDeliveryContainer: {
    gap: 8,
  },
  compactTextInput: {
    backgroundColor: 'transparent',
  },
  compactScheduledTime: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 8,
  },
  compactOrderTypeContainer: {
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  compactOrderTypeChip: {
    paddingHorizontal: 12,
    height: 28,
  },
  // Estilos para el tipo de orden editable
  orderTypeSection: {
    margin: 16,
    marginBottom: 8,
  },
  orderTypeButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  orderTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
    elevation: 1,
  },
  orderTypeButtonActive: {
    elevation: 2,
  },
  orderTypeButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  compactInputContainer: {
    marginBottom: 8,
  },
  helperTextFix: {
    marginTop: 4,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 14,
  },
  temporaryTableInputContainer: {
    marginTop: 8,
  },
  dineInSelectorsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  dineInSelectorContainer: {
    flex: 1,
  },
  // Estilos para validación de productos
  validationErrorsContainer: {
    marginTop: 4,
    gap: 2,
  },
  validationErrorText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
