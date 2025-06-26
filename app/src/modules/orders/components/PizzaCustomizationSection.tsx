import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Text,
  Divider,
  Checkbox,
  RadioButton,
  Card,
  Chip,
  ActivityIndicator,
  Surface,
} from 'react-native-paper';
import type { SelectedPizzaCustomization } from '@/app/schemas/domain/order.schema';
import type { PizzaCustomization, PizzaConfiguration } from '@/modules/pizzaCustomizations/types/pizzaCustomization.types';
import { PizzaHalf, CustomizationAction, CustomizationType } from '@/modules/pizzaCustomizations/types/pizzaCustomization.types';
import { useAppTheme } from '@/app/styles/theme';

interface PizzaCustomizationSectionProps {
  pizzaCustomizations: PizzaCustomization[];
  pizzaConfiguration: PizzaConfiguration | null;
  selectedPizzaCustomizations: SelectedPizzaCustomization[];
  onCustomizationChange: (customizations: SelectedPizzaCustomization[]) => void;
  loading?: boolean;
}

const PizzaCustomizationSection: React.FC<PizzaCustomizationSectionProps> = ({
  pizzaCustomizations,
  pizzaConfiguration,
  selectedPizzaCustomizations,
  onCustomizationChange,
  loading = false,
}) => {
  const theme = useAppTheme();

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

  const handleToggleCustomization = (
    customizationId: string,
    half: PizzaHalf,
    action: CustomizationAction
  ) => {
    const existingIndex = selectedPizzaCustomizations.findIndex(
      (sc) =>
        sc.pizzaCustomizationId === customizationId &&
        sc.half === half &&
        sc.action === action
    );

    let newSelections: SelectedPizzaCustomization[];

    if (existingIndex >= 0) {
      // Si ya existe, lo quitamos
      newSelections = selectedPizzaCustomizations.filter((_, index) => index !== existingIndex);
    } else {
      // Si no existe, lo agregamos
      newSelections = [
        ...selectedPizzaCustomizations,
        {
          pizzaCustomizationId: customizationId,
          half,
          action,
        },
      ];
    }

    onCustomizationChange(newSelections);
  };

  const isCustomizationSelected = (
    customizationId: string,
    half: PizzaHalf,
    action: CustomizationAction
  ): boolean => {
    return selectedPizzaCustomizations.some(
      (sc) =>
        sc.pizzaCustomizationId === customizationId &&
        sc.half === half &&
        sc.action === action
    );
  };

  // Calcular el valor total de toppings
  const calculateCurrentToppingValue = (): number => {
    let totalValue = 0;
    const addedCustomizations = selectedPizzaCustomizations.filter(
      (sc) => sc.action === CustomizationAction.ADD
    );

    for (const selected of addedCustomizations) {
      const customization = pizzaCustomizations.find(
        (c) => c.id === selected.pizzaCustomizationId
      );
      if (!customization) continue;

      if (selected.half === PizzaHalf.FULL) {
        totalValue += customization.toppingValue;
      } else {
        totalValue += customization.toppingValue / 2;
      }
    }

    return totalValue;
  };

  const currentToppingValue = calculateCurrentToppingValue();
  const extraToppings = Math.max(0, currentToppingValue - pizzaConfiguration.includedToppings);
  const extraCost = extraToppings * Number(pizzaConfiguration.extraToppingCost);

  // Separar personalizaciones por tipo
  const flavors = pizzaCustomizations.filter(
    (c) => c.type === CustomizationType.FLAVOR
  );
  const ingredients = pizzaCustomizations.filter(
    (c) => c.type === CustomizationType.INGREDIENT
  );

  return (
    <View style={styles.container}>
      <Divider style={styles.divider} />
      
      <Card style={styles.infoCard}>
        <Card.Content>
          <Text style={styles.infoTitle}>Información de Pizza</Text>
          <Text style={styles.infoText}>
            • Toppings incluidos: {pizzaConfiguration.includedToppings}
          </Text>
          <Text style={styles.infoText}>
            • Costo por topping extra: ${Number(pizzaConfiguration.extraToppingCost).toFixed(2)}
          </Text>
          <Text style={[styles.infoText, { fontWeight: 'bold' }]}>
            • Toppings actuales: {currentToppingValue.toFixed(1)}
          </Text>
          {extraCost > 0 && (
            <Text style={[styles.infoText, { color: theme.colors.primary }]}>
              • Costo extra: +${extraCost.toFixed(2)}
            </Text>
          )}
        </Card.Content>
      </Card>

      {flavors.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sabores</Text>
          {flavors.map((flavor) => (
            <Card key={flavor.id} style={styles.customizationCard}>
              <Card.Content>
                <View style={styles.customizationHeader}>
                  <Text style={styles.customizationName}>{flavor.name}</Text>
                  <Chip compact>{flavor.toppingValue} topping{flavor.toppingValue !== 1 ? 's' : ''}</Chip>
                </View>
                {flavor.ingredients && (
                  <Text style={styles.ingredientsText}>{flavor.ingredients}</Text>
                )}
                <View style={styles.optionsRow}>
                  <Checkbox.Item
                    label="Pizza completa"
                    status={
                      isCustomizationSelected(flavor.id, PizzaHalf.FULL, CustomizationAction.ADD)
                        ? 'checked'
                        : 'unchecked'
                    }
                    onPress={() =>
                      handleToggleCustomization(flavor.id, PizzaHalf.FULL, CustomizationAction.ADD)
                    }
                    style={styles.checkboxItem}
                  />
                  <Checkbox.Item
                    label="Mitad 1"
                    status={
                      isCustomizationSelected(flavor.id, PizzaHalf.HALF_1, CustomizationAction.ADD)
                        ? 'checked'
                        : 'unchecked'
                    }
                    onPress={() =>
                      handleToggleCustomization(flavor.id, PizzaHalf.HALF_1, CustomizationAction.ADD)
                    }
                    style={styles.checkboxItem}
                  />
                  <Checkbox.Item
                    label="Mitad 2"
                    status={
                      isCustomizationSelected(flavor.id, PizzaHalf.HALF_2, CustomizationAction.ADD)
                        ? 'checked'
                        : 'unchecked'
                    }
                    onPress={() =>
                      handleToggleCustomization(flavor.id, PizzaHalf.HALF_2, CustomizationAction.ADD)
                    }
                    style={styles.checkboxItem}
                  />
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>
      )}

      {ingredients.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingredientes Extra</Text>
          {ingredients.map((ingredient) => (
            <Card key={ingredient.id} style={styles.customizationCard}>
              <Card.Content>
                <View style={styles.customizationHeader}>
                  <Text style={styles.customizationName}>{ingredient.name}</Text>
                  <Chip compact>{ingredient.toppingValue} topping{ingredient.toppingValue !== 1 ? 's' : ''}</Chip>
                </View>
                <View style={styles.optionsRow}>
                  <Checkbox.Item
                    label="Pizza completa"
                    status={
                      isCustomizationSelected(ingredient.id, PizzaHalf.FULL, CustomizationAction.ADD)
                        ? 'checked'
                        : 'unchecked'
                    }
                    onPress={() =>
                      handleToggleCustomization(ingredient.id, PizzaHalf.FULL, CustomizationAction.ADD)
                    }
                    style={styles.checkboxItem}
                  />
                  <Checkbox.Item
                    label="Mitad 1"
                    status={
                      isCustomizationSelected(ingredient.id, PizzaHalf.HALF_1, CustomizationAction.ADD)
                        ? 'checked'
                        : 'unchecked'
                    }
                    onPress={() =>
                      handleToggleCustomization(ingredient.id, PizzaHalf.HALF_1, CustomizationAction.ADD)
                    }
                    style={styles.checkboxItem}
                  />
                  <Checkbox.Item
                    label="Mitad 2"
                    status={
                      isCustomizationSelected(ingredient.id, PizzaHalf.HALF_2, CustomizationAction.ADD)
                        ? 'checked'
                        : 'unchecked'
                    }
                    onPress={() =>
                      handleToggleCustomization(ingredient.id, PizzaHalf.HALF_2, CustomizationAction.ADD)
                    }
                    style={styles.checkboxItem}
                  />
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>
      )}

      <View style={styles.removalSection}>
        <Text style={styles.sectionTitle}>Quitar Ingredientes</Text>
        <Text style={styles.removalNote}>
          Selecciona los ingredientes que deseas quitar (no afecta el precio)
        </Text>
        <View style={styles.removalOptions}>
          {pizzaCustomizations.map((customization) => (
            <Chip
              key={`remove-${customization.id}`}
              style={styles.removalChip}
              selected={isCustomizationSelected(
                customization.id,
                PizzaHalf.FULL,
                CustomizationAction.REMOVE
              )}
              onPress={() =>
                handleToggleCustomization(
                  customization.id,
                  PizzaHalf.FULL,
                  CustomizationAction.REMOVE
                )
              }
            >
              Sin {customization.name}
            </Chip>
          ))}
        </View>
      </View>

      <Divider style={styles.divider} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    opacity: 0.7,
  },
  divider: {
    marginVertical: 16,
  },
  infoCard: {
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  customizationCard: {
    marginBottom: 12,
  },
  customizationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customizationName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  ingredientsText: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  checkboxItem: {
    flex: 1,
  },
  removalSection: {
    marginTop: 16,
  },
  removalNote: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 12,
  },
  removalOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  removalChip: {
    marginBottom: 8,
  },
});

export default PizzaCustomizationSection;