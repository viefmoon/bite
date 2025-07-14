import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Text,
  SegmentedButtons,
  HelperText,
  Switch,
  Card,
  Chip,
} from 'react-native-paper';
import { Controller, Control, FieldErrors } from 'react-hook-form';
import { useAppTheme, AppTheme } from '../../../app/styles/theme';
import { PrinterFormData } from '../schema/printer.schema';
import NumericField from './NumericField';

interface PrinterAdvancedConfigProps {
  control: Control<PrinterFormData>;
  errors: FieldErrors<PrinterFormData>;
  isSubmitting: boolean;
}

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      marginTop: theme.spacing.m,
    },
    sectionTitle: {
      marginBottom: theme.spacing.m,
      marginTop: theme.spacing.l,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    input: {
      marginBottom: theme.spacing.m,
    },
    switchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.m,
      paddingVertical: theme.spacing.s,
    },
    switchLabel: {
      color: theme.colors.onSurfaceVariant,
      marginRight: theme.spacing.m,
      fontSize: 16,
      flexShrink: 1,
    },
    helperText: {
      marginTop: -theme.spacing.s,
      marginBottom: theme.spacing.s,
    },
    segmentedButtons: {
      marginBottom: theme.spacing.m,
    },
    recommendationCard: {
      marginBottom: theme.spacing.m,
      padding: theme.spacing.m,
      backgroundColor: theme.colors.primaryContainer,
    },
    recommendationTitle: {
      fontWeight: '600',
      marginBottom: theme.spacing.xs,
      color: theme.colors.onPrimaryContainer,
    },
    recommendationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: theme.spacing.xs,
    },
    recommendationText: {
      marginLeft: theme.spacing.s,
      color: theme.colors.onPrimaryContainer,
    },
    chip: {
      marginRight: theme.spacing.xs,
    },
  });

const PrinterAdvancedConfig: React.FC<PrinterAdvancedConfigProps> = ({
  control,
  errors,
  isSubmitting,
}) => {
  const theme = useAppTheme();
  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Configuración del Papel
      </Text>

      {/* Recomendaciones */}
      <Card style={styles.recommendationCard}>
        <Card.Content>
          <Text variant="bodyMedium" style={styles.recommendationTitle}>
            Recomendaciones de configuración:
          </Text>
          <View style={styles.recommendationRow}>
            <Chip compact style={styles.chip}>
              80mm
            </Chip>
            <Text variant="bodySmall" style={styles.recommendationText}>
              48 caracteres (normal) • 64 (comprimido)
            </Text>
          </View>
          <View style={styles.recommendationRow}>
            <Chip compact style={styles.chip}>
              58mm
            </Chip>
            <Text variant="bodySmall" style={styles.recommendationText}>
              32 caracteres (normal) • 42 (comprimido)
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Ancho del papel */}
      <Controller
        name="paperWidth"
        control={control}
        render={({ field: { onChange, value } }) => (
          <View>
            <Text variant="bodyMedium" style={{ marginBottom: 8 }}>
              Ancho del papel
            </Text>
            <SegmentedButtons
              value={String(value)}
              onValueChange={(val) => onChange(Number(val))}
              buttons={[
                {
                  value: '58',
                  label: '58mm',
                  disabled: isSubmitting,
                },
                {
                  value: '80',
                  label: '80mm',
                  disabled: isSubmitting,
                },
              ]}
              style={styles.segmentedButtons}
            />
          </View>
        )}
      />

      {/* Caracteres por línea */}
      <Controller
        name="charactersPerLine"
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <NumericField
            label="Caracteres por línea"
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            error={!!errors.charactersPerLine}
            disabled={isSubmitting}
            defaultValue={48}
          />
        )}
      />
      {errors.charactersPerLine && (
        <HelperText
          type="error"
          visible={!!errors.charactersPerLine}
          style={styles.helperText}
        >
          {errors.charactersPerLine.message}
        </HelperText>
      )}

      <HelperText type="info" visible={true} style={styles.helperText}>
        Ajusta según el ancho real de impresión de tu impresora
      </HelperText>

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Configuración de Corte
      </Text>

      {/* Cortar papel */}
      <View style={styles.switchContainer}>
        <Text variant="bodyLarge" style={styles.switchLabel}>
          Cortar papel automáticamente
        </Text>
        <Controller
          name="cutPaper"
          control={control}
          render={({ field: { onChange, value } }) => (
            <Switch
              value={value}
              onValueChange={onChange}
              disabled={isSubmitting}
            />
          )}
        />
      </View>

      {/* Líneas de avance */}
      <Controller
        name="feedLines"
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <NumericField
            label="Líneas de avance antes del corte"
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            error={!!errors.feedLines}
            disabled={isSubmitting}
            defaultValue={3}
          />
        )}
      />
      {errors.feedLines && (
        <HelperText
          type="error"
          visible={!!errors.feedLines}
          style={styles.helperText}
        >
          {errors.feedLines.message}
        </HelperText>
      )}

      <HelperText type="info" visible={true} style={styles.helperText}>
        Líneas en blanco para que el ticket salga completamente (0-50)
      </HelperText>
    </View>
  );
};

export default PrinterAdvancedConfig;
