import React, { useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Text,
  Checkbox,
  Card,
  ActivityIndicator,
  Surface,
  Switch,
  IconButton,
  TouchableRipple,
} from 'react-native-paper';
import type { SelectedPizzaCustomization } from '@/app/schemas/domain/order.schema';
import type {
  PizzaCustomization,
  PizzaConfiguration,
} from '@/modules/pizzaCustomizations/types/pizzaCustomization.types';
import {
  PizzaHalf,
  CustomizationAction,
  CustomizationType,
} from '@/modules/pizzaCustomizations/types/pizzaCustomization.types';
import { useAppTheme } from '@/app/styles/theme';

interface PizzaCustomizationSectionProps {
  pizzaCustomizations: PizzaCustomization[];
  pizzaConfiguration: PizzaConfiguration | null;
  selectedPizzaCustomizations: SelectedPizzaCustomization[];
  onCustomizationChange: (customizations: SelectedPizzaCustomization[]) => void;
  loading?: boolean;
}

const PizzaCustomizationSectionV2: React.FC<PizzaCustomizationSectionProps> = ({
  pizzaCustomizations,
  pizzaConfiguration,
  selectedPizzaCustomizations,
  onCustomizationChange,
  loading = false,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [manualHalvesMode, setManualHalvesMode] = useState(false);
  const [expandedIngredients, setExpandedIngredients] = useState<{
    full: boolean;
    half1: boolean;
    half2: boolean;
  }>({
    full: false,
    half1: false,
    half2: false,
  });
  const [expandedFlavors, setExpandedFlavors] = useState(true);

  // Separar sabores e ingredientes
  const flavors = useMemo(
    () =>
      pizzaCustomizations.filter((c) => c.type === CustomizationType.FLAVOR),
    [pizzaCustomizations],
  );

  const ingredients = useMemo(
    () =>
      pizzaCustomizations.filter(
        (c) => c.type === CustomizationType.INGREDIENT,
      ),
    [pizzaCustomizations],
  );

  // Obtener sabores seleccionados - DEBE estar antes de los returns condicionales
  const selectedFlavors = useMemo(
    () =>
      selectedPizzaCustomizations.filter(
        (sc) =>
          sc.action === CustomizationAction.ADD &&
          flavors.some((f) => f.id === sc.pizzaCustomizationId),
      ),
    [selectedPizzaCustomizations, flavors],
  );

  // Determinar si mostrar modo mitades (2 sabores o modo manual activado)
  const showHalvesMode =
    selectedFlavors.length === 2 ||
    (manualHalvesMode && selectedFlavors.length <= 1);

  // Returns condicionales al final, después de todos los hooks
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating size="large" />
        <Text style={styles.loadingText}>Cargando opciones de pizza...</Text>
      </View>
    );
  }

  if (!pizzaConfiguration || pizzaCustomizations.length === 0) {
    return null;
  }

  // Obtener el nombre del sabor por ID
  const getFlavorName = (flavorId: string) => {
    const flavor = flavors.find((f) => f.id === flavorId);
    return flavor?.name || '';
  };

  const handleFlavorToggle = (flavorId: string) => {
    const isSelected = selectedFlavors.some(
      (sf) => sf.pizzaCustomizationId === flavorId,
    );

    if (isSelected) {
      // Deseleccionar
      const remainingFlavorSelections = selectedPizzaCustomizations.filter(
        (sc) =>
          !(
            sc.pizzaCustomizationId === flavorId &&
            sc.action === CustomizationAction.ADD
          ),
      );

      // Si queda solo un sabor después de deseleccionar, cambiar su half a FULL
      const remainingFlavors = remainingFlavorSelections.filter(
        (sc) =>
          sc.action === CustomizationAction.ADD &&
          flavors.some((f) => f.id === sc.pizzaCustomizationId),
      );

      if (remainingFlavors.length === 1) {
        const otherFlavorId = remainingFlavors[0].pizzaCustomizationId;
        const nonFlavorSelections = remainingFlavorSelections.filter(
          (sc) =>
            !flavors.some((f) => f.id === sc.pizzaCustomizationId) ||
            sc.action !== CustomizationAction.ADD,
        );

        onCustomizationChange([
          ...nonFlavorSelections,
          {
            pizzaCustomizationId: otherFlavorId,
            half: PizzaHalf.FULL,
            action: CustomizationAction.ADD,
          },
        ]);
      } else {
        onCustomizationChange(remainingFlavorSelections);
      }
    } else {
      // Seleccionar
      if (selectedFlavors.length >= 2) {
        // Ya hay 2 sabores seleccionados, no permitir más
        return;
      }

      const nonFlavorSelections = selectedPizzaCustomizations.filter(
        (sc) =>
          !flavors.some((f) => f.id === sc.pizzaCustomizationId) ||
          sc.action !== CustomizationAction.ADD,
      );

      if (selectedFlavors.length === 0) {
        // Primer sabor - va completo o a mitad 1 si está el modo manual
        if (manualHalvesMode) {
          onCustomizationChange([
            ...nonFlavorSelections,
            {
              pizzaCustomizationId: flavorId,
              half: PizzaHalf.HALF_1,
              action: CustomizationAction.ADD,
            },
          ]);
        } else {
          onCustomizationChange([
            ...nonFlavorSelections,
            {
              pizzaCustomizationId: flavorId,
              half: PizzaHalf.FULL,
              action: CustomizationAction.ADD,
            },
          ]);
        }
      } else if (selectedFlavors.length === 1) {
        // Segundo sabor - convertir a mitades
        const existingFlavor = selectedFlavors[0];

        // Cambiar el sabor existente a mitad 1
        nonFlavorSelections.push({
          pizzaCustomizationId: existingFlavor.pizzaCustomizationId,
          half: PizzaHalf.HALF_1,
          action: CustomizationAction.ADD,
        });

        // Agregar el nuevo sabor a mitad 2
        nonFlavorSelections.push({
          pizzaCustomizationId: flavorId,
          half: PizzaHalf.HALF_2,
          action: CustomizationAction.ADD,
        });

        onCustomizationChange(nonFlavorSelections);
      }
    }
  };

  const toggleIngredient = (
    ingredientId: string,
    half: PizzaHalf,
    action: CustomizationAction,
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
        (sc) => !(sc.pizzaCustomizationId === ingredientId && sc.half === half),
      );

      newSelections.push({
        pizzaCustomizationId: ingredientId,
        half,
        action,
      });
    }

    onCustomizationChange(newSelections);
  };

  const isIngredientSelected = (
    ingredientId: string,
    half: PizzaHalf,
    action: CustomizationAction,
  ): boolean => {
    return selectedPizzaCustomizations.some(
      (sc) =>
        sc.pizzaCustomizationId === ingredientId &&
        sc.half === half &&
        sc.action === action,
    );
  };

  // Renderizar sección de personalización
  const renderCustomizationSection = (
    half: PizzaHalf,
    sectionTitle: string,
    flavorName?: string,
  ) => {
    const sectionKey =
      half === PizzaHalf.FULL
        ? 'full'
        : half === PizzaHalf.HALF_1
          ? 'half1'
          : 'half2';
    const isExpanded = expandedIngredients[sectionKey];

    // Construir el título dinámico con el formato completo
    const getDynamicTitle = () => {
      const customizationsForHalf = selectedPizzaCustomizations.filter(
        (sc) => sc.half === half,
      );

      const parts: string[] = [];

      // Agregar el sabor si existe
      if (flavorName) {
        parts.push(flavorName);
      } else if (half !== PizzaHalf.FULL) {
        // Para mitades sin sabor
        parts.push('Sin sabor');
      }

      // Filtrar ingredientes
      const addedIngredients: string[] = [];
      const removedIngredients: string[] = [];

      customizationsForHalf.forEach((sc) => {
        const customization = ingredients.find(
          (c) => c.id === sc.pizzaCustomizationId,
        );
        if (customization) {
          if (sc.action === CustomizationAction.ADD) {
            addedIngredients.push(customization.name);
          } else {
            removedIngredients.push(customization.name);
          }
        }
      });

      if (addedIngredients.length > 0) {
        parts.push(`con: ${addedIngredients.join(', ')}`);
      }
      if (removedIngredients.length > 0) {
        parts.push(`sin: ${removedIngredients.join(', ')}`);
      }

      return parts.length > 0
        ? parts.join(' - ')
        : flavorName || 'Sin personalizar';
    };

    return (
      <Card style={styles.optionCard}>
        <Card.Content style={{ paddingVertical: 16, paddingHorizontal: 16 }}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {sectionTitle}:{' '}
              <Text style={styles.pizzaFormat}>{getDynamicTitle()}</Text>
            </Text>
          </View>

          <Surface style={styles.subsectionSurface} elevation={1}>
            <TouchableRipple
              onPress={() =>
                setExpandedIngredients((prev) => ({
                  ...prev,
                  [sectionKey]: !prev[sectionKey],
                }))
              }
              style={{ paddingVertical: 12, paddingHorizontal: 16 }}
            >
              <View style={styles.subsectionHeader}>
                <Text style={styles.subsectionTitle}>
                  Personalizar Ingredientes
                </Text>
                <IconButton
                  icon={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  style={{ margin: -8 }}
                />
              </View>
            </TouchableRipple>

            {isExpanded && (
              <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
                {ingredients.map((ingredient) => {
                  const isAddSelected = isIngredientSelected(
                    ingredient.id,
                    half,
                    CustomizationAction.ADD,
                  );
                  const isRemoveSelected = isIngredientSelected(
                    ingredient.id,
                    half,
                    CustomizationAction.REMOVE,
                  );
                  const isSelected = isAddSelected || isRemoveSelected;
                  const currentAction = isAddSelected
                    ? CustomizationAction.ADD
                    : CustomizationAction.REMOVE;

                  return (
                    <Surface
                      key={ingredient.id}
                      style={styles.ingredientItem}
                      elevation={0}
                    >
                      <TouchableRipple
                        onPress={() => {
                          if (isSelected) {
                            toggleIngredient(
                              ingredient.id,
                              half,
                              currentAction,
                            );
                          } else {
                            toggleIngredient(
                              ingredient.id,
                              half,
                              CustomizationAction.ADD,
                            );
                          }
                        }}
                        style={{ paddingVertical: 8, paddingHorizontal: 8 }}
                      >
                        <View
                          style={{ flexDirection: 'row', alignItems: 'center' }}
                        >
                          <View style={{ flex: 1 }}>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                              }}
                            >
                              <Text style={styles.ingredientLabel}>
                                {ingredient.name}
                              </Text>
                              <Text style={styles.toppingValueSmall}>
                                ({ingredient.toppingValue})
                              </Text>
                            </View>
                          </View>
                          {isSelected && (
                            <View style={styles.actionToggle}>
                              <Text
                                style={[
                                  styles.toggleLabel,
                                  currentAction === CustomizationAction.ADD &&
                                    styles.activeLabel,
                                ]}
                              >
                                Agregar
                              </Text>
                              <Switch
                                value={
                                  currentAction === CustomizationAction.REMOVE
                                }
                                onValueChange={(value) => {
                                  const newAction = value
                                    ? CustomizationAction.REMOVE
                                    : CustomizationAction.ADD;
                                  toggleIngredient(
                                    ingredient.id,
                                    half,
                                    newAction,
                                  );
                                }}
                                style={styles.switch}
                              />
                              <Text
                                style={[
                                  styles.toggleLabel,
                                  currentAction ===
                                    CustomizationAction.REMOVE &&
                                    styles.activeLabel,
                                ]}
                              >
                                Quitar
                              </Text>
                            </View>
                          )}
                          <Checkbox
                            status={isSelected ? 'checked' : 'unchecked'}
                            onPress={() => {
                              if (isSelected) {
                                toggleIngredient(
                                  ingredient.id,
                                  half,
                                  currentAction,
                                );
                              } else {
                                toggleIngredient(
                                  ingredient.id,
                                  half,
                                  CustomizationAction.ADD,
                                );
                              }
                            }}
                          />
                        </View>
                      </TouchableRipple>
                    </Surface>
                  );
                })}
              </View>
            )}
          </Surface>
        </Card.Content>
      </Card>
    );
  };


  return (
    <View style={styles.container}>
      {/* Selección de Sabores */}
      <Card style={styles.optionCard}>
        <Card.Content style={{ paddingVertical: 16, paddingHorizontal: 16 }}>
          <TouchableRipple
            onPress={() => setExpandedFlavors(!expandedFlavors)}
            style={{ marginBottom: expandedFlavors ? 12 : 0 }}
          >
            <View style={styles.sectionHeaderWithSwitch}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.sectionTitle}>
                    Sabores
                    {selectedFlavors.length > 0 && (
                      <Text style={styles.pizzaFormat}>
                        {' - '}
                        {selectedFlavors
                          .map((sf) => {
                            const flavor = flavors.find(
                              (f) => f.id === sf.pizzaCustomizationId,
                            );
                            return flavor?.name || '';
                          })
                          .join(' / ')}
                      </Text>
                    )}
                  </Text>
                  <IconButton
                    icon={expandedFlavors ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    style={{ margin: -8 }}
                  />
                </View>
                {expandedFlavors && (
                  <Text style={styles.helperText}>
                    Selecciona hasta 2 sabores
                  </Text>
                )}
              </View>
              {expandedFlavors && selectedFlavors.length <= 1 && (
                <View style={styles.halvesSwitch}>
                  <Text style={styles.switchLabel}>Dividir mitades</Text>
                  <Switch
                    value={manualHalvesMode}
                    onValueChange={(value) => {
                      setManualHalvesMode(value);

                      // Si se activa el modo mitades, convertir las personalizaciones de FULL a HALF_1
                      if (value && selectedFlavors.length <= 1) {
                        const updatedCustomizations =
                          selectedPizzaCustomizations.map((sc) => {
                            if (sc.half === PizzaHalf.FULL) {
                              return { ...sc, half: PizzaHalf.HALF_1 };
                            }
                            return sc;
                          });
                        onCustomizationChange(updatedCustomizations);
                      }
                      // Si se desactiva el modo mitades y solo hay un sabor, convertir todo a FULL
                      else if (!value && selectedFlavors.length === 1) {
                        const updatedCustomizations =
                          selectedPizzaCustomizations.map((sc) => {
                            if (
                              sc.half === PizzaHalf.HALF_1 ||
                              sc.half === PizzaHalf.HALF_2
                            ) {
                              return { ...sc, half: PizzaHalf.FULL };
                            }
                            return sc;
                          });
                        onCustomizationChange(updatedCustomizations);
                      }
                    }}
                  />
                </View>
              )}
            </View>
          </TouchableRipple>
          {expandedFlavors && (
            <View style={styles.flavorsGrid}>
              {flavors.map((flavor) => {
                const isSelected = selectedFlavors.some(
                  (sf) => sf.pizzaCustomizationId === flavor.id,
                );
                const isDisabled = selectedFlavors.length >= 2 && !isSelected;

                return (
                  <Surface
                    key={flavor.id}
                    style={[
                      styles.flavorChip,
                      isSelected && styles.flavorChipSelected,
                      isDisabled && styles.flavorChipDisabled,
                    ]}
                  >
                    <TouchableRipple
                      onPress={() => handleFlavorToggle(flavor.id)}
                      disabled={isDisabled}
                      style={{
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        borderRadius: 8,
                      }}
                    >
                      <View
                        style={{ flexDirection: 'row', alignItems: 'center' }}
                      >
                        <Checkbox
                          status={isSelected ? 'checked' : 'unchecked'}
                          onPress={() => handleFlavorToggle(flavor.id)}
                          disabled={isDisabled}
                        />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 8,
                            }}
                          >
                            <Text
                              style={[
                                styles.flavorLabel,
                                isDisabled && styles.flavorLabelDisabled,
                              ]}
                            >
                              {flavor.name}
                            </Text>
                            <Text
                              style={[
                                styles.toppingValue,
                                isDisabled && styles.flavorLabelDisabled,
                              ]}
                            >
                              ({flavor.toppingValue})
                            </Text>
                          </View>
                          {flavor.ingredients && (
                            <Text
                              style={[
                                styles.ingredientsText,
                                isDisabled && styles.flavorLabelDisabled,
                              ]}
                            >
                              {flavor.ingredients}
                            </Text>
                          )}
                        </View>
                      </View>
                    </TouchableRipple>
                  </Surface>
                );
              })}
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Secciones de Personalización */}
      {showHalvesMode ? (
        // Modo mitades (2 sabores o modo manual)
        <>
          {renderCustomizationSection(
            PizzaHalf.HALF_1,
            'Mitad 1',
            selectedFlavors[0]
              ? getFlavorName(selectedFlavors[0].pizzaCustomizationId)
              : undefined,
          )}
          {renderCustomizationSection(
            PizzaHalf.HALF_2,
            'Mitad 2',
            selectedFlavors[1]
              ? getFlavorName(selectedFlavors[1].pizzaCustomizationId)
              : undefined,
          )}
        </>
      ) : (
        // Modo completo (sin sabores o 1 sabor)
        renderCustomizationSection(
          PizzaHalf.FULL,
          'Pizza Completa',
          selectedFlavors[0]
            ? getFlavorName(selectedFlavors[0].pizzaCustomizationId)
            : undefined,
        )
      )}
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      gap: 8,
    },
    loadingContainer: {
      padding: 32,
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    optionCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      elevation: 1,
    },
    pizzaFormat: {
      fontSize: 16,
      fontWeight: 'normal',
      color: theme.colors.primary,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionHeaderWithSwitch: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    halvesSwitch: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    switchLabel: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
    },
    flavorInline: {
      fontSize: 16,
      fontWeight: 'normal',
      color: theme.colors.primary,
    },
    helperText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 12,
    },
    flavorsGrid: {
      gap: 8,
    },
    flavorChip: {
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      elevation: 0,
    },
    flavorChipSelected: {
      backgroundColor: theme.colors.primaryContainer,
      borderColor: theme.colors.primary,
    },
    flavorChipDisabled: {
      opacity: 0.5,
    },
    flavorLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurface,
    },
    flavorLabelDisabled: {
      color: theme.colors.onSurfaceDisabled,
    },
    ingredientsText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    toppingValue: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      opacity: 0.6,
    },
    toppingValueSmall: {
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      opacity: 0.5,
    },
    subsectionSurface: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 8,
      marginTop: 8,
    },
    subsectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    subsectionTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.onSurface,
    },
    ingredientItem: {
      backgroundColor: 'transparent',
      marginTop: 4,
    },
    ingredientLabel: {
      fontSize: 14,
      color: theme.colors.onSurface,
    },
    actionToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 8,
    },
    toggleLabel: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      fontWeight: '500',
    },
    activeLabel: {
      color: theme.colors.primary,
      fontWeight: 'bold',
    },
    switch: {
      marginHorizontal: 8,
      transform: [{ scale: 1.2 }],
    },
    priceInfoText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
  });

export default PizzaCustomizationSectionV2;
