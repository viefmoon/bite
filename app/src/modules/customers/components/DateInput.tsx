import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  TextInput,
  Surface,
  Text,
  Button,
  IconButton,
  Divider,
} from 'react-native-paper';
import { useAppTheme, AppTheme } from '@/app/styles/theme';

interface DateInputProps {
  value: string;
  onChange: (date: string) => void;
  onBlur?: () => void;
  label: string;
  error?: boolean;
  placeholder?: string;
}

export default function DateInput({
  value,
  onChange,
  onBlur,
  label,
  error,
  placeholder = 'AAAA-MM-DD',
}: DateInputProps) {
  const theme = useAppTheme();
  const styles = getStyles(theme);
  const [showPicker, setShowPicker] = useState(false);

  // Parsear la fecha actual
  const currentDate = value ? new Date(value + 'T00:00:00') : new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const currentDay = currentDate.getDate();

  // Generar años (100 años hacia atrás desde el año actual)
  const years = Array.from(
    { length: 100 },
    (_, i) => new Date().getFullYear() - i,
  );

  // Meses
  const months = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  // Días del mes
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedDay, setSelectedDay] = useState(currentDay);

  const handleConfirm = () => {
    const formattedMonth = String(selectedMonth + 1).padStart(2, '0');
    const formattedDay = String(selectedDay).padStart(2, '0');
    const newDate = `${selectedYear}-${formattedMonth}-${formattedDay}`;
    onChange(newDate);
    setShowPicker(false);
  };

  const handleMonthChange = (newMonth: number) => {
    setSelectedMonth(newMonth);
    // Ajustar el día si es necesario
    const newDaysInMonth = getDaysInMonth(selectedYear, newMonth);
    if (selectedDay > newDaysInMonth) {
      setSelectedDay(newDaysInMonth);
    }
  };

  const handleYearChange = (newYear: number) => {
    setSelectedYear(newYear);
    // Ajustar el día si es necesario (por años bisiestos)
    const newDaysInMonth = getDaysInMonth(newYear, selectedMonth);
    if (selectedDay > newDaysInMonth) {
      setSelectedDay(newDaysInMonth);
    }
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <>
      <TouchableOpacity activeOpacity={1} onPress={() => setShowPicker(true)}>
        <View pointerEvents="none">
          <TextInput
            label={label}
            value={formatDisplayDate(value)}
            mode="outlined"
            placeholder={placeholder}
            error={error}
            editable={false}
            onBlur={onBlur}
            right={
              <TextInput.Icon
                icon="calendar"
                onPress={() => setShowPicker(true)}
              />
            }
          />
        </View>
      </TouchableOpacity>

      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <Surface style={styles.modalContent} elevation={4}>
            <View style={styles.header}>
              <Text variant="titleLarge">Seleccionar fecha</Text>
              <IconButton
                icon="close"
                size={24}
                onPress={() => setShowPicker(false)}
              />
            </View>

            <Divider />

            <View style={styles.pickersContainer}>
              {/* Día */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Día</Text>
                <ScrollView
                  style={styles.scrollView}
                  showsVerticalScrollIndicator={false}
                >
                  {days.map((day) => (
                    <TouchableOpacity
                      key={day}
                      onPress={() => setSelectedDay(day)}
                      style={[
                        styles.pickerItem,
                        selectedDay === day && styles.pickerItemSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          selectedDay === day && styles.pickerItemTextSelected,
                        ]}
                      >
                        {String(day).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Mes */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Mes</Text>
                <ScrollView
                  style={styles.scrollView}
                  showsVerticalScrollIndicator={false}
                >
                  {months.map((month, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleMonthChange(index)}
                      style={[
                        styles.pickerItem,
                        selectedMonth === index && styles.pickerItemSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          selectedMonth === index &&
                            styles.pickerItemTextSelected,
                        ]}
                      >
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Año */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Año</Text>
                <ScrollView
                  style={styles.scrollView}
                  showsVerticalScrollIndicator={false}
                >
                  {years.map((year) => (
                    <TouchableOpacity
                      key={year}
                      onPress={() => handleYearChange(year)}
                      style={[
                        styles.pickerItem,
                        selectedYear === year && styles.pickerItemSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          selectedYear === year &&
                            styles.pickerItemTextSelected,
                        ]}
                      >
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.actions}>
              <Button
                mode="text"
                onPress={() => setShowPicker(false)}
                style={styles.actionButton}
              >
                Cancelar
              </Button>
              <Button
                mode="contained"
                onPress={handleConfirm}
                style={styles.actionButton}
              >
                Confirmar
              </Button>
            </View>
          </Surface>
        </View>
      </Modal>
    </>
  );
}

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '90%',
      maxWidth: 400,
      maxHeight: '80%',
      borderRadius: theme.roundness * 2,
      backgroundColor: theme.colors.surface,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
    },
    pickersContainer: {
      flexDirection: 'row',
      height: 300,
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.m,
    },
    pickerColumn: {
      flex: 1,
      marginHorizontal: theme.spacing.xs,
    },
    pickerLabel: {
      ...theme.fonts.labelMedium,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      marginBottom: theme.spacing.s,
    },
    scrollView: {
      flex: 1,
    },
    pickerItem: {
      paddingVertical: theme.spacing.s,
      paddingHorizontal: theme.spacing.m,
      borderRadius: theme.roundness,
      marginVertical: 2,
    },
    pickerItemSelected: {
      backgroundColor: theme.colors.primaryContainer,
    },
    pickerItemText: {
      ...theme.fonts.bodyMedium,
      color: theme.colors.onSurface,
      textAlign: 'center',
    },
    pickerItemTextSelected: {
      color: theme.colors.onPrimaryContainer,
      fontWeight: '600',
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.m,
      gap: theme.spacing.s,
    },
    actionButton: {
      minWidth: 100,
    },
  });
