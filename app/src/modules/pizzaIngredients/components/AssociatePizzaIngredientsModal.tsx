import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  Modal,
  Portal,
  Text,
  Button,
  List,
  Checkbox,
  Surface,
  IconButton,
} from 'react-native-paper';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productsService } from '@/modules/menu/services/productsService';
import { Product } from '@/modules/menu/schema/products.schema';
import { PizzaIngredient } from '../types/pizzaIngredient.types';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import { useSnackbarStore } from '@/app/store/snackbarStore';
import ConfirmationModal from '@/app/components/common/ConfirmationModal';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  pizzaIngredients: PizzaIngredient[];
}

interface PizzaWithIngredients extends Product {
  selectedIngredients: Set<string>;
  expanded: boolean;
}

export default function AssociatePizzaIngredientsModal({
  visible,
  onDismiss,
  pizzaIngredients,
}: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  const [pizzaData, setPizzaData] = useState<Map<string, PizzaWithIngredients>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);

  // Query para obtener productos tipo pizza
  const { data: pizzaProducts, isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ['pizzaProducts'],
    queryFn: () => productsService.findAllPizzas(),
    enabled: visible,
  });

  // Query para obtener ingredientes de cada pizza
  const { data: ingredientsData, isLoading: isLoadingIngredients } = useQuery({
    queryKey: ['allPizzaIngredients', pizzaProducts?.map(p => p.id)],
    queryFn: async () => {
      if (!pizzaProducts) return {};
      const results: Record<string, PizzaIngredient[]> = {};
      
      await Promise.all(
        pizzaProducts.map(async (pizza) => {
          const ingredients = await productsService.getPizzaIngredients(pizza.id);
          results[pizza.id] = ingredients;
        })
      );
      
      return results;
    },
    enabled: !!pizzaProducts && pizzaProducts.length > 0,
  });

  // Mutation para actualizar ingredientes en masa
  const updateIngredientsMutation = useMutation({
    mutationFn: (updates: Array<{ productId: string; ingredientIds: string[] }>) => 
      productsService.bulkUpdatePizzaIngredients(updates),
    onSuccess: () => {
      showSnackbar({
        message: 'Ingredientes actualizados exitosamente',
        type: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['allPizzaIngredients'] });
      queryClient.invalidateQueries({ queryKey: ['productIngredients'] });
      setHasChanges(false); // Resetear el estado de cambios
      onDismiss(); // Cerrar directamente sin verificación
    },
    onError: (error: any) => {
      showSnackbar({
        message: error.message || 'Error al actualizar ingredientes',
        type: 'error',
      });
    },
  });

  // Inicializar datos de pizzas con sus ingredientes
  useEffect(() => {
    if (pizzaProducts && ingredientsData) {
      const newPizzaData = new Map<string, PizzaWithIngredients>();
      
      pizzaProducts.forEach((pizza) => {
        const pizzaIngredientIds = new Set(
          (ingredientsData[pizza.id] || []).map(ing => ing.id)
        );
        
        newPizzaData.set(pizza.id, {
          ...pizza,
          selectedIngredients: pizzaIngredientIds,
          expanded: false,
        });
      });
      
      setPizzaData(newPizzaData);
      setHasChanges(false);
    }
  }, [pizzaProducts, ingredientsData]);

  const handleToggleExpand = (pizzaId: string) => {
    setPizzaData(prev => {
      const newData = new Map(prev);
      const pizza = newData.get(pizzaId);
      if (pizza) {
        newData.set(pizzaId, {
          ...pizza,
          expanded: !pizza.expanded,
        });
      }
      return newData;
    });
  };

  const handleToggleIngredient = (pizzaId: string, ingredientId: string) => {
    setPizzaData(prev => {
      const newData = new Map(prev);
      const pizza = newData.get(pizzaId);
      if (pizza) {
        const newSelectedIngredients = new Set(pizza.selectedIngredients);
        if (newSelectedIngredients.has(ingredientId)) {
          newSelectedIngredients.delete(ingredientId);
        } else {
          newSelectedIngredients.add(ingredientId);
        }
        newData.set(pizzaId, {
          ...pizza,
          selectedIngredients: newSelectedIngredients,
        });
      }
      setHasChanges(true);
      return newData;
    });
  };

  const handleToggleAllIngredients = (pizzaId: string) => {
    setPizzaData(prev => {
      const newData = new Map(prev);
      const pizza = newData.get(pizzaId);
      if (pizza) {
        const allSelected = pizzaIngredients.every(ing => 
          pizza.selectedIngredients.has(ing.id)
        );
        
        newData.set(pizzaId, {
          ...pizza,
          selectedIngredients: allSelected 
            ? new Set() 
            : new Set(pizzaIngredients.map(ing => ing.id)),
        });
      }
      setHasChanges(true);
      return newData;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates = Array.from(pizzaData.entries()).map(([pizzaId, pizza]) => ({
        productId: pizzaId,
        ingredientIds: Array.from(pizza.selectedIngredients),
      }));
      
      await updateIngredientsMutation.mutateAsync(updates);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      setShowExitConfirmation(true);
    } else {
      setPizzaData(new Map());
      setHasChanges(false);
      onDismiss();
    }
  };

  const handleConfirmExit = () => {
    setShowExitConfirmation(false);
    setPizzaData(new Map());
    setHasChanges(false);
    onDismiss();
  };

  const renderPizzaItem = (pizzaId: string) => {
    const pizza = pizzaData.get(pizzaId);
    if (!pizza) return null;

    const allSelected = pizzaIngredients.every(ing => 
      pizza.selectedIngredients.has(ing.id)
    );
    const someSelected = pizzaIngredients.some(ing => 
      pizza.selectedIngredients.has(ing.id)
    );

    return (
      <Surface key={pizzaId} style={styles.pizzaCard} elevation={1}>
        <List.Item
          title={pizza.name}
          description={`${pizza.selectedIngredients.size} ingredientes seleccionados`}
          left={() => (
            <View style={styles.pizzaCheckbox}>
              <Checkbox
                status={allSelected ? 'checked' : someSelected ? 'indeterminate' : 'unchecked'}
                onPress={() => handleToggleAllIngredients(pizzaId)}
              />
            </View>
          )}
          right={() => (
            <IconButton
              icon={pizza.expanded ? 'chevron-up' : 'chevron-down'}
              size={24}
              onPress={() => handleToggleExpand(pizzaId)}
            />
          )}
          onPress={() => handleToggleExpand(pizzaId)}
          style={styles.pizzaHeader}
        />

        {pizza.expanded && (
          <View style={styles.ingredientsList}>
            {pizzaIngredients.map((ingredient) => (
              <View key={ingredient.id} style={styles.ingredientItem}>
                <Checkbox
                  status={pizza.selectedIngredients.has(ingredient.id) ? 'checked' : 'unchecked'}
                  onPress={() => handleToggleIngredient(pizzaId, ingredient.id)}
                />
                <Text 
                  style={styles.ingredientText}
                  onPress={() => handleToggleIngredient(pizzaId, ingredient.id)}
                >
                  {ingredient.name} (Valor: {ingredient.ingredientValue})
                </Text>
              </View>
            ))}
          </View>
        )}
      </Surface>
    );
  };

  const isLoading = isLoadingProducts || isLoadingIngredients;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleClose}
        contentContainerStyle={styles.modalSurface}
        dismissable={!isSaving}
      >
        <View style={styles.formContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text variant="titleMedium" style={styles.modalTitle}>
              Asociar Ingredientes a Pizzas
            </Text>
          </View>

          {isLoading ? (
            <View style={styles.centerLoader}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <>
              <ScrollView 
                contentContainerStyle={styles.scrollViewContent}
                showsVerticalScrollIndicator={false}
              >
                {Array.from(pizzaData.keys()).map(pizzaId => renderPizzaItem(pizzaId))}
              </ScrollView>

              {/* Footer con acciones */}
              <View style={styles.modalActions}>
                <Button 
                  mode="outlined" 
                  onPress={handleClose} 
                  disabled={isSaving}
                  style={styles.actionButton}
                >
                  Cancelar
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSave}
                  loading={isSaving}
                  disabled={isSaving || !hasChanges}
                  style={styles.actionButton}
                >
                  Guardar cambios
                </Button>
              </View>
            </>
          )}
        </View>
      </Modal>

      <ConfirmationModal
        visible={showExitConfirmation}
        title="Cambios sin guardar"
        message="¿Estás seguro de que quieres salir sin guardar los cambios?"
        confirmText="Salir"
        cancelText="Cancelar"
        confirmButtonColor={theme.colors.error}
        onConfirm={handleConfirmExit}
        onCancel={() => setShowExitConfirmation(false)}
        onDismiss={() => setShowExitConfirmation(false)}
      />
    </Portal>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    modalSurface: {
      padding: 0,
      margin: theme.spacing.l,
      borderRadius: theme.roundness * 2,
      elevation: 4,
      backgroundColor: theme.colors.background,
      maxHeight: '80%',
      minHeight: 400,
      overflow: 'hidden',
    },
    modalHeader: {
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.m,
      paddingHorizontal: theme.spacing.l,
    },
    formContainer: {
      flex: 1,
    },
    scrollViewContent: {
      padding: theme.spacing.l,
      paddingBottom: theme.spacing.xl,
    },
    modalTitle: {
      color: theme.colors.onPrimary,
      fontWeight: '700',
      textAlign: 'center',
    },
    centerLoader: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: theme.spacing.xl * 2,
    },
    pizzaCard: {
      marginBottom: theme.spacing.m,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surfaceVariant,
      overflow: 'hidden',
    },
    pizzaHeader: {
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
    },
    pizzaCheckbox: {
      justifyContent: 'center',
      marginLeft: theme.spacing.s,
    },
    ingredientsList: {
      paddingHorizontal: theme.spacing.l,
      paddingBottom: theme.spacing.m,
      backgroundColor: theme.colors.background,
    },
    ingredientItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.xs,
    },
    ingredientText: {
      flex: 1,
      marginLeft: theme.spacing.s,
      color: theme.colors.onSurface,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: theme.spacing.m,
      paddingHorizontal: theme.spacing.l,
      paddingVertical: theme.spacing.m,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.background,
    },
    actionButton: {
      minWidth: 100,
    },
  });