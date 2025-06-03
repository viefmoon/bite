import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Platform, StyleProp, ViewStyle } from 'react-native';
import { Button, IconButton } from 'react-native-paper';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import InfoModal from './InfoModal';
import { useAppTheme } from '@/app/styles/theme';

interface TimeSelectorProps {
  initialDate?: Date | null;
  onTimeChange: (date: Date | null) => void;
  label?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const TimeSelector: React.FC<TimeSelectorProps> = ({
  initialDate,
  onTimeChange,
  label = "Seleccionar hora",
  disabled = false,
  style,
}) => {
  const theme = useAppTheme();
  const [selectedTime, setSelectedTime] = useState<Date | null>(initialDate ?? null);
  const [showPicker, setShowPicker] = useState(false);
  const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);
  const [infoModalTitle, setInfoModalTitle] = useState('');
  const [infoModalMessage, setInfoModalMessage] = useState('');

  useEffect(() => {
    if (initialDate !== selectedTime) {
      setSelectedTime(initialDate ?? null);
    }
  }, [initialDate]);

  const handlePickerChange = (event: DateTimePickerEvent, date?: Date) => {
    setShowPicker(Platform.OS === 'ios');

    if (event.type === 'dismissed') {
      return;
    }

    if (date) {
      const now = new Date();
      const newSelectedTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        date.getHours(),
        date.getMinutes()
      );

      if (newSelectedTime < now) {
        setInfoModalTitle("Hora inválida");
        setInfoModalMessage("No puedes seleccionar una hora anterior a la actual para hoy.");
        setIsInfoModalVisible(true);
        return;
      }

      setSelectedTime(newSelectedTime);
      onTimeChange(newSelectedTime);
    }
  };

  const showTimepicker = () => {
    if (!disabled) {
      setShowPicker(true);
    }
  };

  const clearTime = useCallback(() => {
    setSelectedTime(null);
    onTimeChange(null);
  }, [onTimeChange]);

  const hideInfoModal = () => setIsInfoModalVisible(false);

const formatTime = (date: Date | null): string => {
    if (!date) return label;
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hoursStr = hours.toString().padStart(2, '0');
    return `${hoursStr}:${minutes} ${ampm}`;
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    button: {
      flex: 1,
      justifyContent: 'center',
    },
    clearButton: {
      marginLeft: theme.spacing.xs,
      marginRight: -theme.spacing.xs,
    },
  });

  return (
    <View style={[styles.container, style]}>
      <Button
        mode="outlined"
        onPress={showTimepicker}
        disabled={disabled}
        icon="clock-outline"
        style={styles.button}
        contentStyle={{ height: 50 }}
      >
        {formatTime(selectedTime)}
      </Button>
      {selectedTime && !disabled && (
        <IconButton
          icon="close-circle"
          size={20}
          onPress={clearTime}
          style={styles.clearButton}
          iconColor={theme.colors.onSurfaceVariant}
        />
      )}

      {showPicker && (
        <DateTimePicker
          value={selectedTime || new Date()}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={handlePickerChange}
          positiveButton={{label: 'Confirmar', textColor: theme.colors.primary}}
          negativeButton={{label: 'Cancelar', textColor: theme.colors.error}}
        />
      )}
      <InfoModal
        visible={isInfoModalVisible}
        title={infoModalTitle}
        message={infoModalMessage}
        onDismiss={hideInfoModal}
        buttonText="Entendido"
      />
    </View>
  );
};

export default TimeSelector;