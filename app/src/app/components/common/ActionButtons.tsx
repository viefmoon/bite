import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Button } from 'react-native-paper';
import { useAppTheme } from '../../styles/theme';

interface ActionButton {
  icon?: string;
  label: string;
  onPress: () => void;
  mode?: 'text' | 'outlined' | 'contained' | 'elevated' | 'contained-tonal';
  loading?: boolean;
  disabled?: boolean;
  color?: string;
  textColor?: string;
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
  
  return (
    <View style={[styles.container, style]}>
      {buttons.map((button, index) => (
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
            button.color && { backgroundColor: button.color }
          ]}
          textColor={button.textColor}
          compact={compact}
        >
          {button.label}
        </Button>
      ))}
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