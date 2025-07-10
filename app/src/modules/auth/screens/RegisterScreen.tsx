import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Surface, Text } from 'react-native-paper';

import { RegisterForm } from '../components/RegisterForm';
import { useAppTheme } from '../../../app/styles/theme';
import { useResponsive } from '../../../app/hooks/useResponsive';

export default function RegisterScreen() {
  const theme = useAppTheme();
  const responsive = useResponsive();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        contentContainer: {
          flexGrow: 1,
          padding: responsive.spacing.l,
          justifyContent: 'center',
        },
        surface: {
          padding: responsive.spacing.l,
          borderRadius: theme.roundness * 2,
          maxWidth: responsive.isTablet ? 600 : '100%',
          alignSelf: 'center',
          width: '100%',
        },
        title: {
          marginBottom: responsive.spacing.m,
          textAlign: 'center',
          fontSize: responsive.fontSize.xl,
        },
      }),
    [theme, responsive],
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Surface style={styles.surface} elevation={1}>
          <Text variant="headlineMedium" style={styles.title}>
            Crear cuenta
          </Text>
          <RegisterForm />
        </Surface>
      </ScrollView>
    </SafeAreaView>
  );
}
