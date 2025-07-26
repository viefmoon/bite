import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, HelperText } from 'react-native-paper';
import AnimatedLabelSelector from '@/app/components/common/AnimatedLabelSelector';
import SpeechRecognitionInput from '@/app/components/common/SpeechRecognitionInput';
import { useAppTheme } from '@/app/styles/theme';
import type { DeliveryInfo } from '@/app/schemas/domain/delivery-info.schema';

interface DeliveryFormProps {
  deliveryInfo: DeliveryInfo;
  orderNotes: string;
  formattedScheduledTime: string;
  addressError: string | null;
  recipientPhoneError: string | null;
  onDeliveryInfoChange: (info: DeliveryInfo) => void;
  onNotesChange: (notes: string) => void;
  onScheduleTimePress: () => void;
  onScheduleTimeClear: () => void;
  setAddressError: (error: string | null) => void;
  setRecipientPhoneError: (error: string | null) => void;
}

export const DeliveryForm: React.FC<DeliveryFormProps> = ({
  deliveryInfo,
  orderNotes,
  formattedScheduledTime,
  addressError,
  recipientPhoneError,
  onDeliveryInfoChange,
  onNotesChange,
  onScheduleTimePress,
  onScheduleTimeClear,
  setAddressError,
  setRecipientPhoneError,
}) => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <>
      {/* 1. Dirección */}
      <View style={[styles.section, styles.fieldContainer]}>
        <SpeechRecognitionInput
          key="address-input-delivery"
          label="Dirección de Entrega *"
          value={deliveryInfo.fullAddress || ''}
          onChangeText={(text) => {
            onDeliveryInfoChange({ ...deliveryInfo, fullAddress: text });
            if (addressError) setAddressError(null);
          }}
          error={!!addressError}
          speechLang="es-MX"
          multiline
          isInModal={true}
        />
        {addressError && (
          <HelperText
            type="error"
            visible={true}
            style={styles.helperText}
          >
            {addressError}
          </HelperText>
        )}
      </View>

      {/* 2. Teléfono */}
      <View style={[styles.section, styles.fieldContainer]}>
        <SpeechRecognitionInput
          key="phone-input-delivery"
          label="Teléfono *"
          value={deliveryInfo.recipientPhone || ''}
          onChangeText={(text) => {
            onDeliveryInfoChange({ ...deliveryInfo, recipientPhone: text });
            if (recipientPhoneError) {
              setRecipientPhoneError(null);
            }
          }}
          keyboardType="phone-pad"
          error={!!recipientPhoneError}
          speechLang="es-MX"
          autoCorrect={false}
        />
        <View style={styles.phoneHelperContainer}>
          {recipientPhoneError ? (
            <HelperText
              type="error"
              visible={true}
              style={[styles.helperText, styles.recipientPhoneError]}
            >
              {recipientPhoneError}
            </HelperText>
          ) : (
            (deliveryInfo.recipientPhone || '').length > 0 && (
              <Text style={styles.digitCounter}>
                {
                  (deliveryInfo.recipientPhone || '').replace(/\D/g, '')
                    .length
                }{' '}
                dígitos
              </Text>
            )
          )}
        </View>
      </View>

      {/* 3. Notas */}
      <View style={[styles.section, styles.fieldContainer]}>
        <SpeechRecognitionInput
          key="notes-input-delivery"
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
          label="Programar Hora Entrega (Opcional)"
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
    phoneHelperContainer: {
      marginTop: 2,
    },
    recipientPhoneError: {
      marginBottom: 0,
    },
    digitCounter: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginLeft: 14,
    },
  });