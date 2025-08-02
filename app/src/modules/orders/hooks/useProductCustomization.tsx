import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useProductValidation } from './useProductValidation';
import { usePizzaCustomization } from './usePizzaCustomization';
import { useModifierSelection } from './useModifierSelection';
import { useProductPricing } from './useProductPricing';
import type {
  FullMenuProduct as Product,
} from '../schema/orders.schema';
import type { CartItem } from '../utils/cartUtils';

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

  const [quantity, setQuantity] = useState(1);
  const [hasChanges, setHasChanges] = useState(false);

  // Hooks especializados
  const pizzaCustomization = usePizzaCustomization({
    product,
    editingItem,
    visible,
  });

  const modifierSelection = useModifierSelection({
    product,
    editingItem,
  });

  const pricing = useProductPricing({
    product,
    selectedVariantId,
    selectedModifiers: modifierSelection.selectedModifiers,
    pizzaExtraCost: pizzaCustomization.calculatePizzaExtraCost(),
    quantity,
  });

  const { isValid, getFieldError, getGroupError, validationErrors } =
    useProductValidation({
      product,
      selectedVariantId,
      selectedModifiersByGroup: modifierSelection.selectedModifiersByGroup,
      selectedPizzaCustomizations:
        pizzaCustomization.selectedPizzaCustomizations,
      pizzaCustomizations: pizzaCustomization.pizzaCustomizations,
      pizzaConfiguration: pizzaCustomization.pizzaConfiguration,
    });

  // Verificar cambios en el item editado
  const checkForChanges = useCallback(() => {
    if (!editingItem) return false;

    if (quantity !== editingItem.quantity) return true;
    if (selectedVariantId !== editingItem.variantId) return true;
    if (watchedPreparationNotes !== (editingItem.preparationNotes || ''))
      return true;
    const currentModifierIds = modifierSelection.selectedModifiers
      .map((m) => m.id)
      .sort();
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
    modifierSelection.selectedModifiers,
  ]);

  // Handlers principales
  const handleVariantSelect = useCallback((variantId: string) => {
    setSelectedVariantId(variantId);
  }, []);

  const increaseQuantity = useCallback(
    () => setQuantity((prev) => prev + 1),
    [],
  );

  const decreaseQuantity = useCallback(
    () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1)),
    [],
  );

  // Inicializar datos del producto
  useEffect(() => {
    if (!product) return;

    if (editingItem) {
      setSelectedVariantId(editingItem.variantId);
      setQuantity(editingItem.quantity);
      reset({ preparationNotes: editingItem.preparationNotes || '' });
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
      setQuantity(1);
      reset({ preparationNotes: '' });
    }
  }, [product, editingItem, reset]);

  // Detectar cambios
  useEffect(() => {
    if (editingItem) {
      setHasChanges(checkForChanges());
    }
  }, [editingItem, checkForChanges]);

  return {
    // Estados básicos
    selectedVariantId,
    quantity,
    hasChanges,

    // Estados de modificadores (delegados)
    selectedModifiersByGroup: modifierSelection.selectedModifiersByGroup,
    selectedModifiers: modifierSelection.selectedModifiers,

    // Estados de pizza (delegados)
    pizzaCustomizations: pizzaCustomization.pizzaCustomizations,
    pizzaConfiguration: pizzaCustomization.pizzaConfiguration,
    selectedPizzaCustomizations: pizzaCustomization.selectedPizzaCustomizations,

    // Estados de precios (delegados)
    hasVariants: pricing.hasVariants,
    selectedVariant: pricing.selectedVariant,
    basePrice: pricing.basePrice,
    modifiersPrice: pricing.modifiersPrice,
    pizzaExtraCost: pizzaCustomization.calculatePizzaExtraCost(),
    totalPrice: pricing.totalPrice,

    // Validación
    isValid,
    validationErrors,
    getFieldError,
    getGroupError,

    // Handlers básicos
    handleVariantSelect,
    increaseQuantity,
    decreaseQuantity,

    // Handlers de modificadores (delegados)
    handleModifierToggle: modifierSelection.handleModifierToggle,

    // Estados y funciones de formulario
    control,
    watchedPreparationNotes,
    checkForChanges,

    // Funciones de pizza (delegadas)
    flavors: pizzaCustomization.flavors,
    ingredients: pizzaCustomization.ingredients,
    selectedFlavors: pizzaCustomization.selectedFlavors,
    getFlavorName: pizzaCustomization.getFlavorName,
    showHalvesMode: pizzaCustomization.showHalvesMode,
    handleFlavorToggle: pizzaCustomization.handleFlavorToggle,
    toggleIngredient: pizzaCustomization.toggleIngredient,
    isIngredientSelected: pizzaCustomization.isIngredientSelected,
    manualHalvesMode: pizzaCustomization.manualHalvesMode,
    handleManualHalvesModeToggle:
      pizzaCustomization.handleManualHalvesModeToggle,
    expandedIngredients: pizzaCustomization.expandedIngredients,
    expandedFlavors: pizzaCustomization.expandedFlavors,
    toggleExpandedFlavors: pizzaCustomization.toggleExpandedFlavors,
    toggleExpandedIngredients: pizzaCustomization.toggleExpandedIngredients,
    setSelectedPizzaCustomizations:
      pizzaCustomization.setSelectedPizzaCustomizations,

    // Constantes (delegadas)
    PIZZA_HALF: pizzaCustomization.PIZZA_HALF,
    CUSTOMIZATION_ACTION: pizzaCustomization.CUSTOMIZATION_ACTION,
  };
};
