import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import {
  Surface,
  Text,
  IconButton,
  Button,
  useTheme,
  Divider,
} from 'react-native-paper';
import {
  format,
  getDaysInMonth,
  startOfMonth,
  getDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { AppTheme } from '@/app/styles/theme';

interface InlineDatePickerProps {
  visible: boolean;
  onDismiss: () => void;
  date?: Date;
  onConfirm: (date: Date) => void;
  label?: string;
  validRange?: {
    startDate?: Date;
    endDate?: Date;
  };
}

const DAYS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const MONTHS = [
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

export default function InlineDatePicker({
  visible,
  onDismiss,
  date,
  onConfirm,
  label = 'Seleccionar fecha',
  validRange,
}: InlineDatePickerProps) {
  const theme = useTheme<AppTheme>();
  const styles = getStyles(theme);

  const [selectedDate, setSelectedDate] = useState<Date>(date || new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(date || new Date());
  const [showYearPicker, setShowYearPicker] = useState(false);

  useEffect(() => {
    if (!visible) {
      setShowYearPicker(false);
    }
  }, [visible]);

  const handleDateSelect = (day: number) => {
    const newDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );

    if (validRange?.startDate && newDate < validRange.startDate) return;
    if (validRange?.endDate && newDate > validRange.endDate) return;

    setSelectedDate(newDate);
  };

  const handleConfirm = () => {
    onConfirm(selectedDate);
    onDismiss();
  };

  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  };

  const handleYearSelect = (year: number) => {
    const newDate = new Date(currentMonth);
    newDate.setFullYear(year);
    setCurrentMonth(newDate);
    setShowYearPicker(false);
  };

  const getYearRange = () => {
    const currentYear = new Date().getFullYear();
    const startYear = validRange?.startDate?.getFullYear() || currentYear - 100;
    const endYear = validRange?.endDate?.getFullYear() || currentYear;

    const years = [];
    for (let year = endYear; year >= startYear; year--) {
      years.push(year);
    }
    return years;
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = startOfMonth(currentMonth);
    const daysInMonth = getDaysInMonth(currentMonth);
    const startingDayOfWeek = getDay(firstDay);

    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateToCheck = new Date(year, month, day);
      const isSelected =
        selectedDate &&
        dateToCheck.getDate() === selectedDate.getDate() &&
        dateToCheck.getMonth() === selectedDate.getMonth() &&
        dateToCheck.getFullYear() === selectedDate.getFullYear();

      const isDisabled =
        (validRange?.startDate && dateToCheck < validRange.startDate) ||
        (validRange?.endDate && dateToCheck > validRange.endDate);

      const isToday =
        dateToCheck.getDate() === new Date().getDate() &&
        dateToCheck.getMonth() === new Date().getMonth() &&
        dateToCheck.getFullYear() === new Date().getFullYear();

      days.push(
        <TouchableOpacity
          key={day}
          style={styles.dayCell}
          onPress={() => !isDisabled && handleDateSelect(day)}
          disabled={isDisabled}
        >
          <View
            style={[
              styles.dayContent,
              isSelected && styles.selectedDay,
              isToday && !isSelected && styles.todayDay,
              isDisabled && styles.disabledDay,
            ]}
          >
            <Text
              style={[
                styles.dayText,
                isSelected && styles.selectedDayText,
                isToday && !isSelected && styles.todayDayText,
                isDisabled && styles.disabledDayText,
              ]}
            >
              {day}
            </Text>
          </View>
        </TouchableOpacity>,
      );
    }

    return days;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onDismiss}
    >
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onDismiss}
        />

        <Surface style={styles.surface} elevation={24}>
          {/* Header */}
          <View style={styles.header}>
            <Text variant="titleLarge" style={styles.title}>
              {label}
            </Text>
            <IconButton icon="close" size={24} onPress={onDismiss} />
          </View>

          <Divider />

          {/* Month Navigation */}
          <View style={styles.monthNavigation}>
            <IconButton
              icon="chevron-left"
              size={24}
              onPress={handlePreviousMonth}
            />
            <TouchableOpacity
              style={styles.monthYearButton}
              onPress={() => setShowYearPicker(!showYearPicker)}
            >
              <Text variant="titleMedium" style={styles.monthText}>
                {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </Text>
              <IconButton
                icon={showYearPicker ? 'chevron-up' : 'chevron-down'}
                size={20}
                style={styles.yearToggleIcon}
              />
            </TouchableOpacity>
            <IconButton
              icon="chevron-right"
              size={24}
              onPress={handleNextMonth}
            />
          </View>

          {/* Year Picker */}
          {showYearPicker && (
            <View style={styles.yearPickerContainer}>
              <ScrollView
                style={styles.yearScrollView}
                showsVerticalScrollIndicator={true}
              >
                {getYearRange().map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.yearItem,
                      year === currentMonth.getFullYear() &&
                        styles.selectedYearItem,
                    ]}
                    onPress={() => handleYearSelect(year)}
                  >
                    <Text
                      style={[
                        styles.yearItemText,
                        year === currentMonth.getFullYear() &&
                          styles.selectedYearItemText,
                      ]}
                    >
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Calendar */}
          {!showYearPicker && (
            <View style={styles.calendar}>
              {/* Days of week */}
              <View style={styles.weekDays}>
                {DAYS.map((day, index) => (
                  <View key={index} style={styles.weekDayCell}>
                    <Text style={styles.weekDayText}>{day}</Text>
                  </View>
                ))}
              </View>

              {/* Calendar days */}
              <View style={styles.daysGrid}>{renderCalendar()}</View>
            </View>
          )}

          {/* Selected Date Display */}
          <View style={styles.selectedDateContainer}>
            <Text variant="bodyMedium" style={styles.selectedDateLabel}>
              Fecha seleccionada:
            </Text>
            <Text variant="titleMedium" style={styles.selectedDateText}>
              {format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: es })}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={onDismiss}
              style={[styles.actionButton, styles.cancelButton]}
              textColor={theme.colors.onSurfaceVariant}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleConfirm}
              style={[styles.actionButton, styles.confirmButton]}
            >
              Confirmar
            </Button>
          </View>
        </Surface>
      </View>
    </Modal>
  );
}

const getStyles = (theme: AppTheme) => {
  const { width } = Dimensions.get('window');

  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    surface: {
      width: Math.min(width * 0.9, 360),
      maxHeight: '80%',
      borderRadius: theme.roundness * 3,
      backgroundColor: theme.colors.surface,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingLeft: theme.spacing.m,
      paddingRight: theme.spacing.xs,
      paddingVertical: theme.spacing.xs,
    },
    title: {
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    monthNavigation: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: theme.spacing.xs,
    },
    monthText: {
      fontWeight: '500',
      color: theme.colors.onSurface,
    },
    monthYearButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.s,
    },
    yearToggleIcon: {
      margin: 0,
      marginLeft: -theme.spacing.xs,
    },
    yearPickerContainer: {
      maxHeight: 200,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: theme.colors.surfaceVariant,
    },
    yearScrollView: {
      paddingHorizontal: theme.spacing.m,
    },
    yearItem: {
      paddingVertical: theme.spacing.s,
      paddingHorizontal: theme.spacing.m,
      alignItems: 'center',
    },
    selectedYearItem: {
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: theme.roundness,
    },
    yearItemText: {
      fontSize: 16,
      color: theme.colors.onSurface,
    },
    selectedYearItemText: {
      fontWeight: '600',
      color: theme.colors.primary,
    },
    calendar: {
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
    },
    weekDays: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: theme.spacing.s,
    },
    weekDayCell: {
      width: 36,
      alignItems: 'center',
    },
    weekDayText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
    daysGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-around',
    },
    dayCell: {
      width: '14.28%',
      aspectRatio: 1,
      padding: 2,
    },
    dayContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 999,
    },
    dayText: {
      fontSize: 14,
      color: theme.colors.onSurface,
    },
    selectedDay: {
      backgroundColor: theme.colors.primary,
    },
    selectedDayText: {
      color: theme.colors.onPrimary,
      fontWeight: '600',
    },
    todayDay: {
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    todayDayText: {
      color: theme.colors.primary,
      fontWeight: '500',
    },
    disabledDay: {
      opacity: 0.3,
    },
    disabledDayText: {
      color: theme.colors.onSurfaceVariant,
    },
    selectedDateContainer: {
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: theme.colors.surfaceVariant,
    },
    selectedDateLabel: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: theme.spacing.xs,
    },
    selectedDateText: {
      color: theme.colors.primary,
      fontWeight: '500',
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.m,
      gap: theme.spacing.m,
    },
    actionButton: {
      flex: 1,
      maxWidth: 150,
    },
    cancelButton: {
      borderColor: theme.colors.outline,
    },
    confirmButton: {
      elevation: 0,
    },
  });
};
