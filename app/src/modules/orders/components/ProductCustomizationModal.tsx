import { useState, useMemo, useCallback, memo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Modal,
  Portal,
  Text,
  Button,
  Divider,
  Appbar,
  IconButton,
  Card,
  Chip,
  Surface,
} from 'react-native-paper';
import { Controller } from 'react-hook-form';
import { useAppTheme } from '@/app/styles/theme';
import SpeechRecognitionInput from '@/app/components/common/SpeechRecognitionInput';
import {
  FullMenuProduct as Product,
  FullMenuModifierGroup,
} from '../schema/orders.schema';
import { CartItem, CartItemModifier } from '../utils/cartUtils';
import { AppTheme } from '@/app/styles/theme';
import { useSnackbarStore } from '@/app/stores/snackbarStore';
import ConfirmationModal from '@/app/components/common/ConfirmationModal';
import type { SelectedPizzaCustomization } from '@/app/schemas/domain/order.schema';
import {
  CustomizationActionEnum,
  PizzaHalfEnum,
} from '@/modules/pizzaCustomizations/schema/pizzaCustomization.schema';
import PizzaCustomizationSection from './PizzaCustomizationSection';
import { useProductCustomization } from '../hooks/useProductCustomization';
import VariantSelectionGroup from './VariantSelectionGroup';
import ModifierGroup from './ModifierGroup';

interface ProductCustomizationModalProps {
  visible: boolean;
  onDismiss: () => void;
  product: Product;
  editingItem?: CartItem | null;
  onAddToCart: (
    product: Product,
    quantity: number,
    variantId?: string,
    modifiers?: CartItemModifier[],
    preparationNotes?: string,
    selectedPizzaCustomizations?: SelectedPizzaCustomization[],
    pizzaExtraCost?: number,
  ) => void;
  onUpdateItem?: (
    itemId: string,
    quantity: number,
    modifiers: CartItemModifier[],
    preparationNotes?: string,
    variantId?: string,
    variantName?: string,
    unitPrice?: number,
    selectedPizzaCustomizations?: SelectedPizzaCustomization[],
    pizzaExtraCost?: number,
  ) => void;
}

const ProductCustomizationModal = memo<ProductCustomizationModalProps>(
  ({ visible, onDismiss, product, editingItem, onAddToCart, onUpdateItem }) => {
    const theme = useAppTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

    // Usar el hook de customización de producto
    const {
      selectedVariantId,
      selectedModifiersByGroup,
      selectedModifiers,
      quantity,
      hasChanges,
      pizzaCustomizations,
      pizzaConfiguration,
      selectedPizzaCustomizations,
      hasVariants,
      basePrice,
      modifiersPrice,
      pizzaExtraCost,
      totalPrice,
      isValid,
      getFieldError,
      getGroupError,
      handleVariantSelect,
      handleModifierToggle,
      increaseQuantity,
      decreaseQuantity,
      setSelectedPizzaCustomizations,
      control,
      watchedPreparationNotes,
    } = useProductCustomization({
      product,
      editingItem,
      visible,
    });

    const [showExitConfirmation, setShowExitConfirmation] = useState(false);

    const handleAddToCart = () => {
      // Validar variantes requeridas
      if (hasVariants && !selectedVariantId) {
        showSnackbar({
          message: 'Debes seleccionar una variante',
          type: 'error',
        });
        return;
      }

      // Validar pizzas - cada mitad debe tener al menos un elemento (sabor o ingrediente)
      if (product.isPizza && pizzaConfiguration) {
        const addedCustomizations = selectedPizzaCustomizations.filter(
          (sc) => sc.action === CustomizationActionEnum.ADD,
        );

        // Verificar elementos en cada mitad
        const fullPizzaElements = addedCustomizations.filter(
          (sc) => sc.half === PizzaHalfEnum.FULL,
        );

        const half1Elements = addedCustomizations.filter(
          (sc) => sc.half === PizzaHalfEnum.HALF_1,
        );

        const half2Elements = addedCustomizations.filter(
          (sc) => sc.half === PizzaHalfEnum.HALF_2,
        );

        // Si hay elementos en pizza completa, es válido
        if (fullPizzaElements.length > 0) {
          // La pizza completa cubre ambas mitades
        } else {
          // Si no hay elementos en pizza completa, verificar que ambas mitades tengan al menos un elemento
          if (half1Elements.length === 0) {
            showSnackbar({
              message:
                'La primera mitad de la pizza debe tener al menos un sabor o ingrediente',
              type: 'error',
            });
            return;
          }

          if (half2Elements.length === 0) {
            showSnackbar({
              message:
                'La segunda mitad de la pizza debe tener al menos un sabor o ingrediente',
              type: 'error',
            });
            return;
          }
        }

        // Verificar que al menos hay un elemento en total
        if (addedCustomizations.length === 0) {
          showSnackbar({
            message: 'La pizza debe tener al menos un sabor o ingrediente',
            type: 'error',
          });
          return;
        }
      }

      // Validar grupos requeridos y límites de selección
      if (product.modifierGroups) {
        for (const group of product.modifierGroups) {
          const selectedInGroup = selectedModifiersByGroup[group.id] || [];
          const selectedCount = selectedInGroup.length;

          // Validar grupos requeridos y mínimo de selecciones
          if (
            group.isRequired ||
            (group.minSelections && group.minSelections > 0)
          ) {
            const minRequired = Math.max(
              group.minSelections || 0,
              group.isRequired ? 1 : 0,
            );

            if (selectedCount < minRequired) {
              let message = '';
              if (group.isRequired && minRequired === 1) {
                message = `"${group.name}" es requerido. Debes seleccionar al menos una opción.`;
              } else if (minRequired > 1) {
                message = `Debes seleccionar al menos ${minRequired} ${minRequired === 1 ? 'opción' : 'opciones'} en "${group.name}"`;
              } else {
                message = `Debes seleccionar al menos una opción en "${group.name}"`;
              }

              showSnackbar({
                message,
                type: 'error',
              });
              return;
            }
          }

          // Validar máximo de selecciones (esto ya se valida en handleModifierToggle, pero por si acaso)
          if (group.maxSelections && selectedCount > group.maxSelections) {
            showSnackbar({
              message: `No puedes seleccionar más de ${group.maxSelections} ${group.maxSelections === 1 ? 'opción' : 'opciones'} en "${group.name}"`,
              type: 'error',
            });
            return;
          }
        }
      }

      if (editingItem && onUpdateItem) {
        // Si estamos editando, actualizar el item existente
        const variant = product.variants?.find(
          (v) => v.id === selectedVariantId,
        );
        const unitPrice = variant
          ? Number(variant.price)
          : Number(product.price) || 0;

        onUpdateItem(
          editingItem.id,
          quantity,
          selectedModifiers,
          watchedPreparationNotes,
          selectedVariantId,
          variant?.name,
          unitPrice,
          selectedPizzaCustomizations,
          pizzaExtraCost,
        );
      } else {
        // Si es un nuevo item, agregarlo al carrito
        onAddToCart(
          product,
          quantity,
          selectedVariantId,
          selectedModifiers,
          watchedPreparationNotes,
          selectedPizzaCustomizations,
          pizzaExtraCost,
        );
      }
      onDismiss();
    };

    const handleDismiss = useCallback(() => {
      if (editingItem && hasChanges) {
        setShowExitConfirmation(true);
      } else {
        onDismiss();
      }
    }, [editingItem, hasChanges, onDismiss]);

    const handleConfirmExit = useCallback(() => {
      setShowExitConfirmation(false);
      onDismiss();
    }, [onDismiss]);

    const handleCancelExit = useCallback(() => {
      setShowExitConfirmation(false);
    }, []);

    if (!product || !visible) {
      return null;
    }

    return (
      <>
        <Portal>
          <Modal
            visible={visible}
            onDismiss={handleDismiss}
            contentContainerStyle={styles.modalContent}
          >
            {/* Encabezado Refactorizado con Appbar */}
            <Appbar.Header style={styles.appBar} elevated>
              <Appbar.BackAction
                onPress={handleDismiss}
                color={theme.colors.onSurface}
              />
              <Appbar.Content
                title={product?.name || 'Producto'}
                titleStyle={styles.appBarTitle}
                style={styles.appBarContent}
              />
              {/* Espaciador si no hay acción a la derecha */}
              <View style={styles.appBarSpacer} />
            </Appbar.Header>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollViewContent}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
            >
              {hasVariants && product.variants && (
                <VariantSelectionGroup
                  variants={product.variants}
                  selectedVariantId={selectedVariantId}
                  onVariantSelect={handleVariantSelect}
                  errorMessage={getFieldError('variant')}
                />
              )}

              {/* Sección de Personalización de Pizza - Después de variantes */}
              {product.isPizza && (
                <Card style={styles.sectionCard}>
                  <Card.Content>
                    {getFieldError('pizza') && (
                      <View style={styles.pizzaErrorContainer}>
                        <Chip
                          mode="flat"
                          compact
                          style={styles.errorChip}
                          icon="alert-circle"
                          textStyle={styles.errorChipText}
                        >
                          {getFieldError('pizza')}
                        </Chip>
                      </View>
                    )}
                    <PizzaCustomizationSection
                      pizzaCustomizations={pizzaCustomizations}
                      pizzaConfiguration={pizzaConfiguration}
                      selectedPizzaCustomizations={selectedPizzaCustomizations}
                      onCustomizationChange={setSelectedPizzaCustomizations}
                      loading={false}
                    />
                  </Card.Content>
                </Card>
              )}

              {product.modifierGroups &&
                Array.isArray(product.modifierGroups) &&
                product.modifierGroups.length > 0 &&
                product.modifierGroups.map((group: FullMenuModifierGroup) => (
                  <ModifierGroup
                    key={group.id}
                    group={group}
                    selectedModifiers={selectedModifiersByGroup[group.id] || []}
                    onModifierToggle={handleModifierToggle}
                    errorMessage={getGroupError(group.id)}
                  />
                ))}

              {/* Sección Cantidad - Mejorada */}
              <Card style={styles.sectionCard}>
                <Card.Content>
                  <Text style={styles.sectionTitle}>Cantidad</Text>
                  <View style={styles.quantityContainer}>
                    <IconButton
                      icon="minus-circle-outline"
                      size={36}
                      onPress={decreaseQuantity}
                      style={[
                        styles.quantityIconButton,
                        quantity <= 1 && styles.quantityIconButtonDisabled,
                      ]}
                      iconColor={
                        quantity <= 1
                          ? theme.colors.onSurfaceDisabled
                          : theme.colors.primary
                      }
                      disabled={quantity <= 1}
                    />
                    <Surface style={styles.quantityBadge} elevation={1}>
                      <Text style={styles.quantityText}>{quantity}</Text>
                    </Surface>
                    <IconButton
                      icon="plus-circle-outline"
                      size={36}
                      onPress={increaseQuantity}
                      style={styles.quantityIconButton}
                      iconColor={theme.colors.primary}
                    />
                  </View>
                </Card.Content>
              </Card>

              {/* Sección Notas de Preparación - Mejorada */}
              <Card style={styles.sectionCard}>
                <Card.Content>
                  <Controller
                    control={control}
                    name="preparationNotes"
                    render={({ field: { onChange, value } }) => (
                      <SpeechRecognitionInput
                        key="preparation-notes-input"
                        label="Notas de Preparación"
                        value={value}
                        onChangeText={onChange}
                        multiline
                        numberOfLines={2}
                        style={styles.preparationInput}
                        speechLang="es-MX"
                      />
                    )}
                  />
                </Card.Content>
              </Card>

              {/* Sección Resumen - Mejorada */}
              <Card style={[styles.sectionCard, styles.summaryCard]}>
                <Card.Content>
                  <Text style={styles.sectionTitle}>Resumen del pedido</Text>
                  <View style={styles.summaryContent}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Precio base:</Text>
                      <Text style={styles.summaryValue}>
                        ${basePrice.toFixed(2)}
                      </Text>
                    </View>
                    {selectedModifiers.length > 0 && (
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Adicionales:</Text>
                        <Text style={styles.summaryValue}>
                          +${modifiersPrice.toFixed(2)}
                        </Text>
                      </View>
                    )}
                    {pizzaExtraCost > 0 && (
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Toppings extra:</Text>
                        <Text style={styles.summaryValue}>
                          +${pizzaExtraCost.toFixed(2)}
                        </Text>
                      </View>
                    )}
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Cantidad:</Text>
                      <Text style={styles.summaryValue}>×{quantity}</Text>
                    </View>
                    <Divider style={styles.summaryDivider} />
                    <View style={[styles.summaryRow, styles.totalRow]}>
                      <Text style={styles.totalLabel}>Total:</Text>
                      <Text style={styles.totalValue}>
                        ${totalPrice.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            </ScrollView>

            {/* Footer Button - Estilo OrderCartDetail */}
            <View style={styles.footer}>
              {!isValid && (
                <View style={styles.validationWarning}>
                  <IconButton
                    icon="alert-circle"
                    size={20}
                    iconColor={theme.colors.error}
                    style={styles.warningIcon}
                  />
                  <Text style={styles.validationWarningText}>
                    Completa los campos requeridos
                  </Text>
                </View>
              )}
              <Button
                mode="contained"
                onPress={handleAddToCart}
                style={[
                  styles.confirmButton,
                  !isValid && styles.confirmButtonDisabled,
                ]}
                disabled={!isValid}
                icon={editingItem ? 'cart-check' : 'cart-plus'}
              >
                {editingItem
                  ? `Actualizar Item - $${totalPrice.toFixed(2)}`
                  : `Agregar al Carrito - $${totalPrice.toFixed(2)}`}
              </Button>
            </View>
          </Modal>
        </Portal>

        {/* ConfirmationModal fuera del Portal principal */}
        <Portal>
          <ConfirmationModal
            visible={showExitConfirmation}
            onDismiss={handleCancelExit}
            onConfirm={handleConfirmExit}
            title="¿Descartar cambios?"
            message="Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?"
            confirmText="Descartar"
            cancelText="Cancelar"
            confirmButtonColor={theme.colors.error}
          />
        </Portal>
      </>
    );
  },
);

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    modalContent: {
      backgroundColor: theme.colors.background,
      width: '100%',
      height: '100%',
      margin: 0,
      padding: 0,
      position: 'absolute',
      top: 0,
      left: 0,
    },
    // Estilos del Appbar
    appBar: {
      backgroundColor: theme.colors.elevation.level2, // Coincidir con OrderHeader
    },
    appBarTitle: {
      // Estilo para el TÍTULO dentro de Appbar.Content
      ...theme.fonts.titleMedium, // Fuente consistente con OrderHeader
      color: theme.colors.onSurface,
      fontWeight: 'bold', // Añadir negritas al título
      // textAlign: 'center', // El centrado lo maneja appBarContent
      // flex: 1, // Quitar flex para permitir centrado vertical por appBarContent
    },
    appBarContent: {
      // Contenedor del título
      flex: 1, // Ocupar espacio disponible para centrar
      justifyContent: 'center', // Centrar verticalmente el contenido (título)
      alignItems: 'center', // Centrar horizontalmente el contenido (título)
      // marginLeft: -48, // Compensar el botón de back si es necesario (ajustar)
    },
    appBarSpacer: {
      // Espaciador para equilibrar el botón de retroceso
      width: 48, // Ancho estándar de IconButton
    },
    // --- Fin estilos Appbar ---
    scrollView: {
      flex: 1,
      padding: theme.spacing.m,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: theme.spacing.xs,
      color: theme.colors.onSurface,
    },
    // Nuevos estilos para Cards
    sectionCard: {
      marginBottom: theme.spacing.m,
      borderRadius: theme.roundness * 2,
    },
    // Estilos de cantidad mejorados
    quantityBadge: {
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.primaryContainer,
    },
    quantityIconButtonDisabled: {
      opacity: 0.5,
    },
    // Estilos de resumen mejorados
    summaryCard: {
      backgroundColor: theme.dark
        ? theme.colors.elevation.level3
        : theme.colors.secondaryContainer,
      borderWidth: theme.dark ? 1 : 0,
      borderColor: theme.dark ? theme.colors.outlineVariant : undefined,
    },
    summaryContent: {
      marginTop: theme.spacing.xs,
    },
    summaryLabel: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    summaryValue: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurface,
    },
    summaryDivider: {
      marginVertical: theme.spacing.xs,
      backgroundColor: theme.colors.onSurfaceVariant,
      opacity: 0.3,
    },
    quantityContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginVertical: theme.spacing.s,
    },
    quantityIconButton: {
      margin: 0,
      borderRadius: 18,
    },
    quantityText: {
      fontSize: 18,
      fontWeight: 'bold',
      minWidth: 40,
      textAlign: 'center',
      marginHorizontal: theme.spacing.s,
      color: theme.colors.onSurface,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.xs, // Añadir padding horizontal
    },
    totalRow: {
      // Estilo adicional para la fila del total
      marginTop: theme.spacing.s,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      paddingTop: theme.spacing.s,
    },
    totalLabel: {
      // Estilo consistente con OrderCartDetail
      fontWeight: 'bold',
      fontSize: 18,
      color: theme.colors.onSurface,
    },
    totalValue: {
      // Estilo consistente con OrderCartDetail para el TOTAL FINAL
      fontWeight: 'bold',
      fontSize: 18,
      color: theme.colors.primary, // Color primario para el total final
    },
    // Estilos de Footer y Botón - Consistentes con OrderCartDetail
    footer: {
      padding: theme.spacing.m,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface, // Fondo consistente
    },
    confirmButton: {
      // Reemplaza addButton
      paddingVertical: theme.spacing.s, // Padding consistente
      // width: "100%", // Ya es el comportamiento por defecto del botón en un View
    },
    confirmButtonDisabled: {
      opacity: 0.6,
    },
    // Estilo para SpeechRecognitionInput (una sola línea)
    preparationInput: {
      // backgroundColor: theme.colors.surfaceVariant, // Opcional: mantener fondo
      marginVertical: theme.spacing.xs,
      textAlignVertical: 'center', // Intentar centrar verticalmente el placeholder/texto
      // minHeight: 80, // Eliminar altura mínima, ya no es multilínea
    },
    validationWarning: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.s,
      backgroundColor: theme.colors.errorContainer,
      borderRadius: theme.roundness,
      marginBottom: theme.spacing.s,
    },
    validationWarningText: {
      color: theme.colors.onErrorContainer,
      fontSize: 14,
      fontWeight: '500',
      marginLeft: theme.spacing.xs,
    },
    pizzaErrorContainer: {
      marginBottom: theme.spacing.m,
    },
    // Eliminar estilos no usados
    // sectionTitleContainer: { ... },
    // sectionTitleOptional: { ... },
    divider: {
      // Estilo de Divider si se usa
      marginVertical: theme.spacing.s,
      backgroundColor: theme.colors.outlineVariant,
    },
    warningIcon: {
      margin: 0,
    },
    scrollViewContent: {
      paddingBottom: 20,
    },
    errorChip: {
      backgroundColor: theme.colors.errorContainer,
    },
    errorChipText: {
      fontSize: 12,
    },
  });

ProductCustomizationModal.displayName = 'ProductCustomizationModal';

export default ProductCustomizationModal;
