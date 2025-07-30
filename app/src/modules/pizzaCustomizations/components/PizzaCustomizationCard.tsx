import { View, StyleSheet } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import {
  CustomizationTypeEnum,
  type PizzaCustomization,
} from '../schema/pizzaCustomization.schema';

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
      marginBottom: theme.spacing.s,
    },
    content: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: -4,
    },
    info: {
      flex: 1,
    },
    name: {
      ...theme.fonts.titleMedium,
      color: theme.colors.onSurface,
      marginBottom: 2,
    },
    ingredients: {
      ...theme.fonts.bodySmall,
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
      lineHeight: 16,
    },
    chip: {
      marginRight: theme.spacing.xs,
      height: 24,
    },
    rightSection: {
      alignItems: 'flex-end',
      marginLeft: theme.spacing.s,
    },
    toppingValue: {
      ...theme.fonts.titleLarge,
      color: theme.colors.primary,
      fontWeight: 'bold',
    },
    toppingLabel: {
      ...theme.fonts.labelSmall,
      color: theme.colors.onSurfaceVariant,
      marginTop: -2,
    },
    cardContent: {
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    typeChip: {
      marginLeft: theme.spacing.s,
    },
    inactiveChip: {
      marginLeft: theme.spacing.xs,
    },
    chipText: {
      fontSize: 11,
    },
  });

  const getTypeLabel = (type: any) => {
    return type === CustomizationTypeEnum.FLAVOR ? 'Sabor' : 'Ingrediente';
  };

  const getTypeIcon = (type: any) => {
    return type === CustomizationTypeEnum.FLAVOR ? 'pizza' : 'food-variant';
  };

  return (
    <Card style={styles.card} onPress={onPress} mode="contained">
      <Card.Content style={styles.cardContent}>
        <View style={styles.content}>
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{customization.name}</Text>
              <Chip
                icon={getTypeIcon(customization.type)}
                style={[styles.chip, styles.typeChip]}
                compact
                textStyle={styles.chipText}
              >
                {getTypeLabel(customization.type)}
              </Chip>
              {!customization.isActive && (
                <Chip
                  icon="eye-off"
                  style={[styles.chip, styles.inactiveChip]}
                  compact
                  mode="outlined"
                  textStyle={styles.chipText}
                >
                  Inactivo
                </Chip>
              )}
            </View>

            {customization.ingredients && (
              <Text style={styles.ingredients} numberOfLines={1}>
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
