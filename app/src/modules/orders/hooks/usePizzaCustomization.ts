import { useState, useMemo, useCallback, useEffect } from 'react';
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
import type { FullMenuProduct as Product } from '../schema/orders.schema';
import type { CartItem } from '../utils/cartUtils';

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

interface UsePizzaCustomizationProps {
  product: Product;
  editingItem?: CartItem | null;
  visible: boolean;
}

export const usePizzaCustomization = ({
  product,
  editingItem,
  visible,
}: UsePizzaCustomizationProps) => {
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

  // Calcular costo extra de pizza
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

  // Función helper para filtrar ingredientes compatibles con el nuevo modo
  const filterCompatibleIngredients = useCallback(
    (
      customizations: SelectedPizzaCustomization[],
      targetMode: 'FULL' | 'HALVES',
    ): SelectedPizzaCustomization[] => {
      return customizations.filter((sc) => {
        // Mantener todas las customizations que no sean ingredientes
        const isIngredient = ingredients.some(
          (ing) => ing.id === sc.pizzaCustomizationId,
        );
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
            'FULL',
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
            targetMode,
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
            'HALVES',
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
    [
      selectedPizzaCustomizations,
      flavors,
      manualHalvesMode,
      filterCompatibleIngredients,
    ],
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

  // Efecto para inicializar datos de pizza
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

  return {
    // Estados
    pizzaCustomizations,
    pizzaConfiguration,
    selectedPizzaCustomizations,
    manualHalvesMode,
    expandedIngredients,
    expandedFlavors,

    // Estados computados
    flavors,
    ingredients,
    selectedFlavors,
    showHalvesMode,

    // Funciones
    getFlavorName,
    calculatePizzaExtraCost,
    handleFlavorToggle,
    toggleIngredient,
    isIngredientSelected,
    handleManualHalvesModeToggle,
    toggleExpandedFlavors,
    toggleExpandedIngredients,
    setSelectedPizzaCustomizations,

    // Constantes
    PIZZA_HALF,
    CUSTOMIZATION_ACTION,
  };
};
