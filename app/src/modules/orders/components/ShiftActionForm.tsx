import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, HelperText } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/app/styles/theme';
import SpeechRecognitionInput from '@/app/components/common/SpeechRecognitionInput';
import type { Shift } from '@/app/schemas/domain/shift.schema';

type ShiftActionMode = 'open' | 'close';

interface ShiftConfig {
  cashLabel: string;
  notesLabel: string;
  notesPlaceholder: string;
  infoText?: string;
}

interface ShiftActionFormProps {
  mode: ShiftActionMode;
  cashAmount: string;
  onCashAmountChange: (text: string) => void;
  notes: string;
  onNotesChange: (text: string) => void;
  error: string;
  loading: boolean;
  shift?: Shift | null; // Usado para calculateDifference
  calculateDifference: () => number | null;
  formatCurrency: (amount: number) => string;
}

export const ShiftActionForm: React.FC<ShiftActionFormProps> = ({
  mode,
  cashAmount,
  onCashAmountChange,
  notes,
  onNotesChange,
  error,
  loading,
  calculateDifference,
  formatCurrency,
}) => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const isOpenMode = mode === 'open';

  const config: ShiftConfig = {
    open: {
      cashLabel: 'Monto inicial en caja',
      notesLabel: 'Notas adicionales (opcional)',
      notesPlaceholder: 'Ej: Estado de la caja, observaciones...',
      infoText:
        'Registra el monto inicial para comenzar las operaciones del turno.',
    },
    close: {
      cashLabel: 'Efectivo final en caja',
      notesLabel: 'Notas de cierre (opcional)',
      notesPlaceholder: 'Ej: Observaciones del turno, incidencias...',
    },
  }[mode];

  const difference = calculateDifference();

  return (
    <View style={styles.inputSection}>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        {isOpenMode ? 'Información de Apertura' : 'Información de Cierre'}
      </Text>

      {isOpenMode && (
        <View style={styles.infoCard}>
          <MaterialCommunityIcons
            name="information"
            size={20}
            color={theme.colors.primary}
          />
          <Text variant="bodyMedium" style={styles.infoText}>
            {config.infoText}
          </Text>
        </View>
      )}

      <TextInput
        label={config.cashLabel}
        value={cashAmount}
        onChangeText={onCashAmountChange}
        keyboardType="decimal-pad"
        mode="outlined"
        left={<TextInput.Affix text="$" />}
        style={styles.input}
        disabled={loading}
        error={!!error}
        placeholder="0.00"
        outlineColor={error ? theme.colors.error : theme.colors.outline}
        activeOutlineColor={error ? theme.colors.error : theme.colors.primary}
      />

      {!isOpenMode && difference !== null && (
        <View
          style={[
            styles.differenceContainer,
            difference < 0
              ? styles.negativeDifference
              : styles.positiveDifference,
          ]}
        >
          <MaterialCommunityIcons
            name={difference >= 0 ? 'trending-up' : 'trending-down'}
            size={20}
            color={difference >= 0 ? '#4CAF50' : '#FF5722'}
          />
          <Text
            style={[
              styles.differenceText,
              difference >= 0 ? styles.positiveText : styles.negativeText,
            ]}
          >
            {difference >= 0 ? 'Sobrante: ' : 'Faltante: '}
            {formatCurrency(Math.abs(difference))}
          </Text>
        </View>
      )}

      <HelperText type="error" visible={!!error} style={styles.errorText}>
        {error}
      </HelperText>

      <SpeechRecognitionInput
        key={`${mode}-notes-input`}
        label={config.notesLabel}
        value={notes}
        onChangeText={onNotesChange}
        multiline
        speechLang="es-MX"
        placeholder={config.notesPlaceholder}
        autoCapitalize="sentences"
        autoCorrect={false}
        disabled={loading}
      />
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    inputSection: {
      marginTop: theme.spacing.s,
    },
    sectionTitle: {
      color: theme.colors.onSurface,
      fontWeight: '600',
      marginBottom: theme.spacing.m,
    },
    infoCard: {
      flexDirection: 'row',
      backgroundColor: theme.colors.primaryContainer,
      padding: theme.spacing.m,
      borderRadius: theme.roundness,
      marginBottom: theme.spacing.l,
      gap: theme.spacing.s,
    },
    infoText: {
      flex: 1,
      color: theme.colors.onPrimaryContainer,
      lineHeight: 20,
    },
    input: {
      backgroundColor: theme.colors.surface,
      marginBottom: theme.spacing.s,
    },
    differenceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.m,
      borderRadius: theme.roundness,
      marginBottom: theme.spacing.s,
      gap: theme.spacing.s,
    },
    positiveDifference: {
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      borderWidth: 1,
      borderColor: '#4CAF50',
    },
    negativeDifference: {
      backgroundColor: 'rgba(255, 87, 34, 0.1)',
      borderWidth: 1,
      borderColor: '#FF5722',
    },
    differenceText: {
      fontWeight: '600',
    },
    positiveText: {
      color: '#4CAF50',
    },
    negativeText: {
      color: '#FF5722',
    },
    errorText: {
      marginTop: -theme.spacing.xs,
      marginBottom: theme.spacing.s,
    },
  });
