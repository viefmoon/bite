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

  // Función para obtener colores basados en preset o icono
  const getButtonColors = (button: ActionButton, detectedMode: string) => {
    // Auto-detectar preset basado en el icono si no se especifica
    let colorPreset = button.colorPreset;
    if (!colorPreset && button.icon) {
      if (button.icon === 'pencil' || button.icon === 'edit') {
        colorPreset = 'primary';
      } else if (button.icon === 'delete' || button.icon === 'trash-can') {
        colorPreset = 'error';
      }
    }

    if (colorPreset) {
      const isContained = detectedMode === 'contained';
      switch (colorPreset) {
        case 'primary':
          return {
            backgroundColor: isContained ? theme.colors.primary : undefined,
            textColor: isContained ? theme.colors.onPrimary : theme.colors.primary,
          };
        case 'secondary':
          return {
            backgroundColor: isContained ? theme.colors.secondary : undefined,
            textColor: isContained ? theme.colors.onSecondary : theme.colors.secondary,
          };
        case 'error':
          return {
            backgroundColor: isContained ? theme.colors.error : undefined,
            textColor: isContained ? theme.colors.onError : theme.colors.error,
          };
        case 'success':
          return {
            backgroundColor: isContained ? '#10B981' : undefined,
            textColor: isContained ? '#FFFFFF' : '#10B981',
          };
        case 'warning':
          return {
            backgroundColor: isContained ? '#F59E0B' : undefined,
            textColor: isContained ? '#FFFFFF' : '#F59E0B',
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
        // Auto-detectar mode basado en icono si no se especifica
        let buttonMode = button.mode;
        if (!buttonMode && button.icon) {
          if (button.icon === 'pencil' || button.icon === 'edit') {
            buttonMode = 'contained';
          } else if (button.icon === 'delete' || button.icon === 'trash-can') {
            buttonMode = 'outlined';
          }
        }
        buttonMode = buttonMode || 'contained';
        
        const colors = getButtonColors(button, buttonMode);
        
        return (
          <Button
            key={index}
            icon={button.icon}
            mode={buttonMode}
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
