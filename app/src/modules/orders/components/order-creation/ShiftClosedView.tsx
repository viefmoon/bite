import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Appbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/app/styles/theme';
import { useResponsive } from '@/app/hooks/useResponsive';

interface ShiftClosedViewProps {
  onBack: () => void;
  userCanOpenShift: boolean;
}

export const ShiftClosedView: React.FC<ShiftClosedViewProps> = ({
  onBack,
  userCanOpenShift,
}) => {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const { colors, fonts } = theme;

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    appBar: {
      backgroundColor: colors.elevation.level2,
      alignItems: 'center',
    },
    appBarTitle: {
      ...fonts.titleMedium,
      color: colors.onSurface,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    appBarContent: {},
    emptyStateContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: responsive.spacing.l,
    },
    emptyStateTitle: {
      marginTop: responsive.spacing.l,
      marginBottom: responsive.spacing.m,
      textAlign: 'center',
      color: colors.onSurface,
      fontWeight: '600',
    },
    emptyStateText: {
      textAlign: 'center',
      color: colors.onSurfaceVariant,
      maxWidth: 320,
      lineHeight: 24,
    },
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <Appbar.Header style={styles.appBar} elevated>
        <Appbar.BackAction onPress={onBack} />
        <Appbar.Content
          title="Crear Orden"
          titleStyle={styles.appBarTitle}
          style={styles.appBarContent}
        />
      </Appbar.Header>
      <View style={styles.emptyStateContainer}>
        <MaterialCommunityIcons
          name="store-alert"
          size={64}
          color={theme.colors.onSurfaceVariant}
        />
        <Text variant="headlineSmall" style={styles.emptyStateTitle}>
          Turno Cerrado
        </Text>
        <Text variant="bodyLarge" style={styles.emptyStateText}>
          {userCanOpenShift
            ? 'Para crear órdenes, primero debes abrir el turno usando el indicador en la barra superior.'
            : 'El turno debe estar abierto para crear órdenes. Contacta a un administrador.'}
        </Text>
      </View>
    </SafeAreaView>
  );
};
