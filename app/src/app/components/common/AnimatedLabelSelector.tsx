import React, { useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Text,
  StyleProp,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { useAppTheme } from '@/app/styles/theme';
import { Icon, IconButton } from 'react-native-paper';

interface AnimatedLabelSelectorProps {
  label: string;
  value: string | null | undefined;
  onPress: () => void;
  onClear?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  valueStyle?: StyleProp<TextStyle>;
  labelStyle?: StyleProp<TextStyle>;
  activeLabelColor?: string;
  inactiveLabelColor?: string;
  borderColor?: string;
  activeBorderColor?: string;
  disabled?: boolean;
  isLoading?: boolean;
  error?: boolean;
  errorColor?: string;
}

const AnimatedLabelSelector: React.FC<AnimatedLabelSelectorProps> = ({
  label,
  value,
  onPress,
  onClear,
  containerStyle,
  valueStyle,
  labelStyle,
  activeLabelColor,
  inactiveLabelColor,
  borderColor: defaultBorderColor,
  activeBorderColor: focusedBorderColor,
  disabled = false,
  isLoading = false,
  error = false,
  errorColor: customErrorColor,
  ...rest
}) => {
  const theme = useAppTheme();

  const isActive = value != null && value !== '';
  const animation = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  const finalActiveLabelColor = activeLabelColor || theme.colors.primary;
  const finalInactiveLabelColor =
    inactiveLabelColor || theme.colors.onSurfaceVariant;
  const finalBorderColor = defaultBorderColor || theme.colors.outline;
  const finalActiveBorderColor = focusedBorderColor || theme.colors.primary;
  const finalErrorColor = customErrorColor || theme.colors.error;

  const currentBorderColor = disabled
    ? theme.colors.surfaceVariant
    : error
      ? finalErrorColor
      : isActive
        ? finalActiveBorderColor
        : finalBorderColor;

  useEffect(() => {
    Animated.timing(animation, {
      toValue: isActive ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isActive, animation]);

  const labelTranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -26],
  });

  const labelScale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.8],
  });

  const labelColor = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [finalInactiveLabelColor, finalActiveLabelColor],
  });

  const styles = StyleSheet.create({
    container: {
      borderWidth: 1,
      borderRadius: theme.roundness,
      paddingHorizontal: 12,
      paddingTop: 18,
      paddingBottom: 6,
      position: 'relative',
      backgroundColor: theme.colors.background,
      minHeight: 58,
      justifyContent: 'center',
      flex: 1,
    },
    outerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    label: {
      position: 'absolute',
      left: 12,
      top: 18,
      fontSize: 16,
      color: finalInactiveLabelColor,
      zIndex: 1,
    },
    valueContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 24,
    },
    valueText: {
      fontSize: 16,
      color: disabled ? theme.colors.onSurfaceDisabled : theme.colors.onSurface,
      flex: 1,
      marginRight: 5,
    },
    loader: {},
    iconsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    clearButtonContainer: {
      marginLeft: 8,
      height: 58,
      justifyContent: 'center',
    },
    clearButton: {
      margin: 0,
    },
    icon: {},
    disabledOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.dark
        ? 'rgba(0, 0, 0, 0.2)'
        : 'rgba(0, 0, 0, 0.05)',
      zIndex: 3,
      borderRadius: theme.roundness,
    },
  });

  const animatedLabelStyle = {
    transform: [{ translateY: labelTranslateY }, { scale: labelScale }],
    color: labelColor,
    backgroundColor: animation.interpolate({
      inputRange: [0, 1],
      outputRange: ['transparent', theme.colors.background],
    }),
  };

  // Estilos estáticos que no deben ser animados
  const staticLabelStyle = {
    paddingHorizontal: isActive ? 4 : 0,
    zIndex: isActive ? 2 : 0,
  };

  return (
    <View style={styles.outerContainer}>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || isLoading}
        style={[
          styles.container,
          { borderColor: currentBorderColor },
          containerStyle,
        ]}
        activeOpacity={0.7}
        {...rest}
      >
        <Animated.Text
          style={[
            styles.label,
            staticLabelStyle,
            labelStyle,
            animatedLabelStyle,
          ]}
          numberOfLines={1}
        >
          {label}
        </Animated.Text>
        <View style={styles.valueContainer}>
          <Text style={[styles.valueText, valueStyle]} numberOfLines={1}>
            {!isLoading ? value || ' ' : ' '}
          </Text>
          <View style={styles.iconsContainer}>
            {isLoading ? (
              <ActivityIndicator
                size="small"
                color={theme.colors.primary}
                style={styles.loader}
              />
            ) : (
              <Icon
                source="chevron-down"
                size={20}
                color={
                  disabled
                    ? theme.colors.onSurfaceDisabled
                    : theme.colors.onSurfaceVariant
                }
              />
            )}
          </View>
        </View>

        {disabled && <View style={styles.disabledOverlay} />}
      </TouchableOpacity>

      {isActive && !disabled && !isLoading && onClear && (
        <View style={styles.clearButtonContainer}>
          <IconButton
            icon="close-circle"
            size={24}
            onPress={onClear}
            iconColor={theme.colors.onSurfaceVariant}
            style={styles.clearButton}
            rippleColor="rgba(0, 0, 0, .1)"
          />
        </View>
      )}
    </View>
  );
};

export default AnimatedLabelSelector;
