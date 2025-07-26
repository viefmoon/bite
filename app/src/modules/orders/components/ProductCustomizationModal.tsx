import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Modal,
  Portal,
  Text,
  Button,
  RadioButton,
  Divider,
  Appbar, // Importar Appbar
  TouchableRipple,
  IconButton,
  Card,
  Chip,
  Surface,
} from 'react-native-paper';
import { useForm, Controller, FieldValues } from 'react-hook-form';
import { useAppTheme } from '@/app/styles/theme';
import SpeechRecognitionInput from '@/app/components/common/SpeechRecognitionInput'; // Importar SpeechRecognitionInput
import {
  FullMenuProduct as Product,
  ProductVariant,
  Modifier,
  FullMenuModifierGroup,
} from '../types/orders.types';
import { CartItemModifier, CartItem } from '../stores/useOrderStore';
import { AppTheme } from '@/app/styles/theme';
import { useSnackbarStore } from '@/app/store/snackbarStore';
import ConfirmationModal from '@/app/components/common/ConfirmationModal';
import type { SelectedPizzaCustomization } from '@/app/schemas/domain/order.schema';
import type { PizzaCustomization } from '@/modules/pizzaCustomizations/schema/pizzaCustomization.schema';
import type { PizzaConfiguration } from '@/modules/pizzaCustomizations/schema/pizzaConfiguration.schema';
import {
  PizzaHalfEnum,
  CustomizationActionEnum,
  CustomizationTypeEnum,
} from '@/modules/pizzaCustomizations/schema/pizzaCustomization.schema';
import PizzaCustomizationSection from './PizzaCustomizationSection';
import { useProductValidation } from '../hooks/useProductValidation';

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

interface NotesFormData extends FieldValues {
  preparationNotes: string;
}

const ProductCustomizationModal = memo<ProductCustomizationModalProps>(
  ({ visible, onDismiss, product, editingItem, onAddToCart, onUpdateItem }) => {
    const theme = useAppTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

    const { control, reset, watch } = useForm<NotesFormData>({
      defaultValues: { preparationNotes: '' },
    });
    const watchedPreparationNotes = watch('preparationNotes');

    const [selectedVariantId, setSelectedVariantId] = useState<
      string | undefined
    >(
      product &&
        product.variants &&
        Array.isArray(product.variants) &&
        product.variants.length > 0
        ? product.variants[0].id
        : undefined,
    );
    const [selectedModifiersByGroup, setSelectedModifiersByGroup] = useState<
      Record<string, CartItemModifier[]>
    >({});

    const selectedModifiers = useMemo(() => {
      return Object.values(selectedModifiersByGroup).flat();
    }, [selectedModifiersByGroup]);

    // Pre-calcular si el producto tiene variantes o modificadores
    const hasVariants = useMemo(
      () =>
        product?.variants &&
        Array.isArray(product.variants) &&
        product.variants.length > 0,
      [product?.variants],
    );

    const [quantity, setQuantity] = useState(1);
    const [showExitConfirmation, setShowExitConfirmation] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Estados para pizzas
    const [pizzaCustomizations, setPizzaCustomizations] = useState<
      PizzaCustomization[]
    >([]);
    const [pizzaConfiguration, setPizzaConfiguration] =
      useState<PizzaConfiguration | null>(null);
    const [selectedPizzaCustomizations, setSelectedPizzaCustomizations] =
      useState<SelectedPizzaCustomization[]>([]);

    // Hook de validación
    const { isValid, getFieldError, getGroupError } = useProductValidation({
      product,
      selectedVariantId,
      selectedModifiersByGroup,
      selectedPizzaCustomizations,
      pizzaCustomizations,
      pizzaConfiguration,
    });

    // Función para calcular el precio extra de las pizzas
    const calculatePizzaExtraCost = useCallback(() => {
      if (!product.isPizza || !pizzaConfiguration) return 0;

      let totalToppingValue = 0;

      // Solo contar customizaciones con action = ADD
      const addedCustomizations = selectedPizzaCustomizations.filter(
        (c) => c.action === CustomizationActionEnum.ADD,
      );

      for (const selected of addedCustomizations) {
        const customization = pizzaCustomizations.find(
          (c) => c.id === selected.pizzaCustomizationId,
        );
        if (!customization) continue;

        if (selected.half === PizzaHalfEnum.FULL) {
          // Pizza completa suma el toppingValue completo
          totalToppingValue += customization.toppingValue;
        } else {
          // Media pizza suma la mitad del toppingValue
          totalToppingValue += customization.toppingValue / 2;
        }
      }

      // Solo cobrar por toppings que excedan los incluidos
      if (totalToppingValue > pizzaConfiguration.includedToppings) {
        const extraToppings =
          totalToppingValue - pizzaConfiguration.includedToppings;
        return extraToppings * Number(pizzaConfiguration.extraToppingCost);
      }

      return 0;
    }, [
      product.isPizza,
      pizzaConfiguration,
      selectedPizzaCustomizations,
      pizzaCustomizations,
    ]);

    // Función para verificar si hay cambios
    const checkForChanges = useCallback(() => {
      if (!editingItem) return false;

      // Comparar cantidad
      if (quantity !== editingItem.quantity) return true;

      // Comparar variante
      if (selectedVariantId !== editingItem.variantId) return true;

      // Comparar notas
      if (watchedPreparationNotes !== (editingItem.preparationNotes || ''))
        return true;

      // Comparar modificadores
      const currentModifierIds = selectedModifiers.map((m) => m.id).sort();
      const originalModifierIds = editingItem.modifiers.map((m) => m.id).sort();

      if (currentModifierIds.length !== originalModifierIds.length) return true;

      for (let i = 0; i < currentModifierIds.length; i++) {
        if (currentModifierIds[i] !== originalModifierIds[i]) return true;
      }

      return false;
    }, [
      editingItem,
      quantity,
      selectedVariantId,
      watchedPreparationNotes,
      selectedModifiers,
    ]);

    useEffect(() => {
      if (!product) return;

      if (editingItem) {
        // Si estamos editando, usar los valores del item
        setSelectedVariantId(editingItem.variantId);
        setQuantity(editingItem.quantity);
        reset({ preparationNotes: editingItem.preparationNotes || '' });

        // Reconstruir los modificadores por grupo
        const modifiersByGroup: Record<string, CartItemModifier[]> = {};
        if (editingItem.modifiers && product.modifierGroups) {
          editingItem.modifiers.forEach((mod) => {
            // Encontrar a qué grupo pertenece este modificador
            const group = product.modifierGroups?.find((g) =>
              g.productModifiers?.some((pm) => pm.id === mod.id),
            );
            if (group) {
              if (!modifiersByGroup[group.id]) {
                modifiersByGroup[group.id] = [];
              }
              modifiersByGroup[group.id].push(mod);
            }
          });
        }
        setSelectedModifiersByGroup(modifiersByGroup);
      } else {
        // Si es un nuevo item, valores por defecto
        if (
          product.variants &&
          Array.isArray(product.variants) &&
          product.variants.length > 0
        ) {
          setSelectedVariantId(product.variants[0].id);
        } else {
          setSelectedVariantId(undefined);
        }

        // Aplicar modificadores por defecto
        const defaultModifiersByGroup: Record<string, CartItemModifier[]> = {};

        if (product.modifierGroups) {
          product.modifierGroups.forEach((group) => {
            const defaultModifiers: CartItemModifier[] = [];

            if (group.productModifiers) {
              group.productModifiers.forEach((modifier) => {
                if (modifier.isDefault && modifier.isActive) {
                  defaultModifiers.push({
                    id: modifier.id,
                    modifierGroupId: group.id,
                    name: modifier.name,
                    price: Number(modifier.price) || 0,
                  });
                }
              });
            }

            if (defaultModifiers.length > 0) {
              // Respetar el límite máximo de selecciones
              const maxSelections =
                group.maxSelections || defaultModifiers.length;
              defaultModifiersByGroup[group.id] = defaultModifiers.slice(
                0,
                maxSelections,
              );
            }
          });
        }

        setSelectedModifiersByGroup(defaultModifiersByGroup);
        setQuantity(1);
        reset({ preparationNotes: '' });
      }
    }, [product, editingItem, reset]);

    // Usar datos de pizza que ya vienen con el producto
    useEffect(() => {
      if (!product || !visible) return;

      // Si es una pizza, usar los datos que ya vienen con el producto
      if (product.isPizza) {
        if (product.pizzaConfiguration) {
          setPizzaConfiguration(product.pizzaConfiguration);
        }
        if (product.pizzaCustomizations) {
          setPizzaCustomizations(product.pizzaCustomizations);
        }

        // Si estamos editando, cargar las personalizaciones seleccionadas
        if (editingItem && editingItem.selectedPizzaCustomizations) {
          setSelectedPizzaCustomizations(
            editingItem.selectedPizzaCustomizations,
          );
        }
      }
    }, [product, visible, editingItem]);

    // Detectar cambios
    useEffect(() => {
      if (editingItem) {
        setHasChanges(checkForChanges());
      }
    }, [editingItem, checkForChanges]);

    const handleVariantSelect = useCallback((variantId: string) => {
      setSelectedVariantId(variantId);
    }, []);

    const handleModifierToggle = (
      modifier: Modifier,
      group: FullMenuModifierGroup,
    ) => {
      const currentGroupModifiers = selectedModifiersByGroup[group.id] || [];
      const isSelected = currentGroupModifiers.some(
        (mod) => mod.id === modifier.id,
      );

      const updatedModifiersByGroup = { ...selectedModifiersByGroup };

      if (isSelected) {
        // Verificar si al deseleccionar quedaríamos por debajo del mínimo
        const newCount = currentGroupModifiers.length - 1;
        const minRequired = Math.max(
          group.minSelections || 0,
          group.isRequired ? 1 : 0,
        );

        if (newCount < minRequired) {
          showSnackbar({
            message: `No puedes deseleccionar. "${group.name}" requiere al menos ${minRequired} ${minRequired === 1 ? 'opción seleccionada' : 'opciones seleccionadas'}.`,
            type: 'warning',
          });
          return;
        }

        updatedModifiersByGroup[group.id] = currentGroupModifiers.filter(
          (mod) => mod.id !== modifier.id,
        );
      } else {
        const newModifier: CartItemModifier = {
          id: modifier.id,
          modifierGroupId: group.id,
          name: modifier.name,
          price: Number(modifier.price) || 0,
        };

        if (!group.allowMultipleSelections) {
          updatedModifiersByGroup[group.id] = [newModifier];
        } else {
          if (currentGroupModifiers.length < (group.maxSelections || 0)) {
            updatedModifiersByGroup[group.id] = [
              ...currentGroupModifiers,
              newModifier,
            ];
          } else {
            showSnackbar({
              message: `Solo puedes seleccionar hasta ${group.maxSelections || 0} opciones en ${group.name}`,
              type: 'warning',
            });
            return;
          }
        }
      }

      setSelectedModifiersByGroup(updatedModifiersByGroup);
    };

    const handleAddToCart = () => {
      // Validar variantes requeridas
      if (hasVariants && !selectedVariantId) {
        showSnackbar({
          message: 'Debes seleccionar una variante',
          type: 'error',
        });
        return;
      }

      // Validar pizzas - deben tener al menos un sabor
      if (product.isPizza && pizzaConfiguration) {
        const selectedFlavors = selectedPizzaCustomizations.filter(
          (sc) =>
            sc.action === CustomizationActionEnum.ADD &&
            pizzaCustomizations.some(
              (pc) =>
                pc.id === sc.pizzaCustomizationId &&
                pc.type === CustomizationTypeEnum.FLAVOR,
            ),
        );

        const minFlavors = pizzaConfiguration.minFlavors || 1;
        if (selectedFlavors.length < minFlavors) {
          showSnackbar({
            message: `Debes seleccionar al menos ${minFlavors} ${minFlavors === 1 ? 'sabor' : 'sabores'} para tu pizza`,
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

    const increaseQuantity = useCallback(
      () => setQuantity((prev) => prev + 1),
      [],
    );
    const decreaseQuantity = useCallback(
      () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1)),
      [],
    );

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

    const selectedVariant = useMemo(
      () =>
        hasVariants && product
          ? product.variants.find(
              (variant: ProductVariant) => variant.id === selectedVariantId,
            )
          : undefined,
      [hasVariants, product, selectedVariantId],
    );

    if (!product || !visible) {
      return null;
    }

    const basePrice = selectedVariant
      ? Number(selectedVariant.price)
      : Number(product.price) || 0;
    const modifiersPrice = selectedModifiers.reduce(
      (sum, mod) => sum + Number(mod.price || 0),
      0,
    );
    const pizzaExtraCost = calculatePizzaExtraCost();
    const totalPrice = (basePrice + modifiersPrice + pizzaExtraCost) * quantity;

    if (!visible) {
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
              {product.hasVariants &&
                product.variants &&
                Array.isArray(product.variants) &&
                product.variants.length > 0 && (
                  <Card style={styles.sectionCard}>
                    <Card.Content>
                      <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Variantes</Text>
                        <View style={styles.chipContainer}>
                          {getFieldError('variant') && (
                            <Chip
                              mode="flat"
                              compact
                              style={styles.errorChip}
                              icon="alert-circle"
                              textStyle={styles.errorChipText}
                            >
                              {getFieldError('variant')}
                            </Chip>
                          )}
                          <Chip mode="flat" compact style={styles.requiredChip}>
                            Requerido
                          </Chip>
                        </View>
                      </View>
                      <RadioButton.Group
                        onValueChange={(value) => handleVariantSelect(value)}
                        value={selectedVariantId || ''}
                      >
                        {product.variants.map((variant: ProductVariant) => (
                          <Surface
                            key={variant.id}
                            style={[
                              styles.variantSurface,
                              selectedVariantId === variant.id &&
                                styles.variantSurfaceSelected,
                              !variant.isActive &&
                                styles.inactiveVariantSurface,
                            ]}
                            elevation={
                              selectedVariantId === variant.id &&
                              variant.isActive
                                ? 2
                                : 0
                            }
                          >
                            <TouchableRipple
                              onPress={() =>
                                variant.isActive &&
                                handleVariantSelect(variant.id)
                              }
                              disabled={!variant.isActive}
                              style={styles.variantTouchable}
                            >
                              <View style={styles.variantRow}>
                                <RadioButton
                                  value={variant.id}
                                  status={
                                    selectedVariantId === variant.id
                                      ? 'checked'
                                      : 'unchecked'
                                  }
                                  onPress={() =>
                                    variant.isActive &&
                                    handleVariantSelect(variant.id)
                                  }
                                  disabled={!variant.isActive}
                                />
                                <Text
                                  style={[
                                    styles.variantName,
                                    !variant.isActive && styles.inactiveText,
                                  ]}
                                >
                                  {variant.name}
                                  {!variant.isActive && ' (No disponible)'}
                                </Text>
                                <Text
                                  style={[
                                    styles.variantPrice,
                                    !variant.isActive && styles.inactiveText,
                                  ]}
                                >
                                  ${Number(variant.price).toFixed(2)}
                                </Text>
                              </View>
                            </TouchableRipple>
                          </Surface>
                        ))}
                      </RadioButton.Group>
                    </Card.Content>
                  </Card>
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
                  <Card key={group.id} style={styles.sectionCard}>
                    <Card.Content>
                      <View style={styles.sectionHeader}>
                        <View style={styles.groupTitleContainer}>
                          <Text style={styles.groupTitle}>{group.name}</Text>
                          <View style={styles.selectionInfo}>
                            {group.minSelections !== undefined &&
                              group.maxSelections !== undefined && (
                                <Text style={styles.selectionRules}>
                                  {(group.minSelections || 0) === 0 &&
                                  group.maxSelections === 1
                                    ? 'Hasta 1 opción'
                                    : (group.minSelections || 0) ===
                                        group.maxSelections
                                      ? `Elegir ${group.maxSelections}`
                                      : `${group.minSelections || 0}-${group.maxSelections} opciones`}
                                </Text>
                              )}
                            {group.allowMultipleSelections && (
                              <Text style={styles.selectedCount}>
                                (
                                {
                                  (selectedModifiersByGroup[group.id] || [])
                                    .length
                                }{' '}
                                seleccionadas)
                              </Text>
                            )}
                          </View>
                        </View>
                        <View style={styles.chipContainer}>
                          {getGroupError(group.id) && (
                            <Chip
                              mode="flat"
                              compact
                              style={styles.errorChip}
                              icon="alert-circle"
                              textStyle={styles.errorChipText}
                            >
                              {getGroupError(group.id)}
                            </Chip>
                          )}
                          <Chip
                            mode="flat"
                            compact
                            style={
                              group.isRequired
                                ? styles.requiredChip
                                : styles.optionalChip
                            }
                          >
                            {group.isRequired ? 'Requerido' : 'Opcional'}
                          </Chip>
                        </View>
                      </View>

                      {group.allowMultipleSelections ? (
                        <View style={styles.modifiersContainer}>
                          {Array.isArray(group.productModifiers) &&
                            group.productModifiers.map((modifier: Modifier) => {
                              const groupModifiers =
                                selectedModifiersByGroup[group.id] || [];
                              const isSelected = groupModifiers.some(
                                (mod) => mod.id === modifier.id,
                              );

                              return (
                                <Surface
                                  key={modifier.id}
                                  style={[
                                    styles.modifierSurface,
                                    isSelected &&
                                      styles.modifierSurfaceSelected,
                                    !modifier.isActive &&
                                      styles.inactiveModifierSurface,
                                  ]}
                                  elevation={
                                    isSelected && modifier.isActive ? 1 : 0
                                  }
                                >
                                  <TouchableRipple
                                    onPress={() =>
                                      modifier.isActive &&
                                      handleModifierToggle(modifier, group)
                                    }
                                    disabled={!modifier.isActive}
                                    style={styles.modifierTouchable}
                                  >
                                    <View style={styles.modifierRow}>
                                      <RadioButton
                                        value={modifier.id}
                                        status={
                                          isSelected ? 'checked' : 'unchecked'
                                        }
                                        disabled={!modifier.isActive}
                                        onPress={() =>
                                          modifier.isActive &&
                                          handleModifierToggle(modifier, group)
                                        }
                                      />
                                      <Text
                                        style={[
                                          styles.modifierName,
                                          !modifier.isActive &&
                                            styles.inactiveText,
                                        ]}
                                      >
                                        {modifier.name}
                                        {!modifier.isActive &&
                                          ' (No disponible)'}
                                      </Text>
                                      {Number(modifier.price) > 0 && (
                                        <Text
                                          style={[
                                            styles.modifierPrice,
                                            !modifier.isActive &&
                                              styles.inactiveText,
                                          ]}
                                        >
                                          +${Number(modifier.price).toFixed(2)}
                                        </Text>
                                      )}
                                    </View>
                                  </TouchableRipple>
                                </Surface>
                              );
                            })}
                        </View>
                      ) : (
                        <RadioButton.Group
                          onValueChange={(value) => {
                            const modifier = group.productModifiers?.find(
                              (m: Modifier) => m.id === value,
                            );
                            if (modifier) {
                              handleModifierToggle(modifier, group);
                            }
                          }}
                          value={
                            selectedModifiersByGroup[group.id]?.[0]?.id || ''
                          }
                        >
                          <View style={styles.modifiersContainer}>
                            {Array.isArray(group.productModifiers) &&
                              group.productModifiers.map(
                                (modifier: Modifier) => {
                                  const isSelected =
                                    selectedModifiersByGroup[group.id]?.[0]
                                      ?.id === modifier.id;

                                  return (
                                    <Surface
                                      key={modifier.id}
                                      style={[
                                        styles.modifierSurface,
                                        isSelected &&
                                          styles.modifierSurfaceSelected,
                                        !modifier.isActive &&
                                          styles.inactiveModifierSurface,
                                      ]}
                                      elevation={
                                        isSelected && modifier.isActive ? 1 : 0
                                      }
                                    >
                                      <TouchableRipple
                                        onPress={() =>
                                          modifier.isActive &&
                                          handleModifierToggle(modifier, group)
                                        }
                                        disabled={!modifier.isActive}
                                        style={styles.modifierTouchable}
                                      >
                                        <View style={styles.modifierRow}>
                                          <RadioButton
                                            value={modifier.id}
                                            status={
                                              isSelected
                                                ? 'checked'
                                                : 'unchecked'
                                            }
                                            disabled={!modifier.isActive}
                                            onPress={() =>
                                              modifier.isActive &&
                                              handleModifierToggle(
                                                modifier,
                                                group,
                                              )
                                            }
                                          />
                                          <Text
                                            style={[
                                              styles.modifierName,
                                              !modifier.isActive &&
                                                styles.inactiveText,
                                            ]}
                                          >
                                            {modifier.name}
                                            {!modifier.isActive &&
                                              ' (No disponible)'}
                                          </Text>
                                          {Number(modifier.price) > 0 && (
                                            <Text
                                              style={[
                                                styles.modifierPrice,
                                                !modifier.isActive &&
                                                  styles.inactiveText,
                                              ]}
                                            >
                                              +$
                                              {Number(modifier.price).toFixed(
                                                2,
                                              )}
                                            </Text>
                                          )}
                                        </View>
                                      </TouchableRipple>
                                    </Surface>
                                  );
                                },
                              )}
                          </View>
                        </RadioButton.Group>
                      )}
                    </Card.Content>
                  </Card>
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
    modifierGroup: {
      marginBottom: theme.spacing.s,
    },
    modifierGroupHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 2,
    },
    groupTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
    },
    groupDescription: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    requiredText: {
      fontSize: 12,
      color: theme.colors.error,
      fontWeight: '500',
    },
    optionalText: {
      fontSize: 12,
      color: theme.colors.primary,
      fontWeight: '500',
    },
    selectionRules: {
      fontSize: 10,
      color: theme.colors.onSurfaceVariant,
      marginBottom: theme.spacing.xs,
      fontStyle: 'italic',
    },
    selectionInfo: {
      marginTop: 2,
    },
    selectedCount: {
      fontSize: 12,
      color: theme.colors.primary,
      fontWeight: '500',
      marginTop: 2,
    },
    productImage: {
      height: 150,
      borderRadius: theme.roundness,
      marginBottom: theme.spacing.m,
    },
    imagePlaceholder: {
      backgroundColor: theme.colors.surfaceVariant,
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeholderText: {
      fontSize: 50,
      color: theme.colors.onSurfaceVariant,
    },
    scrollView: {
      flex: 1,
      padding: theme.spacing.m,
    },
    section: {
      marginBottom: theme.spacing.s,
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
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.m,
    },
    groupTitleContainer: {
      flex: 1,
    },
    requiredChip: {
      backgroundColor: theme.colors.errorContainer,
      marginLeft: theme.spacing.s,
    },
    optionalChip: {
      backgroundColor: theme.colors.secondaryContainer,
      marginLeft: theme.spacing.s,
    },
    chipContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    errorChip: {
      backgroundColor: theme.colors.errorContainer,
      marginRight: theme.spacing.xs,
    },
    // Estilos para variantes
    variantSurface: {
      marginBottom: theme.spacing.xs,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.surfaceVariant,
    },
    variantSurfaceSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryContainer,
    },
    variantTouchable: {
      padding: 0,
    },
    variantRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.s,
      paddingHorizontal: theme.spacing.xs,
    },
    variantName: {
      flex: 1,
      fontSize: 16,
      marginLeft: theme.spacing.xs,
      color: theme.colors.onSurface,
    },
    // Estilos para modificadores
    modifiersContainer: {
      marginTop: theme.spacing.xs,
    },
    modifierSurface: {
      marginBottom: theme.spacing.xs,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.surfaceVariant,
    },
    modifierSurfaceSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryContainer,
    },
    modifierTouchable: {
      padding: 0,
    },
    modifierRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.s,
      paddingHorizontal: theme.spacing.xs,
    },
    modifierName: {
      flex: 1,
      fontSize: 15,
      marginLeft: theme.spacing.xs,
      color: theme.colors.onSurface,
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
    optionContainer: {
      marginBottom: 2,
    },
    optionTouchable: {
      paddingVertical: 4,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 8,
    },
    optionContent: {
      // Contenedor solo para el título del modificador (Checkbox)
      flex: 1, // Ocupa el espacio restante
      justifyContent: 'center', // Centra verticalmente el texto si es necesario
      // Quitar justifyContent: 'space-between'
      // alignItems: "center", // Ya está en optionRow
      // paddingRight: 8, // No necesario si el precio está fuera
    },
    checkbox: {
      marginRight: 8,
    },
    optionDivider: {
      height: 1,
      backgroundColor: theme.colors.outlineVariant,
    },
    radioItem: {
      flex: 1,
      paddingVertical: 4,
    },
    modifierTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.onSurface, // Color estándar para texto
    },
    variantPrice: {
      // Estilo específico para precio de variante
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.onSurfaceVariant, // Color secundario consistente
      marginLeft: 'auto',
      marginRight: 8,
    },
    inactiveVariantSurface: {
      opacity: 0.6,
      backgroundColor: theme.colors.surfaceDisabled,
    },
    inactiveModifierSurface: {
      opacity: 0.6,
      backgroundColor: theme.colors.surfaceDisabled,
    },
    inactiveText: {
      color: theme.colors.onSurfaceDisabled,
      textDecorationLine: 'line-through',
    },
    modifierPrice: {
      // Estilo para precio de modificador (Checkbox y Radio)
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.onSurfaceVariant, // Color secundario consistente
      marginLeft: 'auto', // Empujar a la derecha
      paddingHorizontal: 8, // Añadir padding similar a variantPrice
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
    errorChipText: {
      fontSize: 12,
    },
  });

ProductCustomizationModal.displayName = 'ProductCustomizationModal';

export default ProductCustomizationModal;
