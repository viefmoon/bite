import { useState, useRef, useEffect, forwardRef, useMemo } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
  StyleProp,
  ViewStyle,
  TextStyle,
  TouchableWithoutFeedback,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import { useResponsive } from '@/app/hooks/useResponsive';

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

const AnimatedLabelInput = forwardRef<TextInput, AnimatedLabelInputProps>(
  (
    {
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
    },
    ref,
  ) => {
    const theme = useAppTheme();
    const responsive = useResponsive();
    const [isFocused, setIsFocused] = useState(false);
    const animation = useSharedValue(value ? 1 : 0);

    const isActive = isFocused || (value != null && value !== '');

    const finalActiveLabelColor = activeLabelColor || theme.colors.primary;
    const finalInactiveLabelColor =
      inactiveLabelColor || theme.colors.onSurfaceVariant;
    const finalBorderColor = defaultBorderColor || theme.colors.outline;
    const finalActiveBorderColor = focusedBorderColor || theme.colors.primary;
    const finalErrorColor = customErrorColor || theme.colors.error;

    useEffect(() => {
      animation.value = withTiming(isActive ? 1 : 0, {
        duration: 150,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      });
    }, [isActive, animation]);

    const handleFocus = (e: any) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: any) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    // Usar ref externa o crear una nueva
    const inputRef = useRef<TextInput>(null);
    const finalRef = ref || inputRef;

    const currentBorderColor = error
      ? finalErrorColor
      : isFocused
        ? finalActiveBorderColor
        : finalBorderColor;

    const styles = useMemo(
      () =>
        createStyles(theme, responsive, {
          multiline,
          disabled,
          finalInactiveLabelColor,
        }),
      [theme, responsive, multiline, disabled, finalInactiveLabelColor],
    );

    const animatedLabelStyle = useAnimatedStyle(() => {
      const translateY = interpolate(animation.value, [0, 1], [0, -28]);
      const translateX = interpolate(animation.value, [0, 1], [0, -4]);
      const scale = interpolate(animation.value, [0, 1], [1, 0.8]);
      const color = interpolateColor(
        animation.value,
        [0, 1],
        [finalInactiveLabelColor, finalActiveLabelColor],
      );

      return {
        transform: [{ translateX }, { translateY }, { scale }],
        color,
        backgroundColor: theme.colors.background,
        maxWidth: isActive ? '85%' : '90%',
      };
    });

    // Estilos estáticos que no deben ser animados
    const staticLabelStyle = {
      paddingHorizontal: isActive ? 4 : 0,
      paddingVertical: isActive ? 1 : 0,
    };

    const handleContainerPress = () => {
      if (
        !disabled &&
        finalRef &&
        typeof finalRef !== 'function' &&
        finalRef.current
      ) {
        finalRef.current.focus();
      }
    };

    return (
      <TouchableWithoutFeedback
        onPress={handleContainerPress}
        disabled={disabled}
      >
        <View
          style={[
            styles.container,
            { borderColor: currentBorderColor },
            containerStyle,
          ]}
        >
          {/* Línea de fondo para crear efecto de muesca en el borde */}
          <Animated.View
            style={[
              styles.backgroundLine,
              {
                backgroundColor: theme.colors.background,
                width: Math.min(label.length * 6.5 + 16, 200),
              },
              useAnimatedStyle(() => ({
                opacity: interpolate(animation.value, [0, 0.5, 1], [0, 0.8, 1]),
                transform: [
                  { scaleX: interpolate(animation.value, [0, 1], [0, 1]) },
                ],
              })),
            ]}
          />
          <Animated.Text
            style={[
              styles.label,
              staticLabelStyle,
              labelStyle,
              {
                position: 'absolute',
                top: 20,
                left: 12,
                zIndex: 10,
              },
              animatedLabelStyle,
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {label}
          </Animated.Text>
          <View style={[styles.inputContainer, styles.inputBoxNone]}>
            <TextInput
              ref={finalRef}
              value={value}
              onChangeText={onChangeText}
              onFocus={handleFocus}
              onBlur={handleBlur}
              style={[styles.input, inputStyle, style]}
              placeholder=""
              editable={!disabled}
              pointerEvents={disabled ? 'none' : 'auto'}
              underlineColorAndroid="transparent"
              placeholderTextColor={finalInactiveLabelColor}
              multiline={multiline}
              autoCorrect={false}
              keyboardAppearance={theme.dark ? 'dark' : 'light'}
              {...rest}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  },
);

AnimatedLabelInput.displayName = 'AnimatedLabelInput';

const createStyles = (
  theme: AppTheme,
  responsive: ReturnType<typeof useResponsive>,
  props: {
    multiline?: boolean;
    disabled: boolean;
    finalInactiveLabelColor: string;
  },
) =>
  StyleSheet.create({
    container: {
      borderWidth: 1,
      borderRadius: theme.roundness,
      paddingHorizontal: responsive.spacing(theme.spacing.m),
      position: 'relative',
      backgroundColor: theme.colors.background,
      minHeight: responsive.isTablet ? 52 : 58,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: props.multiline ? 'flex-start' : 'center',
      paddingTop: responsive.isTablet ? 16 : 18,
      paddingBottom: responsive.isTablet ? 4 : 6,
      minHeight: responsive.isTablet ? 36 : 40,
    },
    label: {
      fontSize: responsive.fontSize(16),
      color: props.finalInactiveLabelColor,
    },
    input: {
      flex: 1,
      fontSize: responsive.fontSize(16),
      color: props.disabled
        ? theme.colors.onSurfaceDisabled
        : theme.colors.onSurface,
      paddingVertical: 0,
      paddingHorizontal: 0,
      margin: 0,
      borderWidth: 0,
      backgroundColor: 'transparent',
      textAlignVertical: props.multiline ? 'top' : 'center',
    },
    backgroundLine: {
      position: 'absolute',
      top: -1, // Sobre el borde superior
      left: 10,
      height: 2, // Mismo grosor que el borde
      zIndex: 5,
    },
    inputBoxNone: {
      pointerEvents: 'box-none',
    },
  });

export default AnimatedLabelInput;
