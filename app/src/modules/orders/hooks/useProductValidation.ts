import { useMemo } from 'react';
import { Product, FullMenuModifierGroup } from '../types/orders.types';
import { CartItemModifier } from '../stores/useOrderCreationStore';
import { SelectedPizzaCustomization } from '@/app/schemas/domain/order.schema';
import { 
  PizzaCustomization, 
  PizzaConfiguration,
  CustomizationType,
  CustomizationAction
} from '@/modules/pizzaCustomizations/types/pizzaCustomization.types';

interface ValidationError {
  field: string;
  message: string;
}

interface UseProductValidationProps {
  product: Product;
  selectedVariantId?: string;
  selectedModifiersByGroup: Record<string, CartItemModifier[]>;
  selectedPizzaCustomizations: SelectedPizzaCustomization[];
  pizzaCustomizations: PizzaCustomization[];
  pizzaConfiguration: PizzaConfiguration | null;
}

export const useProductValidation = ({
  product,
  selectedVariantId,
  selectedModifiersByGroup,
  selectedPizzaCustomizations,
  pizzaCustomizations,
  pizzaConfiguration,
}: UseProductValidationProps) => {
  const validationErrors = useMemo(() => {
    const errors: ValidationError[] = [];

    // Validar variantes requeridas
    const hasVariants = product?.variants && 
      Array.isArray(product.variants) && 
      product.variants.length > 0;

    if (hasVariants && !selectedVariantId) {
      errors.push({
        field: 'variant',
        message: 'Selecciona una variante',
      });
    }

    // Validar pizzas - deben tener al menos un sabor
    if (product.isPizza && pizzaConfiguration) {
      const selectedFlavors = selectedPizzaCustomizations.filter(
        (sc) =>
          sc.action === CustomizationAction.ADD &&
          pizzaCustomizations.some(
            (pc) =>
              pc.id === sc.pizzaCustomizationId &&
              pc.type === CustomizationType.FLAVOR
          ),
      );

      const minFlavors = pizzaConfiguration.minFlavors || 1;
      if (selectedFlavors.length < minFlavors) {
        errors.push({
          field: 'pizza',
          message: `Selecciona al menos ${minFlavors} ${minFlavors === 1 ? 'sabor' : 'sabores'}`,
        });
      }
    }

    // Validar grupos de modificadores
    if (product.modifierGroups) {
      for (const group of product.modifierGroups) {
        const selectedInGroup = selectedModifiersByGroup[group.id] || [];
        const selectedCount = selectedInGroup.length;

        // Validar grupos requeridos y mínimo de selecciones
        if (group.isRequired || (group.minSelections && group.minSelections > 0)) {
          const minRequired = Math.max(
            group.minSelections || 0,
            group.isRequired ? 1 : 0,
          );

          if (selectedCount < minRequired) {
            const message = minRequired === 1
              ? `Selecciona una opción`
              : `Selecciona al menos ${minRequired} opciones`;
            
            errors.push({
              field: `modifier_${group.id}`,
              message,
            });
          }
        }

        // Validar máximo de selecciones
        if (group.maxSelections && selectedCount > group.maxSelections) {
          errors.push({
            field: `modifier_${group.id}`,
            message: `Máximo ${group.maxSelections} ${group.maxSelections === 1 ? 'opción' : 'opciones'}`,
          });
        }
      }
    }

    return errors;
  }, [
    product,
    selectedVariantId,
    selectedModifiersByGroup,
    selectedPizzaCustomizations,
    pizzaCustomizations,
    pizzaConfiguration,
  ]);

  const isValid = validationErrors.length === 0;

  const getFieldError = (field: string): string | undefined => {
    const error = validationErrors.find((e) => e.field === field);
    return error?.message;
  };

  const getGroupError = (groupId: string): string | undefined => {
    return getFieldError(`modifier_${groupId}`);
  };

  return {
    validationErrors,
    isValid,
    getFieldError,
    getGroupError,
  };
};