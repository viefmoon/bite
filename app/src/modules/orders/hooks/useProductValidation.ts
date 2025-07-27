import { useMemo } from 'react';
import { Product } from '../schema/orders.schema';
import { CartItemModifier } from '../stores/useOrderStore';
import { SelectedPizzaCustomization } from '@/app/schemas/domain/order.schema';
import {
  PizzaCustomization,
  CustomizationActionEnum,
} from '@/modules/pizzaCustomizations/schema/pizzaCustomization.schema';
import { PizzaConfiguration } from '@/modules/pizzaCustomizations/schema/pizzaConfiguration.schema';

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
  pizzaCustomizations: _pizzaCustomizations,
  pizzaConfiguration,
}: UseProductValidationProps) => {
  const validationErrors = useMemo(() => {
    const errors: ValidationError[] = [];

    // Validar variantes requeridas
    const hasVariants =
      product?.variants &&
      Array.isArray(product.variants) &&
      product.variants.length > 0;

    if (hasVariants && !selectedVariantId) {
      errors.push({
        field: 'variant',
        message: 'Selecciona una variante',
      });
    }

    // Validar pizzas - deben tener al menos un sabor o ingrediente
    if (product.isPizza && pizzaConfiguration) {
      const addedCustomizations = selectedPizzaCustomizations.filter(
        (sc) => sc.action === CustomizationActionEnum.ADD,
      );

      // Verificar elementos en cada mitad (lógica igual que en handleAddToCart)
      const fullPizzaElements = addedCustomizations.filter(
        (sc) => sc.half === 'FULL',
      );

      const half1Elements = addedCustomizations.filter(
        (sc) => sc.half === 'HALF_1',
      );

      const half2Elements = addedCustomizations.filter(
        (sc) => sc.half === 'HALF_2',
      );

      // Si hay elementos en pizza completa, es válido
      if (fullPizzaElements.length > 0) {
        // La pizza completa cubre ambas mitades - no hay errores
      } else {
        // Si no hay elementos en pizza completa, verificar que ambas mitades tengan al menos un elemento
        if (half1Elements.length === 0 && half2Elements.length === 0) {
          // Si no hay nada en ninguna parte
          errors.push({
            field: 'pizza',
            message: 'La pizza debe tener al menos un sabor o ingrediente',
          });
        } else {
          // Si hay elementos pero alguna mitad está vacía
          if (half1Elements.length === 0) {
            errors.push({
              field: 'pizza',
              message:
                'La primera mitad de la pizza debe tener al menos un sabor o ingrediente',
            });
          }

          if (half2Elements.length === 0) {
            errors.push({
              field: 'pizza',
              message:
                'La segunda mitad de la pizza debe tener al menos un sabor o ingrediente',
            });
          }
        }
      }
    }

    // Validar grupos de modificadores
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
            const message =
              minRequired === 1
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
