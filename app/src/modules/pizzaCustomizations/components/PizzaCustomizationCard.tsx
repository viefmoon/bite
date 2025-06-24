import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Chip, IconButton } from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import {
  CustomizationType,
  type PizzaCustomization,
} from '../types/pizzaCustomization.types';

interface PizzaCustomizationCardProps {
  customization: PizzaCustomization;
  onPress: () => void;
}

export function PizzaCustomizationCard({
  customization,
  onPress,
}: PizzaCustomizationCardProps) {
  const theme = useAppTheme();

  const styles = StyleSheet.create({
    card: {
      marginBottom: theme.spacing.m,
    },
    content: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    info: {
      flex: 1,
    },
    name: {
      ...theme.fonts.titleMedium,
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.xs,
    },
    details: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.s,
      marginBottom: theme.spacing.xs,
    },
    ingredients: {
      ...theme.fonts.bodySmall,
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
    },
    chip: {
      marginRight: theme.spacing.xs,
    },
    rightSection: {
      alignItems: 'flex-end',
    },
    toppingValue: {
      ...theme.fonts.headlineSmall,
      color: theme.colors.primary,
      fontWeight: 'bold',
    },
    toppingLabel: {
      ...theme.fonts.labelSmall,
      color: theme.colors.onSurfaceVariant,
    },
  });

  const getTypeLabel = (type: CustomizationType) => {
    return type === CustomizationType.FLAVOR ? 'Sabor' : 'Ingrediente';
  };

  const getTypeIcon = (type: CustomizationType) => {
    return type === CustomizationType.FLAVOR ? 'pizza' : 'food-variant';
  };

  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content>
        <View style={styles.content}>
          <View style={styles.info}>
            <Text style={styles.name}>{customization.name}</Text>

            <View style={styles.details}>
              <Chip
                icon={getTypeIcon(customization.type)}
                style={styles.chip}
                compact
              >
                {getTypeLabel(customization.type)}
              </Chip>

              {!customization.isActive && (
                <Chip
                  icon="eye-off"
                  style={styles.chip}
                  compact
                  mode="outlined"
                >
                  Inactivo
                </Chip>
              )}
            </View>

            {customization.ingredients && (
              <Text style={styles.ingredients} numberOfLines={2}>
                {customization.ingredients}
              </Text>
            )}
          </View>

          <View style={styles.rightSection}>
            <Text style={styles.toppingValue}>
              {customization.toppingValue}
            </Text>
            <Text style={styles.toppingLabel}>
              topping{customization.toppingValue !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}
