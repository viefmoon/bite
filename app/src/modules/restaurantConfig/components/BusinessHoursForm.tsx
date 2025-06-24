import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Switch, Chip, Surface, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import AnimatedLabelSelector from '@/app/components/common/AnimatedLabelSelector';
import {
  BusinessHours,
  CreateBusinessHoursDto,
} from '../types/restaurantConfig.types';

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

  const [showTimePicker, setShowTimePicker] = React.useState<{
    dayIndex: number;
    type: 'opening' | 'closing';
  } | null>(null);

  // Initialize business hours if empty
  const initializedHours = React.useMemo(() => {
    if (businessHours.length === 0) {
      return DAYS_OF_WEEK.map((_, index) => ({
        dayOfWeek: index,
        openingTime: '09:00',
        closingTime: '22:00',
        isClosed: false,
      }));
    }
    return businessHours;
  }, [businessHours]);

  const handleTimeChange = (
    dayIndex: number,
    type: 'opening' | 'closing',
    time: string | null,
  ) => {
    const updatedHours = [...initializedHours];
    const hourIndex = updatedHours.findIndex((h) => h.dayOfWeek === dayIndex);

    if (hourIndex !== -1 && time !== null) {
      if (type === 'opening') {
        updatedHours[hourIndex].openingTime = time;
      } else {
        updatedHours[hourIndex].closingTime = time;
      }
      onChange(updatedHours as CreateBusinessHoursDto[]);
    }
  };

  const handleClosedChange = (dayIndex: number, isClosed: boolean) => {
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

  const parseTimeString = (timeString: string | null): Date | null => {
    if (!timeString) return null;
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0);
    return date;
  };

  const formatTimeToString = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatTimeForDisplay = (
    timeString: string | null | undefined,
  ): string => {
    if (!timeString) return '';
    return timeString;
  };

  const handleTimeConfirm = (date: Date) => {
    if (showTimePicker) {
      handleTimeChange(
        showTimePicker.dayIndex,
        showTimePicker.type,
        formatTimeToString(date),
      );
      setShowTimePicker(null);
    }
  };

  const copyHoursToAllDays = (dayIndex: number) => {
    const sourceHour = initializedHours.find((h) => h.dayOfWeek === dayIndex);
    if (!sourceHour) return;

    const updatedHours = initializedHours.map((hour) => ({
      ...hour,
      openingTime: sourceHour.openingTime,
      closingTime: sourceHour.closingTime,
      isClosed: sourceHour.isClosed,
    }));

    onChange(updatedHours as CreateBusinessHoursDto[]);
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
            <Surface key={index} style={styles.dayCard} elevation={1}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayName}>{day}</Text>
                <View style={styles.dayActions}>
                  {isEditing &&
                    index === 1 && ( // Solo mostrar en Lunes
                      <IconButton
                        icon="content-copy"
                        size={20}
                        onPress={() => copyHoursToAllDays(index)}
                      />
                    )}
                  <Switch
                    value={!dayHours.isClosed}
                    onValueChange={(value) => handleClosedChange(index, !value)}
                    disabled={!isEditing}
                    color={theme.colors.primary}
                  />
                </View>
              </View>

              {!dayHours.isClosed ? (
                <View style={styles.timeContainer}>
                  <View style={styles.timeInput}>
                    <AnimatedLabelSelector
                      label="Apertura"
                      value={formatTimeForDisplay(dayHours.openingTime)}
                      onPress={() =>
                        isEditing &&
                        setShowTimePicker({ dayIndex: index, type: 'opening' })
                      }
                      disabled={!isEditing}
                    />
                  </View>
                  <MaterialCommunityIcons
                    name="arrow-right"
                    size={20}
                    color={theme.colors.onSurfaceVariant}
                    style={styles.arrow}
                  />
                  <View style={styles.timeInput}>
                    <AnimatedLabelSelector
                      label="Cierre"
                      value={formatTimeForDisplay(dayHours.closingTime)}
                      onPress={() =>
                        isEditing &&
                        setShowTimePicker({ dayIndex: index, type: 'closing' })
                      }
                      disabled={!isEditing}
                    />
                  </View>
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
            </Surface>
          );
        })}
      </View>

      <DateTimePickerModal
        isVisible={showTimePicker !== null}
        mode="time"
        onConfirm={handleTimeConfirm}
        onCancel={() => setShowTimePicker(null)}
        date={
          showTimePicker
            ? parseTimeString(
                initializedHours.find(
                  (h) => h.dayOfWeek === showTimePicker.dayIndex,
                )?.[
                  showTimePicker.type === 'opening'
                    ? 'openingTime'
                    : 'closingTime'
                ] || null,
              ) || new Date()
            : new Date()
        }
        locale="es_ES"
        is24Hour={true}
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
      borderRadius: 12,
      padding: theme.spacing.m,
      backgroundColor: theme.colors.surface,
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
      gap: theme.spacing.s,
    },
    timeInput: {
      flex: 1,
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
  });

export default BusinessHoursForm;
