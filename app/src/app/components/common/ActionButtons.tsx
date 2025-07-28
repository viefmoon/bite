import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Button } from 'react-native-paper';
import { useAppTheme } from '../../styles/theme';

export interface ActionButton {
  icon?: string;
  label: string;
  onPress: () => void;
  mode?: 'text' | 'outlined' | 'contained' | 'elevated' | 'contained-tonal';
  loading?: boolean;
  disabled?: boolean;
  color?: string;
  textColor?: string;
  // Preset de color para estandarizar
  colorPreset?: 'primary' | 'secondary' | 'error' | 'success' | 'warning';
}

interface ActionButtonsProps {
  buttons: ActionButton[];
  style?: ViewStyle;
  buttonStyle?: ViewStyle;
  compact?: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  buttons,
  style,
  buttonStyle,
  compact = true,
}) => {
  const theme = useAppTheme();

  // Función para obtener colores basados en preset
  const getButtonColors = (button: ActionButton) => {
    if (button.colorPreset) {
      switch (button.colorPreset) {
        case 'primary':
          return {
            backgroundColor:
              button.mode === 'contained' ? theme.colors.primary : undefined,
            textColor:
              button.mode === 'contained'
                ? theme.colors.onPrimary
                : theme.colors.primary,
          };
        case 'secondary':
          return {
            backgroundColor:
              button.mode === 'contained' ? theme.colors.secondary : undefined,
            textColor:
              button.mode === 'contained'
                ? theme.colors.onSecondary
                : theme.colors.secondary,
          };
        case 'error':
          return {
            backgroundColor:
              button.mode === 'contained' ? theme.colors.error : undefined,
            textColor:
              button.mode === 'contained'
                ? theme.colors.onError
                : theme.colors.error,
          };
        case 'success':
          return {
            backgroundColor:
              button.mode === 'contained' ? '#10B981' : undefined,
            textColor: button.mode === 'contained' ? '#FFFFFF' : '#10B981',
          };
        case 'warning':
          return {
            backgroundColor:
              button.mode === 'contained' ? '#F59E0B' : undefined,
            textColor: button.mode === 'contained' ? '#FFFFFF' : '#F59E0B',
          };
      }
    }
    return {
      backgroundColor: button.color,
      textColor: button.textColor,
    };
  };

  return (
    <View style={[styles.container, style]}>
      {buttons.map((button, index) => {
        const colors = getButtonColors(button);
        return (
          <Button
            key={index}
            icon={button.icon}
            mode={button.mode || 'contained'}
            onPress={button.onPress}
            loading={button.loading}
            disabled={button.disabled}
            style={[
              styles.button,
              buttonStyle,
              colors.backgroundColor && {
                backgroundColor: colors.backgroundColor,
              },
            ]}
            textColor={colors.textColor}
            compact={compact}
          >
            {button.label}
          </Button>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
  },
});
