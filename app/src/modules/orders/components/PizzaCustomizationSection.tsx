import { useMemo, memo } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Text,
  Card,
  ActivityIndicator,
  Surface,
  Switch,
  IconButton,
  TouchableRipple,
  RadioButton,
} from 'react-native-paper';
import type {
  SelectedPizzaCustomization,
  PizzaCustomization,
} from '../../pizzaCustomizations/schema/pizzaCustomization.schema';
import type { PizzaConfiguration } from '../../pizzaCustomizations/schema/pizzaConfiguration.schema';
import {
  PizzaHalfEnum,
  CustomizationActionEnum,
} from '../../pizzaCustomizations/schema/pizzaCustomization.schema';
import { useAppTheme } from '../../../app/styles/theme';

interface PizzaCustomizationSectionProps {
  flavors: PizzaCustomization[];
  ingredients: PizzaCustomization[];
  selectedFlavors: SelectedPizzaCustomization[];
  selectedPizzaCustomizations: SelectedPizzaCustomization[];
  pizzaConfiguration: PizzaConfiguration | null;
  getFlavorName: (flavorId: string) => string;
  showHalvesMode: boolean;
  handleFlavorToggle: (flavorId: string) => void;
  toggleIngredient: (
    ingredientId: string,
    half: SelectedPizzaCustomization['half'],
    action: SelectedPizzaCustomization['action'],
  ) => void;
  isIngredientSelected: (
    ingredientId: string,
    half: SelectedPizzaCustomization['half'],
    action: SelectedPizzaCustomization['action'],
  ) => boolean;
  manualHalvesMode: boolean;
  handleManualHalvesModeToggle: (value: boolean) => void;
  expandedIngredients: {
    [PizzaHalfEnum.FULL]: boolean;
    [PizzaHalfEnum.HALF_1]: boolean;
    [PizzaHalfEnum.HALF_2]: boolean;
  };
  expandedFlavors: boolean;
  toggleExpandedFlavors: () => void;
  toggleExpandedIngredients: (
    section: SelectedPizzaCustomization['half'],
  ) => void;
  PIZZA_HALF: typeof PizzaHalfEnum;
  CUSTOMIZATION_ACTION: typeof CustomizationActionEnum;
  loading?: boolean;
}

interface FlavorItemProps {
  flavor: PizzaCustomization;
  isSelected: boolean;
  isDisabled: boolean;
  onToggle: (flavorId: string) => void;
  styles: any;
  theme: any;
}

const FlavorItem = memo<FlavorItemProps>(
  ({ flavor, isSelected, isDisabled, onToggle, styles }) => (
    <Surface
      style={[
        styles.flavorChip,
        isSelected && styles.flavorChipSelected,
        isDisabled && styles.flavorChipDisabled,
      ]}
      elevation={isSelected ? 2 : 0}
    >
      <TouchableRipple
        onPress={() => !isDisabled && onToggle(flavor.id)}
        disabled={isDisabled}
        style={styles.touchableRippleStyle}
      >
        <View style={styles.flavorItemContainer}>
          <RadioButton
            value={flavor.id}
            status={isSelected ? 'checked' : 'unchecked'}
            disabled={isDisabled}
            onPress={() => !isDisabled && onToggle(flavor.id)}
          />
          <View style={styles.flavorContentContainer}>
            <View style={styles.flavorTitleContainer}>
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
  ),
);

const PizzaCustomizationSection = memo<PizzaCustomizationSectionProps>(
  ({
    flavors,
    ingredients,
    selectedFlavors,
    selectedPizzaCustomizations,
    pizzaConfiguration,
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
    loading = false,
  }) => {
    const theme = useAppTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating size="large" />
          <Text style={styles.loadingText}>Cargando opciones de pizza...</Text>
        </View>
      );
    }

    if (
      !pizzaConfiguration ||
      (flavors.length === 0 && ingredients.length === 0)
    ) {
      return null;
    }

    const renderCustomizationSection = (
      half: SelectedPizzaCustomization['half'],
      sectionTitle: string,
      flavorName?: string,
    ) => {
      const isExpanded = expandedIngredients[half];

      const getDynamicTitle = () => {
        const customizationsForHalf = selectedPizzaCustomizations.filter(
          (sc) => sc.half === half,
        );

        const parts: string[] = [];

        if (flavorName) {
          parts.push(flavorName);
        } else if (half !== PIZZA_HALF.FULL) {
          parts.push('Sin sabor');
        }
        const addedIngredients: string[] = [];
        const removedIngredients: string[] = [];

        customizationsForHalf.forEach((sc) => {
          const customization = ingredients.find(
            (c) => c.id === sc.pizzaCustomizationId,
          );
          if (customization) {
            if (sc.action === CUSTOMIZATION_ACTION.ADD) {
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
          <Card.Content style={styles.cardContentStyle}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {sectionTitle}:{' '}
                <Text style={styles.pizzaFormat}>{getDynamicTitle()}</Text>
              </Text>
            </View>

            <Surface style={styles.subsectionSurface} elevation={1}>
              <TouchableRipple
                onPress={() => toggleExpandedIngredients(half)}
                style={styles.subsectionTouchableStyle}
              >
                <View style={styles.subsectionHeader}>
                  <Text style={styles.subsectionTitle}>
                    Personalizar Ingredientes
                  </Text>
                  <IconButton
                    icon={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    style={styles.iconButtonStyle}
                  />
                </View>
              </TouchableRipple>

              {isExpanded && (
                <View style={styles.ingredientsContainer}>
                  {ingredients.map((ingredient) => {
                    const isAddSelected = isIngredientSelected(
                      ingredient.id,
                      half,
                      CUSTOMIZATION_ACTION.ADD,
                    );
                    const isRemoveSelected = isIngredientSelected(
                      ingredient.id,
                      half,
                      CUSTOMIZATION_ACTION.REMOVE,
                    );
                    const isSelected = isAddSelected || isRemoveSelected;
                    const currentAction = isAddSelected
                      ? CUSTOMIZATION_ACTION.ADD
                      : CUSTOMIZATION_ACTION.REMOVE;

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
                                CUSTOMIZATION_ACTION.ADD,
                              );
                            }
                          }}
                          style={styles.ingredientTouchableStyle}
                        >
                          <View style={styles.ingredientRowContainer}>
                            <View style={styles.ingredientInfoContainer}>
                              <View style={styles.ingredientNameContainer}>
                                <Text style={styles.ingredientLabel}>
                                  {ingredient.name} <Text style={styles.toppingValueSmall}>({ingredient.toppingValue})</Text>
                                </Text>
                              </View>
                            </View>
                            {isSelected && (
                              <View style={styles.actionToggle}>
                                <Text
                                  style={[
                                    styles.toggleSymbol,
                                    currentAction ===
                                      CUSTOMIZATION_ACTION.ADD &&
                                      styles.activeSymbol,
                                  ]}
                                >
                                  +
                                </Text>
                                <Switch
                                  value={
                                    currentAction ===
                                    CUSTOMIZATION_ACTION.REMOVE
                                  }
                                  onValueChange={(value) => {
                                    const newAction = value
                                      ? CUSTOMIZATION_ACTION.REMOVE
                                      : CUSTOMIZATION_ACTION.ADD;
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
                                    styles.toggleSymbol,
                                    currentAction ===
                                      CUSTOMIZATION_ACTION.REMOVE &&
                                      styles.activeSymbol,
                                  ]}
                                >
                                  −
                                </Text>
                              </View>
                            )}
                            <RadioButton
                              value={ingredient.id}
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
                                    CUSTOMIZATION_ACTION.ADD,
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
          <Card.Content style={styles.cardContentStyle}>
            <TouchableRipple
              onPress={toggleExpandedFlavors}
              style={[
                styles.dynamicMarginBottom,
                expandedFlavors
                  ? styles.expandedMarginBottom
                  : styles.collapsedMarginBottom,
              ]}
            >
              <View style={styles.sectionHeaderWithSwitch}>
                <View style={styles.flavorSectionContainer}>
                  <View style={styles.flavorHeaderContainer}>
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
                      style={styles.iconButtonStyle}
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
                      onValueChange={handleManualHalvesModeToggle}
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
                    <FlavorItem
                      key={flavor.id}
                      flavor={flavor}
                      isSelected={isSelected}
                      isDisabled={isDisabled}
                      onToggle={handleFlavorToggle}
                      styles={styles}
                      theme={theme}
                    />
                  );
                })}
              </View>
            )}
          </Card.Content>
        </Card>

        {showHalvesMode ? (
          <>
            {renderCustomizationSection(
              PIZZA_HALF.HALF_1,
              'Mitad 1',
              selectedFlavors[0]
                ? getFlavorName(selectedFlavors[0].pizzaCustomizationId)
                : undefined,
            )}
            {renderCustomizationSection(
              PIZZA_HALF.HALF_2,
              'Mitad 2',
              selectedFlavors[1]
                ? getFlavorName(selectedFlavors[1].pizzaCustomizationId)
                : undefined,
            )}
          </>
        ) : (
          renderCustomizationSection(
            PIZZA_HALF.FULL,
            'Pizza Completa',
            selectedFlavors[0]
              ? getFlavorName(selectedFlavors[0].pizzaCustomizationId)
              : undefined,
          )
        )}
      </View>
    );
  },
);

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
      overflow: 'hidden',
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
      marginHorizontal: 12,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 8,
      paddingHorizontal: 4,
      paddingVertical: 2,
    },
    toggleSymbol: {
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
      fontWeight: 'bold',
      minWidth: 16,
      textAlign: 'center',
    },
    activeSymbol: {
      color: theme.colors.primary,
      fontWeight: 'bold',
    },
    switch: {
      marginHorizontal: 4,
      transform: [{ scale: 0.9 }],
    },
    priceInfoText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    touchableRippleStyle: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    flavorItemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    flavorContentContainer: {
      flex: 1,
      marginLeft: 8,
    },
    flavorTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    cardContentStyle: {
      paddingVertical: 16,
      paddingHorizontal: 16,
    },
    subsectionTouchableStyle: {
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    iconButtonStyle: {
      margin: -8,
    },
    ingredientsContainer: {
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    ingredientTouchableStyle: {
      paddingVertical: 8,
      paddingHorizontal: 8,
    },
    ingredientRowContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    ingredientInfoContainer: {
      flex: 1,
    },
    ingredientNameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    dynamicMarginBottom: {},
    expandedMarginBottom: {
      marginBottom: 12,
    },
    collapsedMarginBottom: {
      marginBottom: 0,
    },
    flavorSectionContainer: {
      flex: 1,
    },
    flavorHeaderContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  });

PizzaCustomizationSection.displayName = 'PizzaCustomizationSection';

export default PizzaCustomizationSection;
