import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Switch, Divider } from 'react-native-paper';
import { PizzaCustomizationGroupAvailability } from '../types/availability.types';
import { useOptimisticAvailability } from '../hooks/useOptimisticAvailability';
import { useAppTheme } from '@/app/styles/theme';
import { AvailabilityListItem } from './AvailabilityListItem';

interface PizzaCustomizationAvailabilityItemProps {
  group: PizzaCustomizationGroupAvailability;
}

export function PizzaCustomizationAvailabilityItem({
  group,
}: PizzaCustomizationAvailabilityItemProps) {
  const theme = useAppTheme();
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

  const getTypeIcon = () => {
    return group.type === 'FLAVOR' ? 'pizza' : 'cheese';
  };

  const getTypeLabel = () => {
    return group.type === 'FLAVOR' ? 'Sabores' : 'Ingredientes';
  };

  const getSubtitle = () => {
    if (allActive) return 'Todos disponibles';
    if (!allActive && !someActive) return 'Ninguno disponible';
    return `${activeCount} de ${totalCount} disponibles`;
  };

  return (
    <AvailabilityListItem
      title={getTypeLabel()}
      subtitle={getSubtitle()}
      icon={getTypeIcon()}
      isActive={allActive}
      onToggle={() => {}} // No toggle para el grupo completo en este caso
      isExpanded={expanded}
      onToggleExpand={() => setExpanded(!expanded)}
    >
      {group.items.map((item, index) => (
        <React.Fragment key={item.id}>
          <View style={styles.item}>
            <Text style={[
              styles.itemName,
              !item.isActive && styles.strikethrough,
              { color: theme.colors.onSurface }
            ]}>
              {item.name}
            </Text>
            <Switch
              value={item.isActive}
              onValueChange={() => handleToggle(item.id, item.isActive)}
            />
          </View>
          {index < group.items.length - 1 && <Divider style={styles.divider} />}
        </React.Fragment>
      ))}
    </AvailabilityListItem>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  itemName: {
    fontSize: 13,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  divider: {
    marginVertical: 8,
  },
});