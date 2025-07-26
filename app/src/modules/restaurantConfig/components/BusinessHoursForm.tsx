import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Switch, Chip, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePickerSafe from '@/app/components/DateTimePickerSafe';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import {
  BusinessHours,
  CreateBusinessHoursDto,
} from '../schema/restaurantConfig.schema';

interface BusinessHoursFormProps {
  businessHours: BusinessHours[] | CreateBusinessHoursDto[];
  isEditing: boolean;
  onChange: (businessHours: CreateBusinessHoursDto[]) => void;
}

const DAYS_OF_WEEK = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

const BusinessHoursForm: React.FC<BusinessHoursFormProps> = ({
  businessHours,
  isEditing,
  onChange,
}) => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const [showTimePicker, setShowTimePicker] = React.useState(false);
  const [currentPickerConfig, setCurrentPickerConfig] = React.useState<{
    dayIndex: number;
    type: 'opening' | 'closing';
    currentDate: Date;
  } | null>(null);

  // Initialize business hours if empty
  const initializedHours = React.useMemo(() => {
    if (businessHours.length === 0) {
      return DAYS_OF_WEEK.map((_, index) => ({
        dayOfWeek: index,
        openingTime: '09:00',
        closingTime: '22:00',
        isClosed: false,
        closesNextDay: false,
      }));
    }

    // Asegurar que closesNextDay esté calculado para cada horario
    return businessHours.map((hour) => {
      if (hour.openingTime && hour.closingTime && !hour.isClosed) {
        const [openHour, openMin] = hour.openingTime.split(':').map(Number);
        const [closeHour, closeMin] = hour.closingTime.split(':').map(Number);

        const closesNextDay =
          closeHour < openHour ||
          (closeHour === openHour && closeMin < openMin);

        return { ...hour, closesNextDay };
      }
      return { ...hour, closesNextDay: false };
    });
  }, [businessHours]);

  // Función para detectar conflictos de horarios
  const checkScheduleConflict = (dayIndex: number): string | null => {
    const currentDay = initializedHours.find((h) => h.dayOfWeek === dayIndex);
    if (!currentDay || currentDay.isClosed || !currentDay.openingTime) {
      return null;
    }

    // Verificar si el día anterior cierra después de medianoche
    const previousDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
    const previousDay = initializedHours.find(
      (h) => h.dayOfWeek === previousDayIndex,
    );

    if (
      !previousDay ||
      previousDay.isClosed ||
      !previousDay.closesNextDay ||
      !previousDay.closingTime
    ) {
      return null;
    }

    // Comparar horarios
    const [currentOpenHour, currentOpenMin] = currentDay.openingTime
      .split(':')
      .map(Number);
    const [prevCloseHour, prevCloseMin] = previousDay.closingTime
      .split(':')
      .map(Number);

    const currentOpenMinutes = currentOpenHour * 60 + currentOpenMin;
    const prevCloseMinutes = prevCloseHour * 60 + prevCloseMin;

    // Si el día actual abre antes o exactamente cuando cierre el día anterior
    if (currentOpenMinutes <= prevCloseMinutes) {
      return `Conflicto: ${DAYS_OF_WEEK[previousDayIndex]} cierra a las ${previousDay.closingTime}. Debe haber al menos 1 minuto de diferencia`;
    }

    return null;
  };

  const handleTimeChange = (
    dayIndex: number,
    type: 'opening' | 'closing',
    time: string | null,
  ) => {
    if (!onChange || !isEditing) return;

    const updatedHours = [...initializedHours];
    const hourIndex = updatedHours.findIndex((h) => h.dayOfWeek === dayIndex);

    if (hourIndex !== -1 && time !== null) {
      if (type === 'opening') {
        updatedHours[hourIndex].openingTime = time;
      } else {
        updatedHours[hourIndex].closingTime = time;
      }

      // Detectar automáticamente si cierra al día siguiente
      const hour = updatedHours[hourIndex];
      if (hour.openingTime && hour.closingTime) {
        const [openHour, openMin] = hour.openingTime.split(':').map(Number);
        const [closeHour, closeMin] = hour.closingTime.split(':').map(Number);

        // Si la hora de cierre es menor que la de apertura, cierra al día siguiente
        hour.closesNextDay =
          closeHour < openHour ||
          (closeHour === openHour && closeMin < openMin);
      } else {
        hour.closesNextDay = false;
      }

      onChange(updatedHours as CreateBusinessHoursDto[]);
    }
  };

  const handleClosedChange = (dayIndex: number, isClosed: boolean) => {
    if (!onChange || !isEditing) return;

    const updatedHours = [...initializedHours];
    const hourIndex = updatedHours.findIndex((h) => h.dayOfWeek === dayIndex);

    if (hourIndex !== -1) {
      updatedHours[hourIndex].isClosed = isClosed;
      if (isClosed) {
        updatedHours[hourIndex].openingTime = null;
        updatedHours[hourIndex].closingTime = null;
      }
      onChange(updatedHours as CreateBusinessHoursDto[]);
    }
  };

  const formatTimeForDisplay = (
    timeString: string | null | undefined,
  ): string => {
    if (!timeString) return '';
    // Si el string tiene segundos (formato HH:MM:SS), mostrar solo HH:MM
    if (timeString.length > 5) {
      return timeString.substring(0, 5);
    }
    return timeString;
  };

  const openTimePicker = (dayIndex: number, type: 'opening' | 'closing') => {
    if (!isEditing) return;

    const dayHours = initializedHours.find((h) => h.dayOfWeek === dayIndex);
    const currentTimeString =
      dayHours?.[type === 'opening' ? 'openingTime' : 'closingTime'];

    const date = new Date();
    if (currentTimeString) {
      const [hours, minutes] = currentTimeString.split(':').map(Number);
      date.setHours(hours, minutes, 0, 0);
    } else {
      // Default times
      date.setHours(type === 'opening' ? 9 : 22, 0, 0, 0);
    }

    setCurrentPickerConfig({ dayIndex, type, currentDate: date });
    setShowTimePicker(true);
  };

  const handleTimeConfirm = (date: Date) => {
    setShowTimePicker(false);

    if (currentPickerConfig) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;

      handleTimeChange(
        currentPickerConfig.dayIndex,
        currentPickerConfig.type,
        timeString,
      );
    }
    setCurrentPickerConfig(null);
  };

  const handleTimeCancel = () => {
    setShowTimePicker(false);
    setCurrentPickerConfig(null);
  };

  return (
    <>
      <View style={styles.container}>
        {DAYS_OF_WEEK.map((day, index) => {
          const dayHours = initializedHours.find(
            (h) => h.dayOfWeek === index,
          ) || {
            dayOfWeek: index,
            openingTime: null,
            closingTime: null,
            isClosed: false,
          };

          return (
            <Card key={index} style={styles.dayCard} mode="elevated">
              <View style={styles.dayHeader}>
                <Text style={styles.dayName}>{day}</Text>
                <View style={styles.dayActions}>
                  <Switch
                    value={!dayHours.isClosed}
                    onValueChange={(value) => {
                      if (isEditing) {
                        handleClosedChange(index, !value);
                      }
                    }}
                    disabled={!isEditing}
                    color={theme.colors.primary}
                  />
                </View>
              </View>

              {!dayHours.isClosed ? (
                <View style={styles.timeContainer}>
                  <TouchableOpacity
                    style={[
                      styles.timeButton,
                      !isEditing && styles.timeButtonDisabled,
                    ]}
                    onPress={() =>
                      isEditing && openTimePicker(index, 'opening')
                    }
                    disabled={!isEditing}
                  >
                    <View style={styles.timeButtonContent}>
                      <MaterialCommunityIcons
                        name="clock-outline"
                        size={20}
                        color={
                          !isEditing
                            ? theme.colors.onSurfaceDisabled
                            : theme.colors.primary
                        }
                      />
                      <View style={styles.timeTextContainer}>
                        <Text
                          style={[
                            styles.timeLabel,
                            !isEditing && styles.timeLabelDisabled,
                          ]}
                        >
                          Apertura
                        </Text>
                        <Text
                          style={[
                            styles.timeValue,
                            !isEditing && styles.timeValueDisabled,
                          ]}
                        >
                          {formatTimeForDisplay(dayHours.openingTime) ||
                            '--:--'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  <MaterialCommunityIcons
                    name="arrow-right"
                    size={24}
                    color={
                      !isEditing
                        ? theme.colors.onSurfaceDisabled
                        : theme.colors.onSurfaceVariant
                    }
                    style={styles.arrow}
                  />

                  <TouchableOpacity
                    style={[
                      styles.timeButton,
                      !isEditing && styles.timeButtonDisabled,
                    ]}
                    onPress={() =>
                      isEditing && openTimePicker(index, 'closing')
                    }
                    disabled={!isEditing}
                  >
                    <View style={styles.timeButtonContent}>
                      <MaterialCommunityIcons
                        name="clock-check-outline"
                        size={20}
                        color={
                          !isEditing
                            ? theme.colors.onSurfaceDisabled
                            : theme.colors.primary
                        }
                      />
                      <View style={styles.timeTextContainer}>
                        <Text
                          style={[
                            styles.timeLabel,
                            !isEditing && styles.timeLabelDisabled,
                          ]}
                        >
                          Cierre
                        </Text>
                        <Text
                          style={[
                            styles.timeValue,
                            !isEditing && styles.timeValueDisabled,
                          ]}
                        >
                          {formatTimeForDisplay(dayHours.closingTime) ||
                            '--:--'}
                        </Text>
                      </View>
                      {(dayHours as any)?.closesNextDay === true && (
                        <View style={styles.nextDayBadge}>
                          <MaterialCommunityIcons
                            name="moon-waning-crescent"
                            size={12}
                            color={theme.colors.onPrimaryContainer}
                          />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.closedContainer}>
                  <Chip
                    icon="store-off"
                    mode="flat"
                    style={styles.closedChip}
                    textStyle={styles.closedChipText}
                  >
                    Cerrado
                  </Chip>
                </View>
              )}

              {/* Mostrar advertencia de conflicto */}
              {(() => {
                const conflict = checkScheduleConflict(index);
                if (conflict && !dayHours.isClosed) {
                  return (
                    <View style={styles.conflictWarning}>
                      <MaterialCommunityIcons
                        name="alert-circle"
                        size={16}
                        color={theme.colors.error}
                      />
                      <Text style={styles.conflictText}>{conflict}</Text>
                    </View>
                  );
                }
                return null;
              })()}
            </Card>
          );
        })}
      </View>

      <DateTimePickerSafe
        visible={showTimePicker}
        mode="time"
        value={currentPickerConfig?.currentDate || new Date()}
        onConfirm={handleTimeConfirm}
        onCancel={handleTimeCancel}
        minimumDate={undefined}
        maximumDate={undefined}
        minuteInterval={1}
        title={
          currentPickerConfig?.type === 'opening'
            ? `${DAYS_OF_WEEK[currentPickerConfig.dayIndex || 0]} - Apertura`
            : currentPickerConfig?.type === 'closing'
              ? `${DAYS_OF_WEEK[currentPickerConfig.dayIndex || 0]} - Cierre`
              : 'Seleccionar Hora'
        }
        allowManualInput={true}
      />
    </>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      gap: theme.spacing.s,
    },
    dayCard: {
      marginBottom: theme.spacing.s,
      backgroundColor: theme.colors.surface,
      overflow: 'hidden',
      padding: theme.spacing.m,
    },
    dayHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.s,
    },
    dayName: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.onSurface,
    },
    dayActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    timeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    timeButton: {
      flex: 1,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 12,
      padding: theme.spacing.m,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      overflow: 'visible',
    },
    timeButtonDisabled: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.surfaceVariant,
    },
    timeButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.s,
      position: 'relative',
    },
    timeTextContainer: {
      flex: 1,
    },
    timeLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 2,
    },
    timeLabelDisabled: {
      color: theme.colors.onSurfaceDisabled,
    },
    timeValue: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    timeValueDisabled: {
      color: theme.colors.onSurfaceDisabled,
      fontWeight: '500',
    },
    arrow: {
      marginHorizontal: theme.spacing.xs,
    },
    closedContainer: {
      alignItems: 'center',
      paddingVertical: theme.spacing.s,
    },
    closedChip: {
      backgroundColor: theme.colors.errorContainer,
    },
    closedChipText: {
      fontSize: 12,
      color: theme.colors.onErrorContainer,
    },
    nextDayBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: 10,
      width: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.colors.surface,
    },
    conflictWarning: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.errorContainer,
      padding: theme.spacing.s,
      marginTop: theme.spacing.s,
      borderRadius: 8,
      gap: theme.spacing.xs,
    },
    conflictText: {
      flex: 1,
      fontSize: 12,
      color: theme.colors.onErrorContainer,
      lineHeight: 16,
    },
  });

export default BusinessHoursForm;
