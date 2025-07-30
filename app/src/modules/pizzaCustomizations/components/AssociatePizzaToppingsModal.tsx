import { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Text,
  Checkbox,
  Button,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productsService } from '@/modules/menu/services/productsService';
import { pizzaCustomizationsService } from '../services/pizzaCustomizationsService';
import { useSnackbarStore } from '@/app/stores/snackbarStore';
import { CustomizationTypeEnum } from '../schema/pizzaCustomization.schema';
import type { Product } from '@/app/schemas/domain/product.schema';
import { ResponsiveModal } from '@/app/components/responsive/ResponsiveModal';
import ConfirmationModal from '@/app/components/common/ConfirmationModal';

interface AssociatePizzaToppingsModalProps {
  visible: boolean;
  onDismiss: () => void;
  product: Product | null;
}

export function AssociatePizzaToppingsModal({
  visible,
  onDismiss,
  product,
}: AssociatePizzaToppingsModalProps) {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  const [selectedToppings, setSelectedToppings] = useState<Set<string>>(
    new Set(),
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [filterType, setFilterType] = useState<
    'all' | 'flavors' | 'ingredients'
  >('all');
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Query para obtener todos los toppings (sabores e ingredientes)
  const { data: allToppings, isLoading: isLoadingToppings } = useQuery({
    queryKey: ['pizza-toppings-modal'],
    queryFn: async () => {
      const response = await pizzaCustomizationsService.findAll({
        page: 1,
        limit: 100,
        isActive: true,
      });
      return response.data;
    },
    enabled: visible,
  });

  // Query para obtener los toppings asociados al producto
  const { data: associatedToppings, isLoading: isLoadingAssociated } = useQuery(
    {
      queryKey: ['product-pizza-toppings', product?.id],
      queryFn: async () => {
        if (!product?.id) return [];
        const result = await productsService.getPizzaCustomizations(product.id);
        return result || [];
      },
      enabled: !!product?.id && visible,
    },
  );

  // Inicializar selecciones cuando se cargan los datos
  useEffect(() => {
    if (associatedToppings && visible && product) {
      const associatedIds = new Set(associatedToppings.map((t) => t.id));
      setSelectedToppings(associatedIds);
      setHasChanges(false);
    }
  }, [associatedToppings, visible, product]);

  // Mutation para actualizar asociaciones
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!product) throw new Error('No hay producto seleccionado');

      await productsService.updatePizzaCustomizations(
        product.id,
        Array.from(selectedToppings),
      );
    },
    onSuccess: () => {
      showSnackbar({
        message: 'Sabores e ingredientes actualizados exitosamente',
        type: 'success',
      });
      queryClient.invalidateQueries({
        queryKey: ['product-pizza-toppings', product?.id],
      });
      queryClient.invalidateQueries({ queryKey: ['pizza-products'] });
      queryClient.invalidateQueries({ queryKey: ['pizza-configurations'] });
      setHasChanges(false);
      onDismiss();
    },
    onError: (error) => {
      showSnackbar({
        message: error instanceof Error ? error.message : 'Error al actualizar',
        type: 'error',
      });
    },
  });

  const toggleTopping = (toppingId: string) => {
    setSelectedToppings((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(toppingId)) {
        newSet.delete(toppingId);
      } else {
        newSet.add(toppingId);
      }
      return newSet;
    });
    setHasChanges(true);
  };

  const toggleAll = () => {
    if (!allToppings) return;

    if (selectedToppings.size === allToppings.length) {
      setSelectedToppings(new Set());
    } else {
      setSelectedToppings(new Set(allToppings.map((t) => t.id)));
    }
    setHasChanges(true);
  };

  const filteredToppings = useMemo(() => {
    if (!allToppings || !Array.isArray(allToppings)) {
      return {
        flavors: [],
        ingredients: [],
        displayFlavors: [],
        displayIngredients: [],
      };
    }

    const flavors = allToppings.filter(
      (t) => t.type === CustomizationTypeEnum.FLAVOR,
    );
    const ingredients = allToppings.filter(
      (t) => t.type === CustomizationTypeEnum.INGREDIENT,
    );

    return {
      flavors,
      ingredients,
      displayFlavors: filterType === 'ingredients' ? [] : flavors,
      displayIngredients: filterType === 'flavors' ? [] : ingredients,
    };
  }, [allToppings, filterType]);

  const isLoading = isLoadingToppings || isLoadingAssociated;

  const styles = StyleSheet.create({
    filterContainer: {
      backgroundColor: theme.colors.background,
      paddingVertical: theme.spacing.s,
      paddingHorizontal: theme.spacing.m,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
      marginBottom: theme.spacing.s,
      marginTop: -theme.spacing.l, // Compensar el padding del ResponsiveModal
      marginHorizontal: -theme.spacing.l, // Compensar el padding horizontal del ResponsiveModal
    },
    filterButtons: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
      justifyContent: 'center',
    },
    filterChip: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.outlineVariant,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    filterChipActive: {
      backgroundColor: theme.colors.primaryContainer,
      borderColor: theme.colors.primary,
    },
    filterChipText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    filterChipTextActive: {
      color: theme.colors.primary,
      fontWeight: '600',
      textAlign: 'center',
    },
    selectAllContainer: {
      marginBottom: theme.spacing.l,
      paddingTop: theme.spacing.s,
    },
    selectAllButton: {
      borderRadius: theme.roundness,
      marginBottom: theme.spacing.xs,
    },
    selectAllContent: {
      paddingVertical: theme.spacing.xs,
    },
    selectionCount: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
      textAlign: 'center',
      marginTop: theme.spacing.xs,
    },
    section: {
      marginBottom: theme.spacing.l,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.m,
      marginTop: theme.spacing.m,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    toppingItem: {
      marginBottom: theme.spacing.xs,
    },
    checkbox: {
      paddingVertical: theme.spacing.s,
      paddingHorizontal: 0,
      marginHorizontal: 0,
    },
    checkboxLabel: {
      textAlign: 'left',
      marginLeft: theme.spacing.xs,
    },
    ingredientsText: {
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
      marginLeft: theme.spacing.xl * 2,
      marginTop: -theme.spacing.xs,
      marginBottom: theme.spacing.s,
      fontSize: 12,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 200,
    },
    emptyState: {
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    emptyText: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    productSubtitle: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
    },
  });

  if (!product) return null;

  const handleDismiss = () => {
    if (hasChanges) {
      setShowConfirmation(true);
    } else {
      onDismiss();
    }
  };

  // Header personalizado con subtítulo del producto
  const modalHeader = (
    <View>
      <Text style={styles.productSubtitle}>{product.name}</Text>
    </View>
  );

  // Acciones del modal
  const modalActions = [
    {
      label: 'Cancelar',
      mode: 'contained-tonal' as const,
      onPress: handleDismiss,
    },
    {
      label: 'Guardar',
      mode: 'contained' as const,
      onPress: () => updateMutation.mutate(),
      loading: updateMutation.isPending,
      disabled: !hasChanges,
    },
  ];

  const modalContent = (
    <>
      {/* Filtros */}
      <View style={styles.filterContainer}>
        <View style={styles.filterButtons}>
          <Chip
            mode={filterType === 'all' ? 'flat' : 'outlined'}
            onPress={() => setFilterType('all')}
            style={[
              styles.filterChip,
              filterType === 'all' && styles.filterChipActive,
            ]}
            textStyle={[
              styles.filterChipText,
              filterType === 'all' && styles.filterChipTextActive,
            ]}
            compact
          >
            Todos
          </Chip>
          <Chip
            mode={filterType === 'flavors' ? 'flat' : 'outlined'}
            onPress={() => setFilterType('flavors')}
            style={[
              styles.filterChip,
              filterType === 'flavors' && styles.filterChipActive,
            ]}
            textStyle={[
              styles.filterChipText,
              filterType === 'flavors' && styles.filterChipTextActive,
            ]}
            compact
          >
            Sabores
          </Chip>
          <Chip
            mode={filterType === 'ingredients' ? 'flat' : 'outlined'}
            onPress={() => setFilterType('ingredients')}
            style={[
              styles.filterChip,
              filterType === 'ingredients' && styles.filterChipActive,
            ]}
            textStyle={[
              styles.filterChipText,
              filterType === 'ingredients' && styles.filterChipTextActive,
            ]}
            compact
          >
            Ingredientes
          </Chip>
        </View>
      </View>

      {/* Contenido principal */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <>
          <View style={styles.selectAllContainer}>
            <Button
              mode="contained-tonal"
              onPress={toggleAll}
              style={styles.selectAllButton}
              icon={
                selectedToppings.size === allToppings?.length
                  ? 'checkbox-marked'
                  : 'checkbox-blank-outline'
              }
              contentStyle={styles.selectAllContent}
            >
              {selectedToppings.size === allToppings?.length
                ? 'Quitar selección'
                : 'Seleccionar todo'}
            </Button>
            <Text style={styles.selectionCount}>
              {selectedToppings.size} de {allToppings?.length || 0}{' '}
              seleccionados
            </Text>
          </View>

          {filteredToppings.displayFlavors.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Sabores ({filteredToppings.displayFlavors.length})
              </Text>
              {filteredToppings.displayFlavors.map((flavor) => (
                <View key={flavor.id} style={styles.toppingItem}>
                  <Checkbox.Item
                    label={flavor.name}
                    status={
                      selectedToppings.has(flavor.id) ? 'checked' : 'unchecked'
                    }
                    onPress={() => toggleTopping(flavor.id)}
                    labelStyle={styles.checkboxLabel}
                    style={styles.checkbox}
                    position="leading"
                  />
                  {flavor.ingredients && (
                    <Text style={styles.ingredientsText}>
                      {flavor.ingredients}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {filteredToppings.displayIngredients.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Ingredientes ({filteredToppings.displayIngredients.length})
              </Text>
              {filteredToppings.displayIngredients.map((ingredient) => (
                <View key={ingredient.id} style={styles.toppingItem}>
                  <Checkbox.Item
                    label={ingredient.name}
                    status={
                      selectedToppings.has(ingredient.id)
                        ? 'checked'
                        : 'unchecked'
                    }
                    onPress={() => toggleTopping(ingredient.id)}
                    labelStyle={styles.checkboxLabel}
                    style={styles.checkbox}
                    position="leading"
                  />
                </View>
              ))}
            </View>
          )}

          {filteredToppings.displayFlavors.length === 0 &&
            filteredToppings.displayIngredients.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No hay sabores ni ingredientes disponibles
                </Text>
              </View>
            )}
        </>
      )}
    </>
  );

  return (
    <>
      <ResponsiveModal
        visible={visible}
        onDismiss={handleDismiss}
        title="Personalizar Producto"
        headerLeft={modalHeader}
        maxWidthPercent={95}
        maxHeightPercent={90}
        dismissable={!isLoading}
        isLoading={false}
        actions={modalActions}
      >
        {modalContent}
      </ResponsiveModal>

      <ConfirmationModal
        visible={showConfirmation}
        title="¿Salir sin guardar?"
        message="Los cambios se perderán"
        confirmText="Salir"
        cancelText="Cancelar"
        confirmButtonColor={theme.colors.error}
        onConfirm={() => {
          setShowConfirmation(false);
          setHasChanges(false);
          onDismiss();
        }}
        onCancel={() => setShowConfirmation(false)}
        onDismiss={() => setShowConfirmation(false)}
      />
    </>
  );
}
