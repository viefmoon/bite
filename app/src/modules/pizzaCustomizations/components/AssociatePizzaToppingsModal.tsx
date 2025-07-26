import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Portal,
  Modal,
  Text,
  Checkbox,
  Button,
  IconButton,
  Chip,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productsService } from '@/modules/menu/services/productsService';
import { pizzaCustomizationsService } from '../services/pizzaCustomizationsService';
import { useSnackbarStore } from '@/app/store/snackbarStore';
import { CustomizationTypeEnum } from '../schema/pizzaCustomization.schema';
import type { Product } from '@/modules/menu/schema/products.schema';
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
    modal: {
      backgroundColor: theme.colors.background,
      margin: theme.spacing.m,
      marginTop: theme.spacing.xl * 2,
      borderRadius: theme.roundness * 2,
      height: '90%',
      maxHeight: '90%',
    },
    header: {
      backgroundColor: theme.colors.elevation.level1,
      borderTopLeftRadius: theme.roundness * 2,
      borderTopRightRadius: theme.roundness * 2,
      paddingHorizontal: theme.spacing.m,
      paddingTop: theme.spacing.m,
      paddingBottom: theme.spacing.s,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    titleIcon: {
      margin: 0,
      marginRight: theme.spacing.xs,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.onSurface,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginTop: theme.spacing.xs,
      marginLeft: theme.spacing.xl + theme.spacing.m,
    },
    closeButton: {
      margin: 0,
    },
    filterContainer: {
      backgroundColor: theme.colors.background,
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.m,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    filterButtons: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
      justifyContent: 'space-between',
    },
    filterChip: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.outlineVariant,
      height: 32,
    },
    filterChipActive: {
      backgroundColor: theme.colors.primaryContainer,
      borderColor: theme.colors.primary,
    },
    filterChipText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    filterChipTextActive: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    content: {
      flex: 1,
      minHeight: 200,
    },
    scrollContent: {
      padding: theme.spacing.m,
      paddingBottom: theme.spacing.xl * 2,
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
    actions: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.m,
      gap: theme.spacing.m,
    },
    actionButton: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    cancelButton: {
      borderColor: theme.colors.outlineVariant,
    },
    saveButton: {
      borderWidth: 0,
    },
    buttonContent: {
      paddingVertical: 6,
    },
  });

  if (!product) return null;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={() => {
          if (hasChanges) {
            setShowConfirmation(true);
          } else {
            onDismiss();
          }
        }}
        contentContainerStyle={styles.modal}
        dismissable={true}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.titleContainer}>
              <IconButton
                icon="food-variant"
                size={20}
                iconColor={theme.colors.primary}
                style={styles.titleIcon}
              />
              <Text style={styles.title}>Personalizar Producto</Text>
            </View>
            <IconButton
              icon="close"
              size={24}
              onPress={() => {
                if (hasChanges) {
                  setShowConfirmation(true);
                } else {
                  onDismiss();
                }
              }}
              style={styles.closeButton}
            />
          </View>
          <Text style={styles.subtitle}>{product.name}</Text>
        </View>

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
              icon="format-list-bulleted"
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
              icon="pizza"
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
              icon="food-variant"
              compact
            >
              Ingredientes
            </Chip>
          </View>
        </View>

        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
            >
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
                          selectedToppings.has(flavor.id)
                            ? 'checked'
                            : 'unchecked'
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
            </ScrollView>
          )}
        </View>

        <Divider />

        <View>
          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={() => {
                if (hasChanges) {
                  setShowConfirmation(true);
                } else {
                  onDismiss();
                }
              }}
              style={[styles.actionButton, styles.cancelButton]}
              contentStyle={styles.buttonContent}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={() => updateMutation.mutate()}
              loading={updateMutation.isPending}
              disabled={!hasChanges}
              style={[styles.actionButton, styles.saveButton]}
              contentStyle={styles.buttonContent}
            >
              Guardar
            </Button>
          </View>
        </View>
      </Modal>

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
    </Portal>
  );
}
