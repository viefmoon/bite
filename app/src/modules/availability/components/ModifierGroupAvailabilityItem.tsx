import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Surface, Text, IconButton, Switch, Divider } from 'react-native-paper';
import { ModifierGroupAvailability } from '../types/availability.types';
import { useUpdateAvailability } from '../hooks/useAvailabilityQueries';
import { useAppTheme } from '@/app/styles/theme';

interface ModifierGroupAvailabilityItemProps {
  modifierGroup: ModifierGroupAvailability;
  onRefresh?: () => void;
}

export const ModifierGroupAvailabilityItem: React.FC<
  ModifierGroupAvailabilityItemProps
> = ({ modifierGroup, onRefresh }) => {
  const theme = useAppTheme();
  const [expanded, setExpanded] = useState(false);
  const updateAvailability = useUpdateAvailability();

  const handleGroupToggle = async (value: boolean) => {
    await updateAvailability.mutateAsync({
      type: 'modifierGroup',
      id: modifierGroup.id,
      isActive: value,
      cascade: true,
    });
    onRefresh?.();
  };

  const handleModifierToggle = async (modifierId: string, value: boolean) => {
    await updateAvailability.mutateAsync({
      type: 'modifier',
      id: modifierId,
      isActive: value,
    });
    onRefresh?.();
  };

  const unavailableCount = modifierGroup.modifiers.filter(
    (m) => !m.isActive,
  ).length;
  const totalModifiers = modifierGroup.modifiers.length;
  const activeModifiers = totalModifiers - unavailableCount;

  return (
    <Surface
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
      elevation={1}
    >
      {/* Header del grupo de modificadores */}
      <TouchableOpacity
        style={[
          styles.groupHeader,
          {
            backgroundColor: theme.colors.elevation.level2,
            opacity: modifierGroup.isActive ? 1 : 0.7,
          },
        ]}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.groupLeft}>
          <View
            style={[
              styles.groupIcon,
              {
                backgroundColor: modifierGroup.isActive
                  ? theme.colors.secondaryContainer
                  : theme.colors.surfaceVariant,
              },
            ]}
          >
            <IconButton
              icon="tune-variant"
              size={20}
              iconColor={
                modifierGroup.isActive
                  ? theme.colors.secondary
                  : theme.colors.outline
              }
              style={{ margin: 0 }}
            />
          </View>
          <View style={styles.groupInfo}>
            <Text
              style={[styles.groupTitle, { color: theme.colors.onSurface }]}
              numberOfLines={1}
            >
              {modifierGroup.name}
            </Text>
            <Text
              style={[
                styles.groupSubtitle,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {activeModifiers}/{totalModifiers} modificadores activos
            </Text>
          </View>
        </View>

        <View style={styles.groupRight}>
          <Switch
            value={modifierGroup.isActive}
            onValueChange={handleGroupToggle}
            color={theme.colors.primary}
            style={styles.groupSwitch}
          />
          <IconButton
            icon={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            iconColor={theme.colors.onSurfaceVariant}
            style={{ margin: 0 }}
          />
        </View>
      </TouchableOpacity>

      {/* Contenido expandible */}
      {expanded && (
        <View
          style={[
            styles.expandedContent,
            { backgroundColor: theme.colors.elevation.level1 },
          ]}
        >
          <View style={styles.modifiersContainer}>
            {modifierGroup.modifiers.map((modifier, index) => (
              <View
                key={modifier.id}
                style={[
                  styles.modifierItem,
                  {
                    backgroundColor: theme.colors.surface,
                    opacity:
                      !modifierGroup.isActive || !modifier.isActive ? 0.5 : 1,
                  },
                ]}
              >
                <View style={styles.modifierLeft}>
                  <View
                    style={[
                      styles.modifierDot,
                      {
                        backgroundColor: modifier.isActive
                          ? theme.colors.secondary
                          : theme.colors.error,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.modifierTitle,
                      {
                        color: modifier.isActive
                          ? theme.colors.onSurface
                          : theme.colors.onSurfaceDisabled,
                        textDecorationLine: !modifier.isActive
                          ? 'line-through'
                          : 'none',
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {modifier.name}
                  </Text>
                </View>
                <Switch
                  value={modifier.isActive}
                  onValueChange={(value) =>
                    handleModifierToggle(modifier.id, value)
                  }
                  color={theme.colors.primary}
                  disabled={!modifierGroup.isActive}
                />
              </View>
            ))}
          </View>
        </View>
      )}
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  groupLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  groupSubtitle: {
    fontSize: 12,
    opacity: 0.8,
  },
  groupRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupSwitch: {
    marginHorizontal: 8,
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    marginTop: 2,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  modifiersContainer: {
    marginLeft: 12,
    marginTop: 4,
  },
  modifierItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
    marginHorizontal: 4,
  },
  modifierLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modifierDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 12,
  },
  modifierTitle: {
    fontSize: 14,
    flex: 1,
  },
});
