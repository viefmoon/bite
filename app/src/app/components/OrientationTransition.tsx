import React, { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useAppTheme } from '../styles/theme';

interface OrientationTransitionProps {
  children: React.ReactNode;
  targetOrientation?: ScreenOrientation.OrientationLock;
}

const TRANSITION_DELAYS = {
  UNLOCK: 100,
  LOCK: 300,
} as const;

export const OrientationTransition: React.FC<OrientationTransitionProps> = ({
  children,
  targetOrientation = ScreenOrientation.OrientationLock.PORTRAIT_UP,
}) => {
  const theme = useAppTheme();
  const [isTransitioning, setIsTransitioning] = useState(Platform.OS !== 'web');

  const handleOrientationChange = useCallback(async () => {
    // Skip orientation changes on web
    if (Platform.OS === 'web') {
      return;
    }
    
    setIsTransitioning(true);
    
    try {
      await ScreenOrientation.unlockAsync();
      await new Promise(resolve => setTimeout(resolve, TRANSITION_DELAYS.UNLOCK));
      await ScreenOrientation.lockAsync(targetOrientation);
      await new Promise(resolve => setTimeout(resolve, TRANSITION_DELAYS.LOCK));
    } catch (error) {
      // Silently handle orientation errors
    } finally {
      setIsTransitioning(false);
    }
  }, [targetOrientation]);

  useEffect(() => {
    handleOrientationChange();
  }, [handleOrientationChange]);

  if (isTransitioning && Platform.OS !== 'web') {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.text, { color: theme.colors.onBackground }]}>
          Ajustando pantalla...
        </Text>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
  },
});