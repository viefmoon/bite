import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Animated,
  StyleSheet,
  TextInputProps,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useAppTheme } from '@/app/styles/theme';

interface AnimatedLabelInputProps extends TextInputProps {
  label: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  labelStyle?: StyleProp<TextStyle>;
  activeLabelColor?: string;
  inactiveLabelColor?: string;
  borderColor?: string;
  activeBorderColor?: string;
  error?: boolean;
  errorColor?: string;
  disabled?: boolean; 
}

const AnimatedLabelInput: React.FC<AnimatedLabelInputProps> = ({
  label,
  value,
  onChangeText,
  onFocus,
  onBlur,
  style,
  containerStyle,
  inputStyle,
  labelStyle,
  activeLabelColor,
  inactiveLabelColor,
  borderColor: defaultBorderColor,
  activeBorderColor: focusedBorderColor,
  error = false,
  errorColor: customErrorColor,
  multiline,
  disabled = false, // Añadir disabled a las props destructuradas
  ...rest
}) => {
  const theme = useAppTheme();
  const [isFocused, setIsFocused] = useState(false);
  const animation = useRef(new Animated.Value(value ? 1 : 0)).current;

  const isActive = isFocused || (value != null && value !== '');

  const finalActiveLabelColor = activeLabelColor || theme.colors.primary;
  const finalInactiveLabelColor = inactiveLabelColor || theme.colors.onSurfaceVariant;
  const finalBorderColor = defaultBorderColor || theme.colors.outline;
  const finalActiveBorderColor = focusedBorderColor || theme.colors.primary;
  const finalErrorColor = customErrorColor || theme.colors.error;

  useEffect(() => {
    Animated.timing(animation, {
      toValue: isActive ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isActive, animation]);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const labelScale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.75],
  });

  const labelColor = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [finalInactiveLabelColor, finalActiveLabelColor],
  });

  const currentBorderColor = error
    ? finalErrorColor
    : isFocused
      ? finalActiveBorderColor
      : finalBorderColor;

  const styles = StyleSheet.create({
    container: {
      borderWidth: 1,
      borderRadius: theme.roundness,
      paddingHorizontal: 12,
      position: 'relative',
      backgroundColor: theme.colors.background,
      minHeight: 58,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: multiline ? 'flex-start' : 'center',
      paddingTop: 18,
      paddingBottom: 6,
      minHeight: 40,
    },
    label: {
      fontSize: 16,
      color: finalInactiveLabelColor,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: disabled ? theme.colors.onSurfaceDisabled : theme.colors.onSurface, // Aplicar color si está deshabilitado
      paddingVertical: 0,
      paddingHorizontal: 0,
      margin: 0,
      borderWidth: 0,
      backgroundColor: 'transparent',
      textAlignVertical: multiline ? 'top' : 'center',
    },
  });

  const animatedTranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -28],
  });

  const animatedTranslateX = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -4],
  });

  const animatedLabelStyle = {
    position: 'absolute' as 'absolute',
    top: 18,
    left: 12,
    zIndex: 1,
    transform: [
      { translateX: animatedTranslateX },
      { translateY: animatedTranslateY },
      { scale: labelScale },
    ],
    color: labelColor,
    backgroundColor: animation.interpolate({
        inputRange: [0, 1],
        outputRange: ['transparent', theme.colors.background]
    }),
    paddingHorizontal: animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 4]
    }),
    maxWidth: '90%' as `${number}%`,
  };

  return (
    <View style={[styles.container, { borderColor: currentBorderColor }, containerStyle]}>
      <Animated.Text style={[styles.label, labelStyle, animatedLabelStyle]}>
        {label}
      </Animated.Text>
      <View style={styles.inputContainer}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[styles.input, inputStyle, style]}
          placeholder=""
          underlineColorAndroid="transparent"
          placeholderTextColor={finalInactiveLabelColor}
          multiline={multiline}
          editable={!disabled}
          {...rest}
        />
      </View>
    </View>
  );
};

export default AnimatedLabelInput;