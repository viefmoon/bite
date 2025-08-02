import { useState, useCallback, useEffect } from 'react';
import { useSnackbarStore } from '@/app/stores/snackbarStore';
import type {
  FullMenuProduct as Product,
  Modifier,
  FullMenuModifierGroup,
} from '../schema/orders.schema';
import type { CartItemModifier, CartItem } from '../utils/cartUtils';

interface UseModifierSelectionProps {
  product: Product;
  editingItem?: CartItem | null;
}

export const useModifierSelection = ({
  product,
  editingItem,
}: UseModifierSelectionProps) => {
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  const [selectedModifiersByGroup, setSelectedModifiersByGroup] = useState<
    Record<string, CartItemModifier[]>
  >({});

  // Calcular modificadores seleccionados
  const selectedModifiers = Object.values(selectedModifiersByGroup).flat();

  // Manejar toggle de modificadores
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

  // Inicializar modificadores desde item editado o valores por defecto
  useEffect(() => {
    if (!product) return;

    if (editingItem) {
      // Cargar modificadores del item editado
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
      // Cargar modificadores por defecto para nuevo producto
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
    }
  }, [product, editingItem]);

  return {
    selectedModifiersByGroup,
    selectedModifiers,
    handleModifierToggle,
    setSelectedModifiersByGroup,
  };
};
