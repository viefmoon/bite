import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Surface, Text } from 'react-native-paper';

import { RegisterForm } from '../components/RegisterForm';
import { useAppTheme } from '../../../app/styles/theme';

export default function RegisterScreen() {
  const theme = useAppTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        contentContainer: {
          flexGrow: 1,
          padding: theme.spacing.l,
        },
        surface: {
          padding: theme.spacing.l,
          borderRadius: theme.roundness,
        },
        title: {
          marginBottom: theme.spacing.m,
          textAlign: 'center',
        },
      }),
    [theme],
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
