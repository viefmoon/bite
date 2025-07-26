import React, {
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, HelperText } from 'react-native-paper';
import AnimatedLabelSelector from '@/app/components/common/AnimatedLabelSelector';
import SpeechRecognitionInput from '@/app/components/common/SpeechRecognitionInput';
import { useAppTheme } from '@/app/styles/theme';
import { useOrderStore } from '../../stores/useOrderStore';
import { format } from 'date-fns';

interface DeliveryFormProps {
  onScheduleTimePress: () => void;
}

export interface DeliveryFormRef {
  validate: () => boolean;
}

export const DeliveryForm = forwardRef<DeliveryFormRef, DeliveryFormProps>(
  ({ onScheduleTimePress }, ref) => {
    const {
      deliveryInfo,
      orderNotes,
      scheduledTime,
      setDeliveryInfo,
      setOrderNotes,
      setScheduledTime,
    } = useOrderStore();

    const formattedScheduledTime = scheduledTime
      ? format(scheduledTime, 'h:mm a').toLowerCase()
      : '';
    const theme = useAppTheme();
    const styles = React.useMemo(() => createStyles(theme), [theme]);
    const [addressError, setAddressError] = useState<string | null>(null);
    const [recipientNameError, setRecipientNameError] = useState<string | null>(
      null,
    );
    const [recipientPhoneError, setRecipientPhoneError] = useState<
      string | null
    >(null);
    const handleScheduleTimeClear = () => {
      setScheduledTime(null);
    };
    React.useEffect(() => {
      if (deliveryInfo.fullAddress?.trim()) {
        setAddressError(null);
      }
    }, [deliveryInfo.fullAddress]);

    React.useEffect(() => {
      if (deliveryInfo.recipientName?.trim()) {
        setRecipientNameError(null);
      }
    }, [deliveryInfo.recipientName]);

    React.useEffect(() => {
      if (deliveryInfo.recipientPhone?.trim()) {
        setRecipientPhoneError(null);
      }
    }, [deliveryInfo.recipientPhone]);
    const validate = useCallback(() => {
      let isValid = true;
      if (!deliveryInfo.fullAddress?.trim()) {
        setAddressError('Por favor ingresa la dirección de entrega');
        isValid = false;
      }
      if (!deliveryInfo.recipientName?.trim()) {
        setRecipientNameError('Por favor ingresa el nombre del cliente');
        isValid = false;
      }
      if (!deliveryInfo.recipientPhone?.trim()) {
        setRecipientPhoneError('Por favor ingresa el teléfono del cliente');
        isValid = false;
      }

      return isValid;
    }, [
      deliveryInfo.fullAddress,
      deliveryInfo.recipientName,
      deliveryInfo.recipientPhone,
    ]);
    useImperativeHandle(
      ref,
      () => ({
        validate,
      }),
      [validate],
    );

    return (
      <>
        <View style={[styles.section, styles.fieldContainer]}>
          <SpeechRecognitionInput
            key="address-input-delivery"
            label="Dirección de Entrega *"
            value={deliveryInfo.fullAddress || ''}
            onChangeText={(text) => {
              setDeliveryInfo({ ...deliveryInfo, fullAddress: text });
              if (addressError) setAddressError(null);
            }}
            error={!!addressError}
            speechLang="es-MX"
            multiline
            isInModal={true}
          />
          {addressError && (
            <HelperText type="error" visible={true} style={styles.helperText}>
              {addressError}
            </HelperText>
          )}
        </View>

        <View style={[styles.section, styles.fieldContainer]}>
          <SpeechRecognitionInput
            key="recipient-name-input-delivery"
            label="Nombre del Cliente *"
            value={deliveryInfo.recipientName || ''}
            onChangeText={(text) => {
              setDeliveryInfo({ ...deliveryInfo, recipientName: text });
              if (recipientNameError) setRecipientNameError(null);
            }}
            error={!!recipientNameError}
            speechLang="es-MX"
            autoCapitalize="words"
            autoCorrect={false}
          />
          {recipientNameError && (
            <HelperText type="error" visible={true} style={styles.helperText}>
              {recipientNameError}
            </HelperText>
          )}
        </View>

        <View style={[styles.section, styles.fieldContainer]}>
          <SpeechRecognitionInput
            key="phone-input-delivery"
            label="Teléfono *"
            value={deliveryInfo.recipientPhone || ''}
            onChangeText={(text) => {
              setDeliveryInfo({ ...deliveryInfo, recipientPhone: text });
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

        <View style={[styles.section, styles.fieldContainer]}>
          <SpeechRecognitionInput
            key="notes-input-delivery"
            label="Notas de la Orden (Opcional)"
            value={orderNotes}
            onChangeText={setOrderNotes}
            multiline
            speechLang="es-MX"
          />
        </View>

        <View style={[styles.section, styles.fieldContainer]}>
          <AnimatedLabelSelector
            label="Programar Hora Entrega (Opcional)"
            value={formattedScheduledTime}
            onPress={onScheduleTimePress}
            onClear={handleScheduleTimeClear}
          />
        </View>
      </>
    );
  },
);

DeliveryForm.displayName = 'DeliveryForm';

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
