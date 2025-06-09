import React, { useRef, useState, useCallback } from "react";
import { StyleSheet, View, Animated } from "react-native";
import { IconButton, Badge, useTheme } from "react-native-paper";

interface CartButtonProps {
  itemCount: number;
  onPress: () => void;
}

const CartButton = React.forwardRef(
  ({ itemCount, onPress }: CartButtonProps, ref) => {
    const theme = useTheme();
    const cartBadgeScale = useRef(new Animated.Value(1)).current;
    const cartBounceAnimation = useRef(new Animated.Value(1)).current;
    const isPressedRef = useRef(false);

    const styles = StyleSheet.create({
      cartButton: {
        margin: 0,
        backgroundColor: theme.colors.surfaceVariant,
      },
      cartBadge: {
        position: "absolute",
        top: 0,
        right: 0,
        backgroundColor: theme.colors.error,
      },
    });

    const animateCartButton = () => {
      Animated.sequence([
        Animated.timing(cartBounceAnimation, {
          toValue: 1.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(cartBounceAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.sequence([
        Animated.timing(cartBadgeScale, {
          toValue: 1.6,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(cartBadgeScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    };

    React.useImperativeHandle(ref, () => ({
      animate: animateCartButton,
    }));

    const handlePress = useCallback(() => {
      if (isPressedRef.current) return; // Prevenir múltiples clics
      
      isPressedRef.current = true;
      onPress();
      
      // Re-habilitar después de 150ms
      setTimeout(() => {
        isPressedRef.current = false;
      }, 150);
    }, [onPress]);

    return (
      <View>
        <Animated.View style={{ transform: [{ scale: cartBounceAnimation }] }}>
          <IconButton
            icon="cart-outline"
            iconColor={theme.colors.primary}
            size={30}
            onPress={handlePress}
            style={styles.cartButton}
          />
        </Animated.View>
        {itemCount > 0 && (
          <Animated.View
            style={{
              transform: [{ scale: cartBadgeScale }],
              position: "absolute",
              top: 0,
              right: 0,
            }}
          >
            <Badge style={styles.cartBadge} size={22}>
              {itemCount}
            </Badge>
          </Animated.View>
        )}
      </View>
    );
  }
);

export default CartButton;
