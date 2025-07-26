import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
  ScrollView,
} from 'react-native';
import { Portal } from 'react-native-paper';
import { useAppTheme } from '../../styles/theme';

interface WebDrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  drawerContent: React.ReactNode;
  drawerWidth?: number;
}

export function WebDrawer({
  open,
  onClose,
  children,
  drawerContent,
  drawerWidth = 320,
}: WebDrawerProps) {
  const theme = useAppTheme();
  const slideAnim = React.useRef(new Animated.Value(-drawerWidth)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      // Abrir drawer
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Cerrar drawer
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -drawerWidth,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [open, slideAnim, fadeAnim, drawerWidth]);

  // Manejar ESC para cerrar
  useEffect(() => {
    if (Platform.OS === 'web' && open) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, onClose]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 998,
    },
    drawer: {
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      width: drawerWidth,
      backgroundColor: theme.colors.surface,
      elevation: 16,
      shadowColor: '#000',
      shadowOffset: { width: 2, height: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      zIndex: 999,
      borderRightWidth: 1,
      borderRightColor: theme.colors.outlineVariant,
    },
    scrollViewContent: {
      flexGrow: 1,
    },
  });

  // Solo mostrar el drawer personalizado en web
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      {children}
      {open && (
        <Portal>
          <Animated.View
            style={[
              styles.overlay,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          </Animated.View>
          <Animated.View
            style={[
              styles.drawer,
              {
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            <ScrollView
              contentContainerStyle={styles.scrollViewContent}
              showsVerticalScrollIndicator={false}
            >
              {drawerContent}
            </ScrollView>
          </Animated.View>
        </Portal>
      )}
    </View>
  );
}
