import { memo, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Text,
  RadioButton,
  TouchableRipple,
  Card,
  Chip,
  Surface,
} from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import type { FullMenuModifierGroup, Modifier } from '../schema/orders.schema';
import type { CartItemModifier } from '../utils/cartUtils';
import type { AppTheme } from '@/app/styles/theme';

interface ModifierGroupProps {
  group: FullMenuModifierGroup;
  selectedModifiers: CartItemModifier[];
  onModifierToggle: (modifier: Modifier, group: FullMenuModifierGroup) => void;
  errorMessage?: string;
}

const ModifierGroup = memo<ModifierGroupProps>(
  ({ group, selectedModifiers, onModifierToggle, errorMessage }) => {
    const theme = useAppTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    if (!group.productModifiers || group.productModifiers.length === 0) {
      return null;
    }

    return (
      <Card style={styles.sectionCard}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <View style={styles.groupTitleContainer}>
              <Text style={styles.groupTitle}>{group.name}</Text>
              <View style={styles.selectionInfo}>
                {group.minSelections !== undefined &&
                  group.maxSelections !== undefined && (
                    <Text style={styles.selectionRules}>
                      {(group.minSelections || 0) === 0 &&
                      group.maxSelections === 1
                        ? 'Hasta 1 opción'
                        : (group.minSelections || 0) === group.maxSelections
                          ? `Elegir ${group.maxSelections}`
                          : `${group.minSelections || 0}-${group.maxSelections} opciones`}
                    </Text>
                  )}
                {group.allowMultipleSelections && (
                  <Text style={styles.selectedCount}>
                    ({selectedModifiers.length} seleccionadas)
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.chipContainer}>
              {errorMessage && (
                <Chip
                  mode="flat"
                  compact
                  style={styles.errorChip}
                  icon="alert-circle"
                  textStyle={styles.errorChipText}
                >
                  {errorMessage}
                </Chip>
              )}
              <Chip
                mode="flat"
                compact
                style={
                  group.isRequired ? styles.requiredChip : styles.optionalChip
                }
              >
                {group.isRequired ? 'Requerido' : 'Opcional'}
              </Chip>
            </View>
          </View>

          {group.allowMultipleSelections ? (
            <View style={styles.modifiersContainer}>
              {group.productModifiers.map((modifier: Modifier) => {
                const isSelected = selectedModifiers.some(
                  (mod) => mod.id === modifier.id,
                );

                return (
                  <Surface
                    key={modifier.id}
                    style={[
                      styles.modifierSurface,
                      isSelected && styles.modifierSurfaceSelected,
                      !modifier.isActive && styles.inactiveModifierSurface,
                    ]}
                    elevation={isSelected && modifier.isActive ? 1 : 0}
                  >
                    <TouchableRipple
                      onPress={() =>
                        modifier.isActive && onModifierToggle(modifier, group)
                      }
                      disabled={!modifier.isActive}
                      style={styles.modifierTouchable}
                    >
                      <View style={styles.modifierRow}>
                        <RadioButton
                          value={modifier.id}
                          status={isSelected ? 'checked' : 'unchecked'}
                          disabled={!modifier.isActive}
                          onPress={() =>
                            modifier.isActive &&
                            onModifierToggle(modifier, group)
                          }
                        />
                        <Text
                          style={[
                            styles.modifierName,
                            !modifier.isActive && styles.inactiveText,
                          ]}
                        >
                          {modifier.name}
                          {!modifier.isActive && ' (No disponible)'}
                        </Text>
                        {Number(modifier.price) > 0 && (
                          <Text
                            style={[
                              styles.modifierPrice,
                              !modifier.isActive && styles.inactiveText,
                            ]}
                          >
                            +${Number(modifier.price).toFixed(2)}
                          </Text>
                        )}
                      </View>
                    </TouchableRipple>
                  </Surface>
                );
              })}
            </View>
          ) : (
            <RadioButton.Group
              onValueChange={(value) => {
                const modifier = group.productModifiers?.find(
                  (m: Modifier) => m.id === value,
                );
                if (modifier) {
                  onModifierToggle(modifier, group);
                }
              }}
              value={selectedModifiers[0]?.id || ''}
            >
              <View style={styles.modifiersContainer}>
                {group.productModifiers.map((modifier: Modifier) => {
                  const isSelected = selectedModifiers[0]?.id === modifier.id;

                  return (
                    <Surface
                      key={modifier.id}
                      style={[
                        styles.modifierSurface,
                        isSelected && styles.modifierSurfaceSelected,
                        !modifier.isActive && styles.inactiveModifierSurface,
                      ]}
                      elevation={isSelected && modifier.isActive ? 1 : 0}
                    >
                      <TouchableRipple
                        onPress={() =>
                          modifier.isActive && onModifierToggle(modifier, group)
                        }
                        disabled={!modifier.isActive}
                        style={styles.modifierTouchable}
                      >
                        <View style={styles.modifierRow}>
                          <RadioButton
                            value={modifier.id}
                            status={isSelected ? 'checked' : 'unchecked'}
                            disabled={!modifier.isActive}
                            onPress={() =>
                              modifier.isActive &&
                              onModifierToggle(modifier, group)
                            }
                          />
                          <Text
                            style={[
                              styles.modifierName,
                              !modifier.isActive && styles.inactiveText,
                            ]}
                          >
                            {modifier.name}
                            {!modifier.isActive && ' (No disponible)'}
                          </Text>
                          {Number(modifier.price) > 0 && (
                            <Text
                              style={[
                                styles.modifierPrice,
                                !modifier.isActive && styles.inactiveText,
                              ]}
                            >
                              +${Number(modifier.price).toFixed(2)}
                            </Text>
                          )}
                        </View>
                      </TouchableRipple>
                    </Surface>
                  );
                })}
              </View>
            </RadioButton.Group>
          )}
        </Card.Content>
      </Card>
    );
  },
);

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    sectionCard: {
      marginBottom: theme.spacing.m,
      borderRadius: theme.roundness * 2,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.m,
    },
    groupTitleContainer: {
      flex: 1,
    },
    groupTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
    },
    selectionInfo: {
      marginTop: 2,
    },
    selectionRules: {
      fontSize: 10,
      color: theme.colors.onSurfaceVariant,
      marginBottom: theme.spacing.xs,
      fontStyle: 'italic',
    },
    selectedCount: {
      fontSize: 12,
      color: theme.colors.primary,
      fontWeight: '500',
      marginTop: 2,
    },
    chipContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    errorChip: {
      backgroundColor: theme.colors.errorContainer,
      marginRight: theme.spacing.xs,
    },
    errorChipText: {
      fontSize: 12,
    },
    requiredChip: {
      backgroundColor: theme.colors.errorContainer,
      marginLeft: theme.spacing.s,
    },
    optionalChip: {
      backgroundColor: theme.colors.secondaryContainer,
      marginLeft: theme.spacing.s,
    },
    modifiersContainer: {
      marginTop: theme.spacing.xs,
    },
    modifierSurface: {
      marginBottom: theme.spacing.xs,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.surfaceVariant,
    },
    modifierSurfaceSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryContainer,
    },
    inactiveModifierSurface: {
      opacity: 0.6,
      backgroundColor: theme.colors.surfaceDisabled,
    },
    modifierTouchable: {
      padding: 0,
    },
    modifierRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.s,
      paddingHorizontal: theme.spacing.xs,
    },
    modifierName: {
      flex: 1,
      fontSize: 15,
      marginLeft: theme.spacing.xs,
      color: theme.colors.onSurface,
    },
    modifierPrice: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.onSurfaceVariant,
      marginLeft: 'auto',
      paddingHorizontal: 8,
    },
    inactiveText: {
      color: theme.colors.onSurfaceDisabled,
      textDecorationLine: 'line-through',
    },
  });

ModifierGroup.displayName = 'ModifierGroup';

export default ModifierGroup;
