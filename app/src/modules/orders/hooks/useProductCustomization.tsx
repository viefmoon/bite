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
import {
  type SelectedPizzaCustomization,
  type PizzaCustomization,
  type PizzaCustomizationInput,
  PizzaHalfEnum,
  CustomizationActionEnum,
  CustomizationTypeEnum,
  type PizzaHalf,
} from '../../pizzaCustomizations/schema/pizzaCustomization.schema';
import type { PizzaConfiguration } from '@/modules/pizzaCustomizations/schema/pizzaConfiguration.schema';

// Constantes para los valores de pizza
const PIZZA_HALF = {
  FULL: PizzaHalfEnum.FULL,
  HALF_1: PizzaHalfEnum.HALF_1,
  HALF_2: PizzaHalfEnum.HALF_2,
} as const;

const CUSTOMIZATION_ACTION = {
  ADD: CustomizationActionEnum.ADD,
  REMOVE: CustomizationActionEnum.REMOVE,
} as const;

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
  const [manualHalvesMode, setManualHalvesMode] = useState(false);
  const [expandedIngredients, setExpandedIngredients] = useState<{
    [PizzaHalfEnum.FULL]: boolean;
    [PizzaHalfEnum.HALF_1]: boolean;
    [PizzaHalfEnum.HALF_2]: boolean;
  }>({
    [PizzaHalfEnum.FULL]: false,
    [PizzaHalfEnum.HALF_1]: false,
    [PizzaHalfEnum.HALF_2]: false,
  });
  const [expandedFlavors, setExpandedFlavors] = useState(true);

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
  const { isValid, getFieldError, getGroupError, validationErrors } =
    useProductValidation({
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

  // Separar sabores e ingredientes
  const flavors = useMemo(
    () =>
      pizzaCustomizations.filter(
        (c) => c.type === CustomizationTypeEnum.FLAVOR,
      ),
    [pizzaCustomizations],
  );

  const ingredients = useMemo(
    () =>
      pizzaCustomizations.filter(
        (c) => c.type === CustomizationTypeEnum.INGREDIENT,
      ),
    [pizzaCustomizations],
  );

  // Obtener sabores seleccionados
  const selectedFlavors = useMemo(
    () =>
      selectedPizzaCustomizations.filter(
        (sc) =>
          sc.action === CUSTOMIZATION_ACTION.ADD &&
          flavors.some((f) => f.id === sc.pizzaCustomizationId),
      ),
    [selectedPizzaCustomizations, flavors],
  );

  // Obtener el nombre del sabor por ID
  const getFlavorName = useCallback(
    (flavorId: string) => {
      const flavor = flavors.find((f) => f.id === flavorId);
      return flavor?.name || '';
    },
    [flavors],
  );

  // Determinar si mostrar modo mitades
  const showHalvesMode = useMemo(
    () =>
      selectedFlavors.length === 2 ||
      (manualHalvesMode && selectedFlavors.length <= 1),
    [selectedFlavors.length, manualHalvesMode],
  );
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
          if (
            !group.maxSelections ||
            currentGroupModifiers.length < group.maxSelections
          ) {
            updatedModifiersByGroup[group.id] = [
              ...currentGroupModifiers,
              newModifier,
            ];
          } else {
            showSnackbar({
              message: `Solo puedes seleccionar hasta ${group.maxSelections} opciones en ${group.name}`,
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

  // Función helper para filtrar ingredientes compatibles con el nuevo modo
  const filterCompatibleIngredients = useCallback(
    (
      customizations: SelectedPizzaCustomization[],
      targetMode: 'FULL' | 'HALVES',
    ): SelectedPizzaCustomization[] => {
      return customizations.filter((sc) => {
        // Mantener todas las customizations que no sean ingredientes
        const isIngredient = ingredients.some((ing) => ing.id === sc.pizzaCustomizationId);
        if (!isIngredient) return true;

        // Para ingredientes, filtrar según compatibilidad
        if (targetMode === 'FULL') {
          // En modo FULL, solo mantener ingredientes FULL
          return sc.half === PIZZA_HALF.FULL;
        } else {
          // En modo HALVES, solo mantener ingredientes de mitades específicas
          return sc.half === PIZZA_HALF.HALF_1 || sc.half === PIZZA_HALF.HALF_2;
        }
      });
    },
    [ingredients],
  );

  // Lógica de manejo de sabores
  const handleFlavorToggle = useCallback(
    (flavorId: string) => {
      const isSelected = selectedPizzaCustomizations.some(
        (sc) =>
          sc.pizzaCustomizationId === flavorId &&
          sc.action === CUSTOMIZATION_ACTION.ADD,
      );

      if (isSelected) {
        // Deseleccionar
        const remainingFlavorSelections = selectedPizzaCustomizations.filter(
          (sc) =>
            !(
              sc.pizzaCustomizationId === flavorId &&
              sc.action === CUSTOMIZATION_ACTION.ADD
            ),
        );

        // Si queda solo un sabor después de deseleccionar, cambiar su half a FULL
        const remainingFlavors = remainingFlavorSelections.filter(
          (sc) =>
            sc.action === CUSTOMIZATION_ACTION.ADD &&
            flavors.some((f) => f.id === sc.pizzaCustomizationId),
        );

        if (remainingFlavors.length === 1) {
          const otherFlavorId = remainingFlavors[0].pizzaCustomizationId;
          
          // Filtrar ingredientes compatibles con el modo FULL
          const compatibleCustomizations = filterCompatibleIngredients(
            remainingFlavorSelections,
            'FULL'
          );

          const nonFlavorSelections = compatibleCustomizations.filter(
            (sc) =>
              !flavors.some((f) => f.id === sc.pizzaCustomizationId) ||
              sc.action !== CUSTOMIZATION_ACTION.ADD,
          );

          const newCustomizations = [
            ...nonFlavorSelections,
            {
              pizzaCustomizationId: otherFlavorId,
              half: PIZZA_HALF.FULL,
              action: CUSTOMIZATION_ACTION.ADD,
            } as PizzaCustomizationInput,
          ];
          setSelectedPizzaCustomizations(
            newCustomizations as SelectedPizzaCustomization[],
          );
        } else {
          setSelectedPizzaCustomizations(remainingFlavorSelections);
        }
      } else {
        // Seleccionar
        const currentFlavors = selectedPizzaCustomizations.filter(
          (sc) =>
            sc.action === CUSTOMIZATION_ACTION.ADD &&
            flavors.some((f) => f.id === sc.pizzaCustomizationId),
        );

        if (currentFlavors.length >= 2) {
          return; // No permitir más de 2
        }

        if (currentFlavors.length === 0) {
          // Primer sabor - va completo o a mitad 1 si está el modo manual
          const targetMode = manualHalvesMode ? 'HALVES' : 'FULL';
          const compatibleCustomizations = filterCompatibleIngredients(
            selectedPizzaCustomizations,
            targetMode
          );

          const nonFlavorSelections = compatibleCustomizations.filter(
            (sc) =>
              !flavors.some((f) => f.id === sc.pizzaCustomizationId) ||
              sc.action !== CUSTOMIZATION_ACTION.ADD,
          );

          if (manualHalvesMode) {
            const newCustomizations = [
              ...nonFlavorSelections,
              {
                pizzaCustomizationId: flavorId,
                half: PIZZA_HALF.HALF_1,
                action: CUSTOMIZATION_ACTION.ADD,
              } as PizzaCustomizationInput,
            ];
            setSelectedPizzaCustomizations(
              newCustomizations as SelectedPizzaCustomization[],
            );
          } else {
            const newCustomizations = [
              ...nonFlavorSelections,
              {
                pizzaCustomizationId: flavorId,
                half: PIZZA_HALF.FULL,
                action: CUSTOMIZATION_ACTION.ADD,
              } as PizzaCustomizationInput,
            ];
            setSelectedPizzaCustomizations(
              newCustomizations as SelectedPizzaCustomization[],
            );
          }
        } else if (currentFlavors.length === 1) {
          // Segundo sabor - convertir a mitades
          const existingFlavor = currentFlavors[0];

          // Filtrar ingredientes compatibles con el modo HALVES
          const compatibleCustomizations = filterCompatibleIngredients(
            selectedPizzaCustomizations,
            'HALVES'
          );

          const nonFlavorSelections = compatibleCustomizations.filter(
            (sc) =>
              !flavors.some((f) => f.id === sc.pizzaCustomizationId) ||
              sc.action !== CUSTOMIZATION_ACTION.ADD,
          );

          // Crear las nuevas customizaciones como mitades
          const newCustomizations = [
            ...nonFlavorSelections,
            {
              pizzaCustomizationId: existingFlavor.pizzaCustomizationId,
              half: PIZZA_HALF.HALF_1,
              action: CUSTOMIZATION_ACTION.ADD,
            } as PizzaCustomizationInput,
            {
              pizzaCustomizationId: flavorId,
              half: PIZZA_HALF.HALF_2,
              action: CUSTOMIZATION_ACTION.ADD,
            } as PizzaCustomizationInput,
          ];

          setSelectedPizzaCustomizations(
            newCustomizations as SelectedPizzaCustomization[],
          );
        }
      }
    },
    [selectedPizzaCustomizations, flavors, manualHalvesMode, filterCompatibleIngredients],
  );

  // Lógica de manejo de ingredientes
  const toggleIngredient = useCallback(
    (
      ingredientId: string,
      half: (typeof PIZZA_HALF)[keyof typeof PIZZA_HALF],
      action: (typeof CUSTOMIZATION_ACTION)[keyof typeof CUSTOMIZATION_ACTION],
    ) => {
      const existingIndex = selectedPizzaCustomizations.findIndex(
        (sc) =>
          sc.pizzaCustomizationId === ingredientId &&
          sc.half === half &&
          sc.action === action,
      );

      let newSelections: SelectedPizzaCustomization[];

      if (existingIndex >= 0) {
        newSelections = selectedPizzaCustomizations.filter(
          (_, index) => index !== existingIndex,
        );
      } else {
        // Remover cualquier acción previa del mismo ingrediente en la misma mitad
        newSelections = selectedPizzaCustomizations.filter(
          (sc) =>
            !(sc.pizzaCustomizationId === ingredientId && sc.half === half),
        );

        const newCustomization = {
          pizzaCustomizationId: ingredientId,
          half,
          action,
        } as PizzaCustomizationInput;

        newSelections.push(newCustomization as SelectedPizzaCustomization);
      }

      setSelectedPizzaCustomizations(newSelections);
    },
    [selectedPizzaCustomizations],
  );

  // Verificar si un ingrediente está seleccionado
  const isIngredientSelected = useCallback(
    (
      ingredientId: string,
      half: (typeof PIZZA_HALF)[keyof typeof PIZZA_HALF],
      action: (typeof CUSTOMIZATION_ACTION)[keyof typeof CUSTOMIZATION_ACTION],
    ): boolean => {
      return selectedPizzaCustomizations.some(
        (sc) =>
          sc.pizzaCustomizationId === ingredientId &&
          sc.half === half &&
          sc.action === action,
      );
    },
    [selectedPizzaCustomizations],
  );

  // Manejo del modo mitades manual
  const handleManualHalvesModeToggle = useCallback(
    (value: boolean) => {
      setManualHalvesMode(value);

      // Si se activa el modo mitades, convertir las personalizaciones de FULL a HALF_1
      if (value && selectedFlavors.length <= 1) {
        const updatedCustomizations = selectedPizzaCustomizations.map((sc) => {
          if (sc.half === PIZZA_HALF.FULL) {
            return { ...sc, half: PIZZA_HALF.HALF_1 };
          }
          return sc;
        });
        setSelectedPizzaCustomizations(updatedCustomizations);
      }
      // Si se desactiva el modo mitades y solo hay un sabor, convertir todo a FULL
      else if (!value && selectedFlavors.length === 1) {
        const updatedCustomizations = selectedPizzaCustomizations.map((sc) => {
          if (sc.half === PIZZA_HALF.HALF_1 || sc.half === PIZZA_HALF.HALF_2) {
            return { ...sc, half: PIZZA_HALF.FULL };
          }
          return sc;
        });
        setSelectedPizzaCustomizations(updatedCustomizations);
      }
    },
    [selectedFlavors.length, selectedPizzaCustomizations],
  );

  // Funciones para manejo de estado de expansión
  const toggleExpandedFlavors = useCallback(() => {
    setExpandedFlavors((prev) => !prev);
  }, []);

  const toggleExpandedIngredients = useCallback((section: PizzaHalf) => {
    setExpandedIngredients((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);
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
              group.maxSelections ?? defaultModifiers.length;
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
      } else {
        // Inicializar con array vacío para pizza nueva
        setSelectedPizzaCustomizations([]);
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
    validationErrors,
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
    // Pizza-specific functions and state
    flavors,
    ingredients,
    selectedFlavors,
    getFlavorName,
    showHalvesMode,
    handleFlavorToggle,
    toggleIngredient,
    isIngredientSelected,
    manualHalvesMode,
    handleManualHalvesModeToggle,
    expandedIngredients,
    expandedFlavors,
    toggleExpandedFlavors,
    toggleExpandedIngredients,
    PIZZA_HALF,
    CUSTOMIZATION_ACTION,
  };
};
