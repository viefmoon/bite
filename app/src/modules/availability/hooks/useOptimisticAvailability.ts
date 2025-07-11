import { useMutation, useQueryClient } from '@tanstack/react-query';
import { availabilityService } from '../services/availabilityService';
import { useSnackbarStore } from '@/app/store/snackbarStore';
import { 
  CategoryAvailability, 
  SubcategoryAvailability, 
  ProductAvailability,
  ModifierGroupAvailability,
  ModifierAvailability,
  PizzaCustomizationGroupAvailability,
  AvailabilityUpdatePayload
} from '../types/availability.types';

export const useOptimisticAvailability = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  const updateOptimistically = (type: string, id: string, isActive: boolean, cascade?: boolean) => {
    const menuQueryKey = ['availability', 'menu'];
    const modifierQueryKey = ['availability', 'modifierGroups'];
    const pizzaQueryKey = ['availability', 'pizzaCustomizations'];

    // Función para actualizar categorías optimisticamente
    const updateMenuOptimistically = (oldData: CategoryAvailability[]) => {
      if (!oldData) return oldData;

      return oldData.map(category => {
        if (type === 'category' && category.id === id) {
          const updated = { ...category, isActive };
          if (cascade) {
            return {
              ...updated,
              subcategories: updated.subcategories.map(sub => ({
                ...sub,
                isActive,
                products: sub.products.map(prod => ({ ...prod, isActive }))
              }))
            };
          }
          return updated;
        }

        if (type === 'subcategory') {
          const updatedSubcategories = category.subcategories.map(sub => {
            if (sub.id === id) {
              const updated = { ...sub, isActive };
              if (cascade) {
                return {
                  ...updated,
                  products: updated.products.map(prod => ({ ...prod, isActive }))
                };
              }
              return updated;
            }
            return sub;
          });

          return { ...category, subcategories: updatedSubcategories };
        }

        if (type === 'product') {
          const updatedSubcategories = category.subcategories.map(sub => ({
            ...sub,
            products: sub.products.map(prod => 
              prod.id === id ? { ...prod, isActive } : prod
            )
          }));

          return { ...category, subcategories: updatedSubcategories };
        }

        return category;
      });
    };

    // Función para actualizar grupos de modificadores optimisticamente
    const updateModifierGroupsOptimistically = (oldData: ModifierGroupAvailability[]) => {
      if (!oldData) return oldData;

      return oldData.map(group => {
        if (type === 'modifierGroup' && group.id === id) {
          const updated = { ...group, isActive };
          if (cascade) {
            return {
              ...updated,
              modifiers: updated.modifiers.map(mod => ({ ...mod, isActive }))
            };
          }
          return updated;
        }

        if (type === 'modifier') {
          const updatedModifiers = group.modifiers.map(mod => 
            mod.id === id ? { ...mod, isActive } : mod
          );
          return { ...group, modifiers: updatedModifiers };
        }

        return group;
      });
    };

    // Función para actualizar pizza customizations optimisticamente
    const updatePizzaCustomizationsOptimistically = (oldData: PizzaCustomizationGroupAvailability[]) => {
      if (!oldData) return oldData;

      return oldData.map(group => ({
        ...group,
        items: group.items.map(item => 
          item.id === id ? { ...item, isActive } : item
        )
      }));
    };

    // Actualizar el cache optimisticamente
    if (type === 'category' || type === 'subcategory' || type === 'product') {
      queryClient.setQueryData(menuQueryKey, updateMenuOptimistically);
    } else if (type === 'modifierGroup' || type === 'modifier') {
      queryClient.setQueryData(modifierQueryKey, updateModifierGroupsOptimistically);
    } else if (type === 'pizzaCustomization') {
      queryClient.setQueryData(pizzaQueryKey, updatePizzaCustomizationsOptimistically);
    }
  };

  const mutation = useMutation({
    mutationFn: availabilityService.updateAvailability,
    onMutate: async (variables: AvailabilityUpdatePayload) => {
      // Cancelar cualquier refetch pendiente
      await queryClient.cancelQueries({ queryKey: ['availability'] });

      // Guardar estado previo para rollback
      const previousMenuData = queryClient.getQueryData(['availability', 'menu']);
      const previousModifierData = queryClient.getQueryData(['availability', 'modifierGroups']);
      const previousPizzaData = queryClient.getQueryData(['availability', 'pizzaCustomizations']);

      // Actualizar optimisticamente
      updateOptimistically(variables.type, variables.id, variables.isActive, variables.cascade);

      // Retornar contexto para rollback
      return { 
        previousMenuData, 
        previousModifierData,
        previousPizzaData,
        variables 
      };
    },
    onSuccess: () => {
      showSnackbar({ message: 'Disponibilidad actualizada', type: 'success' });
    },
    onError: (error, variables, context) => {
      // Revertir cambios optimistas
      if (context?.previousMenuData) {
        queryClient.setQueryData(['availability', 'menu'], context.previousMenuData);
      }
      if (context?.previousModifierData) {
        queryClient.setQueryData(['availability', 'modifierGroups'], context.previousModifierData);
      }
      if (context?.previousPizzaData) {
        queryClient.setQueryData(['availability', 'pizzaCustomizations'], context.previousPizzaData);
      }
      
      showSnackbar({
        message: 'Error al actualizar disponibilidad',
        type: 'error',
      });
    },
    onSettled: () => {
      // Invalidar y refetch para asegurar sincronización
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    }
  });

  return mutation;
};