import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, HelperText } from 'react-native-paper';
import AnimatedLabelSelector from '@/app/components/common/AnimatedLabelSelector';
import SpeechRecognitionInput from '@/app/components/common/SpeechRecognitionInput';
import { useAppTheme } from '@/app/styles/theme';
import type { DeliveryInfo } from '@/app/schemas/domain/delivery-info.schema';

interface TakeAwayFormProps {
  deliveryInfo: DeliveryInfo;
  orderNotes: string;
  formattedScheduledTime: string;
  recipientNameError: string | null;
  recipientPhoneError: string | null;
  onDeliveryInfoChange: (info: DeliveryInfo) => void;
  onNotesChange: (notes: string) => void;
  onScheduleTimePress: () => void;
  onScheduleTimeClear: () => void;
  setRecipientNameError: (error: string | null) => void;
  setRecipientPhoneError: (error: string | null) => void;
}

export const TakeAwayForm: React.FC<TakeAwayFormProps> = ({
  deliveryInfo,
  orderNotes,
  formattedScheduledTime,
  recipientNameError,
  recipientPhoneError,
  onDeliveryInfoChange,
  onNotesChange,
  onScheduleTimePress,
  onScheduleTimeClear,
  setRecipientNameError,
  setRecipientPhoneError,
}) => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <>
      {/* 1. Nombre Cliente */}
      <View style={[styles.section, styles.fieldContainer]}>
        <SpeechRecognitionInput
          key="customer-name-input-takeaway"
          label="Nombre del Cliente *"
          value={deliveryInfo.recipientName || ''}
          onChangeText={(text) => {
            onDeliveryInfoChange({ ...deliveryInfo, recipientName: text });
            if (recipientNameError) setRecipientNameError(null);
          }}
          error={!!recipientNameError}
          speechLang="es-MX"
          autoCapitalize="words"
          autoCorrect={false}
        />
        {recipientNameError && (
          <HelperText
            type="error"
            visible={true}
            style={styles.helperText}
          >
            {recipientNameError}
          </HelperText>
        )}
      </View>

      {/* 2. Teléfono */}
      <View style={[styles.section, styles.fieldContainer]}>
        <View style={styles.phoneInputWrapper}>
          <SpeechRecognitionInput
            key="phone-input-takeaway"
            label="Teléfono (Opcional)"
            value={deliveryInfo.recipientPhone || ''}
            onChangeText={(text) => {
              onDeliveryInfoChange({ ...deliveryInfo, recipientPhone: text });
              if (recipientPhoneError) setRecipientPhoneError(null);
            }}
            keyboardType="phone-pad"
            error={!!recipientPhoneError}
            speechLang="es-MX"
            autoCorrect={false}
          />
          {(deliveryInfo.recipientPhone || '').length > 0 &&
            !recipientPhoneError && (
              <Text style={styles.digitCounterAbsolute}>
                {
                  (deliveryInfo.recipientPhone || '').replace(/\D/g, '')
                    .length
                }{' '}
                dígitos
              </Text>
            )}
        </View>
        {recipientPhoneError && (
          <HelperText
            type="error"
            visible={true}
            style={styles.helperText}
          >
            {recipientPhoneError}
          </HelperText>
        )}
      </View>

      {/* 3. Notas */}
      <View style={[styles.section, styles.fieldContainer]}>
        <SpeechRecognitionInput
          key="notes-input-takeaway"
          label="Notas de la Orden (Opcional)"
          value={orderNotes}
          onChangeText={onNotesChange}
          multiline
          speechLang="es-MX"
        />
      </View>

      {/* 4. Programar Hora */}
      <View style={[styles.section, styles.fieldContainer]}>
        <AnimatedLabelSelector
          label="Programar Hora Recolección (Opcional)"
          value={formattedScheduledTime}
          onPress={onScheduleTimePress}
          onClear={onScheduleTimeClear}
        />
      </View>
    </>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    section: {
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.xs,
      marginBottom: theme.spacing.xs,
    },
    fieldContainer: {
      marginBottom: theme.spacing.xs,
    },
    helperText: {
      fontSize: 12,
      paddingHorizontal: 0,
      paddingTop: 0,
      marginTop: -4,
    },
    phoneInputWrapper: {
      position: 'relative',
    },
    digitCounterAbsolute: {
      position: 'absolute',
      right: 12,
      bottom: 20,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
  });