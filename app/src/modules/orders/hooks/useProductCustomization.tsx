import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useSnackbarStore } from '@/app/stores/snackbarStore';
import { useProductValidation } from './useProductValidation';
import type {
  FullMenuProduct as Product,
  Modifier,
  FullMenuModifierGroup,
} from '../schema/orders.schema';
import type { CartItemModifier, CartItem } from '../utils/cartUtils';
import type {
  SelectedPizzaCustomization,
  PizzaCustomization,
} from '../../pizzaCustomizations/schema/pizzaCustomization.schema';
import type { PizzaConfiguration } from '@/modules/pizzaCustomizations/schema/pizzaConfiguration.schema';
import {
  PizzaHalfEnum,
  CustomizationActionEnum,
} from '@/modules/pizzaCustomizations/schema/pizzaCustomization.schema';

interface NotesFormData {
  preparationNotes: string;
}

interface UseProductCustomizationProps {
  product: Product;
  editingItem?: CartItem | null;
  visible: boolean;
}

export const useProductCustomization = ({
  product,
  editingItem,
  visible,
}: UseProductCustomizationProps) => {
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  // Formulario para notas de preparación
  const { control, reset, watch } = useForm<NotesFormData>({
    defaultValues: { preparationNotes: '' },
  });
  const watchedPreparationNotes = watch('preparationNotes');

  // Estados principales
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

  const [quantity, setQuantity] = useState(1);
  const [hasChanges, setHasChanges] = useState(false);

  // Estados para pizzas
  const [pizzaCustomizations, setPizzaCustomizations] = useState<
    PizzaCustomization[]
  >([]);
  const [pizzaConfiguration, setPizzaConfiguration] =
    useState<PizzaConfiguration | null>(null);
  const [selectedPizzaCustomizations, setSelectedPizzaCustomizations] =
    useState<SelectedPizzaCustomization[]>([]);

  // Modificadores seleccionados calculados
  const selectedModifiers = useMemo(() => {
    return Object.values(selectedModifiersByGroup).flat();
  }, [selectedModifiersByGroup]);

  const hasVariants = useMemo(
    () =>
      product?.variants &&
      Array.isArray(product.variants) &&
      product.variants.length > 0,
    [product?.variants],
  );
  const { isValid, getFieldError, getGroupError } = useProductValidation({
    product,
    selectedVariantId,
    selectedModifiersByGroup,
    selectedPizzaCustomizations,
    pizzaCustomizations,
    pizzaConfiguration,
  });
  const calculatePizzaExtraCost = useCallback(() => {
    if (!product?.isPizza || !pizzaConfiguration) return 0;

    let totalToppingValue = 0;
    const addedCustomizations = selectedPizzaCustomizations.filter(
      (c) => c.action === CustomizationActionEnum.ADD,
    );

    for (const selected of addedCustomizations) {
      const customization = pizzaCustomizations.find(
        (c) => c.id === selected.pizzaCustomizationId,
      );
      if (!customization) continue;

      if (selected.half === PizzaHalfEnum.FULL) {
        totalToppingValue += customization.toppingValue;
      } else {
        totalToppingValue += customization.toppingValue / 2;
      }
    }

    if (totalToppingValue > pizzaConfiguration.includedToppings) {
      const extraToppings =
        totalToppingValue - pizzaConfiguration.includedToppings;
      return extraToppings * (pizzaConfiguration.extraToppingCost || 0);
    }

    return 0;
  }, [
    product?.isPizza,
    pizzaConfiguration,
    selectedPizzaCustomizations,
    pizzaCustomizations,
  ]);
  const checkForChanges = useCallback(() => {
    if (!editingItem) return false;

    if (quantity !== editingItem.quantity) return true;
    if (selectedVariantId !== editingItem.variantId) return true;
    if (watchedPreparationNotes !== (editingItem.preparationNotes || ''))
      return true;
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
  const handleVariantSelect = useCallback((variantId: string) => {
    setSelectedVariantId(variantId);
  }, []);
  const handleModifierToggle = useCallback(
    (modifier: Modifier, group: FullMenuModifierGroup) => {
      const currentGroupModifiers = selectedModifiersByGroup[group.id] || [];
      const isSelected = currentGroupModifiers.some(
        (mod) => mod.id === modifier.id,
      );

      const updatedModifiersByGroup = { ...selectedModifiersByGroup };

      if (isSelected) {
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
          price: modifier.price || 0,
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
    },
    [selectedModifiersByGroup, showSnackbar],
  );
  const increaseQuantity = useCallback(
    () => setQuantity((prev) => prev + 1),
    [],
  );

  const decreaseQuantity = useCallback(
    () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1)),
    [],
  );
  const selectedVariant = useMemo(
    () =>
      hasVariants && product && product.variants
        ? product.variants.find((variant) => variant.id === selectedVariantId)
        : undefined,
    [hasVariants, product, selectedVariantId],
  );

  const basePrice = selectedVariant
    ? selectedVariant.price
    : product?.price || 0;

  const modifiersPrice = selectedModifiers.reduce(
    (sum, mod) => sum + (mod.price || 0),
    0,
  );

  const pizzaExtraCost = calculatePizzaExtraCost();
  const totalPrice = (basePrice + modifiersPrice + pizzaExtraCost) * quantity;
  useEffect(() => {
    if (!product) return;

    if (editingItem) {
      setSelectedVariantId(editingItem.variantId);
      setQuantity(editingItem.quantity);
      reset({ preparationNotes: editingItem.preparationNotes || '' });
      const modifiersByGroup: Record<string, CartItemModifier[]> = {};
      if (editingItem.modifiers && product.modifierGroups) {
        editingItem.modifiers.forEach((mod) => {
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
      if (
        product.variants &&
        Array.isArray(product.variants) &&
        product.variants.length > 0
      ) {
        setSelectedVariantId(product.variants[0].id);
      } else {
        setSelectedVariantId(undefined);
      }
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
                  price: modifier.price || 0,
                });
              }
            });
          }

          if (defaultModifiers.length > 0) {
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
  useEffect(() => {
    if (!product || !visible) return;
    if (product?.isPizza) {
      if (product.pizzaConfiguration) {
        setPizzaConfiguration(product.pizzaConfiguration);
      }
      if (product.pizzaCustomizations) {
        setPizzaCustomizations(product.pizzaCustomizations);
      }
      if (editingItem && editingItem.selectedPizzaCustomizations) {
        setSelectedPizzaCustomizations(editingItem.selectedPizzaCustomizations);
      }
    }
  }, [product, visible, editingItem]);
  useEffect(() => {
    if (editingItem) {
      setHasChanges(checkForChanges());
    }
  }, [editingItem, checkForChanges]);

  return {
    selectedVariantId,
    selectedModifiersByGroup,
    selectedModifiers,
    quantity,
    hasChanges,
    pizzaCustomizations,
    pizzaConfiguration,
    selectedPizzaCustomizations,
    hasVariants,
    selectedVariant,
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
    calculatePizzaExtraCost,
    checkForChanges,
  };
};
