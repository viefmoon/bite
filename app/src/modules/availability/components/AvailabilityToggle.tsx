import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Switch, Text, Surface } from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';

interface AvailabilityToggleProps {
  label: string;
  value: boolean;
  onToggle: (value: boolean) => void;
  disabled?: boolean;
  level?: number;
}

export const AvailabilityToggle: React.FC<AvailabilityToggleProps> = ({
  label,
  value,
  onToggle,
  disabled = false,
  level = 0,
}) => {
  const theme = useAppTheme();

  const containerStyle = [
    styles.container,
    { paddingLeft: 16 + level * 24 },
    level === 1 && styles.levelOne,
    level === 2 && styles.levelTwo,
    level === 3 && styles.levelThree,
  ];

  return (
    <Surface style={containerStyle} elevation={0}>
      <Text
        style={[
          styles.label,
          {
            ...theme.fonts.bodyLarge,
            color: disabled
              ? theme.colors.onSurfaceDisabled
              : theme.colors.onSurface,
            fontWeight: level <= 1 ? '500' : '400',
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        color={theme.colors.primary}
      />
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingRight: 16,
    backgroundColor: 'transparent',
  },
  levelOne: {
    paddingVertical: 12,
  },
  levelTwo: {
    paddingVertical: 10,
  },
  levelThree: {
    paddingVertical: 8,
  },
  label: {
    flex: 1,
    marginRight: 16,
  },
});
