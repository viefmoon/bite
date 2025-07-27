import React, { useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  StyleProp,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import { useResponsive } from '@/app/hooks/useResponsive';
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
  const responsive = useResponsive();

  const isActive = value != null && value !== '';
  const animation = useSharedValue(isActive ? 1 : 0);

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
    animation.value = withTiming(isActive ? 1 : 0, {
      duration: 200,
    });
  }, [isActive, animation]);

  const styles = React.useMemo(
    () =>
      createStyles(theme, responsive, {
        disabled,
        finalInactiveLabelColor,
      }),
    [theme, responsive, disabled, finalInactiveLabelColor],
  );

  const animatedLabelStyle = useAnimatedStyle(() => {
    const translateY = interpolate(animation.value, [0, 1], [0, -26]);
    const scale = interpolate(animation.value, [0, 1], [1, 0.8]);
    const color = interpolateColor(
      animation.value,
      [0, 1],
      [finalInactiveLabelColor, finalActiveLabelColor],
    );
    const backgroundColor = interpolateColor(
      animation.value,
      [0, 1],
      ['transparent', theme.colors.background],
    );

    return {
      transform: [{ translateY }, { scale }],
      color,
      backgroundColor,
    };
  });

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

const createStyles = (
  theme: AppTheme,
  responsive: ReturnType<typeof useResponsive>,
  props: {
    disabled: boolean;
    finalInactiveLabelColor: string;
  },
) =>
  StyleSheet.create({
    container: {
      borderWidth: 1,
      borderRadius: theme.roundness,
      paddingHorizontal: responsive.spacing(theme.spacing.m),
      paddingTop: responsive.isTablet ? 16 : 18,
      paddingBottom: responsive.isTablet ? 4 : 6,
      position: 'relative',
      backgroundColor: theme.colors.background,
      minHeight: responsive.isTablet ? 52 : 58,
      justifyContent: 'center',
      flex: 1,
    },
    outerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    label: {
      position: 'absolute',
      left: responsive.spacing(theme.spacing.m),
      top: responsive.isTablet ? 16 : 18,
      fontSize: responsive.fontSize(16),
      color: props.finalInactiveLabelColor,
      zIndex: 1,
    },
    valueContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: responsive.isTablet ? 20 : 24,
    },
    valueText: {
      fontSize: responsive.fontSize(16),
      color: props.disabled
        ? theme.colors.onSurfaceDisabled
        : theme.colors.onSurface,
      flex: 1,
      marginRight: responsive.spacing(theme.spacing.xs),
    },
    loader: {},
    iconsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    clearButtonContainer: {
      marginLeft: responsive.spacing(theme.spacing.s),
      height: responsive.isTablet ? 52 : 58,
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

export default AnimatedLabelSelector;
