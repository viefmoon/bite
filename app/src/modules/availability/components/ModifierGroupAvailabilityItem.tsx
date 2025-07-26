import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Switch } from 'react-native-paper';
import { ModifierGroupAvailability } from '../schema/availability.schema';
import { useOptimisticAvailability } from '../hooks/useOptimisticAvailability';
import { useAppTheme } from '@/app/styles/theme';
import { AvailabilityListItem } from './AvailabilityListItem';

interface ModifierGroupAvailabilityItemProps {
  modifierGroup: ModifierGroupAvailability;
}

export const ModifierGroupAvailabilityItem: React.FC<
  ModifierGroupAvailabilityItemProps
> = ({ modifierGroup }) => {
  const theme = useAppTheme();
  const [expanded, setExpanded] = useState(false);
  const updateAvailability = useOptimisticAvailability();

  const handleGroupToggle = (value: boolean) => {
    updateAvailability.mutate({
      type: 'modifierGroup',
      id: modifierGroup.id,
      isActive: value,
      cascade: true,
    });
  };

  const handleModifierToggle = (modifierId: string, value: boolean) => {
    updateAvailability.mutate({
      type: 'modifier',
      id: modifierId,
      isActive: value,
    });
  };

  const totalModifiers = modifierGroup.modifiers.length;
  const activeModifiers = modifierGroup.modifiers.filter(
    (m) => m.isActive,
  ).length;

  return (
    <AvailabilityListItem
      title={modifierGroup.name}
      subtitle={`${activeModifiers}/${totalModifiers} modificadores activos`}
      icon="tune-variant"
      isActive={modifierGroup.isActive}
      onToggle={handleGroupToggle}
      isExpanded={expanded}
      onToggleExpand={() => setExpanded(!expanded)}
    >
      <View style={styles.modifiersContainer}>
        {modifierGroup.modifiers.map((modifier) => (
          <View
            key={modifier.id}
            style={[
              styles.modifierItem,
              modifier.isActive
                ? styles.activeModifier
                : styles.inactiveModifier,
            ]}
          >
            <Text
              style={[
                styles.modifierTitle,
                !modifier.isActive && styles.strikethrough,
                { color: theme.colors.onSurface },
              ]}
            >
              {modifier.name}
            </Text>
            <Switch
              value={modifier.isActive}
              onValueChange={(value) =>
                handleModifierToggle(modifier.id, value)
              }
              disabled={!modifierGroup.isActive}
            />
          </View>
        ))}
      </View>
    </AvailabilityListItem>
  );
};

const styles = StyleSheet.create({
  modifiersContainer: {
    paddingLeft: 16,
  },
  modifierItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  modifierTitle: {
    fontSize: 13,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  activeModifier: {
    opacity: 1,
  },
  inactiveModifier: {
    opacity: 0.5,
  },
});
