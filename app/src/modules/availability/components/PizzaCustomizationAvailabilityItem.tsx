import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Surface,
  Text,
  Switch,
  useTheme,
  Chip,
  IconButton,
  Divider,
} from 'react-native-paper';
import { PizzaCustomizationGroupAvailability } from '../types/availability.types';
import { useOptimisticAvailability } from '../hooks/useOptimisticAvailability';

interface PizzaCustomizationAvailabilityItemProps {
  group: PizzaCustomizationGroupAvailability;
}

export function PizzaCustomizationAvailabilityItem({
  group,
}: PizzaCustomizationAvailabilityItemProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const updateAvailability = useOptimisticAvailability();

  const handleToggle = (id: string, currentState: boolean) => {
    updateAvailability.mutate({
      type: 'pizzaCustomization',
      id,
      isActive: !currentState,
    });
  };

  const activeCount = group.items.filter((item) => item.isActive).length;
  const totalCount = group.items.length;
  const allActive = activeCount === totalCount;
  const someActive = activeCount > 0 && activeCount < totalCount;

  const styles = StyleSheet.create({
    container: {
      marginHorizontal: 16,
      marginVertical: 8,
      borderRadius: 12,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: theme.colors.elevation.level2,
    },
    headerContent: {
      flex: 1,
      marginRight: 8,
    },
    headerTitle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    typeChip: {
      height: 24,
    },
    chipText: {
      fontSize: 11,
      marginHorizontal: 4,
      marginVertical: 0,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    expandButton: {
      margin: 0,
    },
    content: {
      backgroundColor: theme.colors.surface,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      minHeight: 56,
    },
    itemContent: {
      flex: 1,
      marginRight: 8,
    },
    itemName: {
      fontSize: 16,
      color: theme.colors.onSurface,
    },
    inactiveText: {
      color: theme.colors.onSurfaceVariant,
      textDecorationLine: 'line-through',
    },
  });

  const getTypeIcon = () => {
    return group.type === 'FLAVOR' ? 'pizza' : 'cheese';
  };

  const getTypeLabel = () => {
    return group.type === 'FLAVOR' ? 'Sabores' : 'Ingredientes';
  };

  const getTypeColor = () => {
    return group.type === 'FLAVOR'
      ? theme.colors.errorContainer
      : theme.colors.secondaryContainer;
  };

  return (
    <Surface style={styles.container} elevation={1}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTitle}>
            <Text style={styles.title}>{getTypeLabel()}</Text>
            <Chip
              mode="flat"
              compact
              icon={getTypeIcon()}
              style={[styles.typeChip, { backgroundColor: getTypeColor() }]}
              textStyle={styles.chipText}
            >
              {totalCount}
            </Chip>
          </View>
          <Text style={styles.subtitle}>
            {allActive && 'Todos disponibles'}
            {!allActive && !someActive && 'Ninguno disponible'}
            {someActive && `${activeCount} de ${totalCount} disponibles`}
          </Text>
        </View>
        <IconButton
          icon={expanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          onPress={() => setExpanded(!expanded)}
          style={styles.expandButton}
        />
      </View>

      {expanded && (
        <View style={styles.content}>
          <Divider />
          {group.items.map((item, index) => (
            <React.Fragment key={item.id}>
              <View style={styles.item}>
                <View style={styles.itemContent}>
                  <Text
                    style={[
                      styles.itemName,
                      !item.isActive && styles.inactiveText,
                    ]}
                  >
                    {item.name}
                  </Text>
                </View>
                <Switch
                  value={item.isActive}
                  onValueChange={() => handleToggle(item.id, item.isActive)}
                  color={theme.colors.primary}
                />
              </View>
              {index < group.items.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </View>
      )}
    </Surface>
  );
}
