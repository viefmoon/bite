import React, { useState } from 'react';
import { View, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useKitchenContext } from '../context/KitchenContext';

export const RefreshButton: React.FC = () => {
  const { refetchRef } = useKitchenContext();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scaleAnim = new Animated.Value(1);

  const handleRefresh = async () => {
    if (refetchRef.current && !isRefreshing) {
      // Animación de presión
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      setIsRefreshing(true);
      try {
        await refetchRef.current();
      } finally {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  };

  return (
    <Animated.View
      style={[styles.container, { transform: [{ scale: scaleAnim }] }]}
    >
      <TouchableOpacity
        style={[styles.button, isRefreshing && styles.buttonRefreshing]}
        onPress={handleRefresh}
        disabled={isRefreshing}
        activeOpacity={0.8}
      >
        <View style={styles.iconContainer}>
          {isRefreshing ? (
            <ActivityIndicator size={26} color="white" />
          ) : (
            <Icon name="refresh" size={26} color="white" />
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 8,
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonRefreshing: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  iconContainer: {
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
