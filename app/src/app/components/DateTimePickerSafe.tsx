import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Modal, Portal, Text, Button, Surface } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';

interface DateTimePickerSafeProps {
  visible: boolean;
  mode: 'date' | 'time' | 'datetime';
  value: Date | null;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
  minimumDate?: Date;
  maximumDate?: Date;
  minuteInterval?: number;
  title?: string;
}

export const DateTimePickerSafe: React.FC<DateTimePickerSafeProps> = ({
  visible,
  mode,
  value,
  onConfirm,
  onCancel,
  minimumDate,
  maximumDate,
  minuteInterval = 1,
  title,
}) => {
  const [tempDate, setTempDate] = useState<Date>(() => {
    if (value) return new Date(value);
    const now = new Date();
    // Redondear a los 5 minutos más cercanos si es time mode
    if (mode === 'time' && minuteInterval && minuteInterval > 1) {
      const minutes = now.getMinutes();
      const roundedMinutes =
        Math.round(minutes / minuteInterval) * minuteInterval;
      // Crear una nueva fecha para evitar mutación
      const roundedDate = new Date(now);
      roundedDate.setMinutes(roundedMinutes, 0, 0);
      return roundedDate;
    }
    return now;
  });

  useEffect(() => {
    if (visible && value) {
      setTempDate(new Date(value));
    }
  }, [visible, value]);

  const handleChange = (_event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setTempDate(new Date(selectedDate));
    }
  };

  const handleConfirm = () => {
    onConfirm(new Date(tempDate));
  };

  const getTitle = () => {
    if (title) return title;
    switch (mode) {
      case 'date':
        return 'Seleccionar Fecha';
      case 'time':
        return 'Seleccionar Hora';
      case 'datetime':
        return 'Seleccionar Fecha y Hora';
      default:
        return '';
    }
  };

  if (Platform.OS === 'ios') {
    return (
      <Portal>
        <Modal
          visible={visible}
          onDismiss={onCancel}
          contentContainerStyle={styles.modalIOS}
        >
          <Surface style={styles.containerIOS}>
            <View style={styles.header}>
              <Button mode="text" onPress={onCancel}>
                Cancelar
              </Button>
              <Text variant="titleMedium">{getTitle()}</Text>
              <Button mode="text" onPress={handleConfirm}>
                Confirmar
              </Button>
            </View>
            <DateTimePicker
              testID="dateTimePicker"
              value={tempDate}
              mode={mode}
              is24Hour={false}
              display="spinner"
              onChange={handleChange}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              minuteInterval={minuteInterval as any}
              locale="es_ES"
            />
          </Surface>
        </Modal>
      </Portal>
    );
  }

  // Android muestra el picker nativo directamente
  return (
    <>
      {visible && (
        <DateTimePicker
          testID="dateTimePicker"
          value={tempDate}
          mode={mode}
          is24Hour={false}
          display="default"
          onChange={(event, selectedDate) => {
            onCancel(); // En Android, cerrar al seleccionar
            if (event.type === 'set' && selectedDate) {
              onConfirm(new Date(selectedDate));
            }
          }}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          minuteInterval={minuteInterval as any}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  modalIOS: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  containerIOS: {
    backgroundColor: 'white',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
});

export default DateTimePickerSafe;
