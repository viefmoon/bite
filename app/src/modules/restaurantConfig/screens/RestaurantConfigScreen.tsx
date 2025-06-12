import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  Switch,
  TextInput,
  Button,
  ActivityIndicator,
  Portal,
  Dialog,
  Paragraph,
  Surface,
  Chip,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import { useRestaurantConfigQueries } from '../hooks/useRestaurantConfigQueries';
import { UpdateRestaurantConfigDto } from '../types/restaurantConfig.types';
import AnimatedLabelSelector from '@/app/components/common/AnimatedLabelSelector';

const RestaurantConfigScreen: React.FC = () => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  
  const { useGetConfig, useUpdateConfig } = useRestaurantConfigQueries();
  const { data: config, isLoading, error } = useGetConfig();
  const updateConfigMutation = useUpdateConfig();

  const [formData, setFormData] = useState<UpdateRestaurantConfigDto>({});
  const [isEditing, setIsEditing] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [showOpeningTimePicker, setShowOpeningTimePicker] = useState(false);
  const [showClosingTimePicker, setShowClosingTimePicker] = useState(false);

  React.useEffect(() => {
    if (config) {
      setFormData({
        acceptingOrders: config.acceptingOrders,
        estimatedPickupTime: config.estimatedPickupTime,
        estimatedDeliveryTime: config.estimatedDeliveryTime,
        openingTime: config.openingTime,
        closingTime: config.closingTime,
      });
    }
  }, [config]);

  const handleSubmit = async () => {
    try {
      await updateConfigMutation.mutateAsync(formData);
      setIsEditing(false);
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  const handleCancel = () => {
    if (hasChanges()) {
      setShowDiscardDialog(true);
    } else {
      resetForm();
    }
  };

  const hasChanges = () => {
    if (!config) return false;
    return (
      formData.acceptingOrders !== config.acceptingOrders ||
      formData.estimatedPickupTime !== config.estimatedPickupTime ||
      formData.estimatedDeliveryTime !== config.estimatedDeliveryTime ||
      formData.openingTime !== config.openingTime ||
      formData.closingTime !== config.closingTime
    );
  };

  const resetForm = () => {
    if (config) {
      setFormData({
        acceptingOrders: config.acceptingOrders,
        estimatedPickupTime: config.estimatedPickupTime,
        estimatedDeliveryTime: config.estimatedDeliveryTime,
        openingTime: config.openingTime,
        closingTime: config.closingTime,
      });
    }
    setIsEditing(false);
  };

  const confirmDiscard = () => {
    resetForm();
    setShowDiscardDialog(false);
  };

  // Helper functions for time handling
  const parseTimeString = (timeString: string | null): Date | null => {
    if (!timeString) return null;
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, seconds || 0);
    return date;
  };

  const formatTimeToString = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}:00`;
  };

  const formatTimeForDisplay = (timeString: string | null): string => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  const handleOpeningTimeConfirm = (date: Date) => {
    setFormData({ ...formData, openingTime: formatTimeToString(date) });
    setShowOpeningTimePicker(false);
  };

  const handleClosingTimeConfirm = (date: Date) => {
    setFormData({ ...formData, closingTime: formatTimeToString(date) });
    setShowClosingTimePicker(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error al cargar la configuración</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Configuración General</Text>
            <Text style={styles.headerSubtitle}>
              Administra los ajustes principales de tu restaurante
            </Text>
          </View>
        </View>

        {/* Service Status Card */}
        <Surface style={styles.statusCard} elevation={1}>
          <View style={styles.statusHeader}>
            <MaterialCommunityIcons 
              name="store-check" 
              size={24} 
              color={theme.colors.primary} 
            />
            <Text style={styles.statusTitle}>Estado del Servicio</Text>
          </View>
          
          <View style={styles.statusContent}>
            <View style={styles.statusRow}>
              <View style={styles.statusInfo}>
                <Text style={styles.statusLabel}>Recepción de Órdenes</Text>
                <Text style={styles.statusDescription}>
                  {formData.acceptingOrders 
                    ? 'Las órdenes están siendo aceptadas' 
                    : 'No se están aceptando órdenes nuevas'}
                </Text>
              </View>
              <Switch
                value={formData.acceptingOrders}
                onValueChange={(value) =>
                  setFormData({ ...formData, acceptingOrders: value })
                }
                disabled={!isEditing}
                color={theme.colors.primary}
                thumbColor={formData.acceptingOrders ? theme.colors.primary : undefined}
                trackColor={{
                  false: theme.colors.surfaceVariant,
                  true: theme.colors.primaryContainer,
                }}
              />
            </View>
          </View>
        </Surface>

        {/* Delivery Times Card */}
        <Surface style={styles.timesCard} elevation={1}>
          <View style={styles.timesHeader}>
            <MaterialCommunityIcons 
              name="clock-time-four" 
              size={24} 
              color={theme.colors.primary} 
            />
            <Text style={styles.timesTitle}>Tiempos de Entrega</Text>
          </View>

          <View style={styles.timesContent}>
            <View style={styles.timeInputContainer}>
              <View style={styles.timeIconWrapper}>
                <MaterialCommunityIcons 
                  name="walk" 
                  size={20} 
                  color={theme.colors.onSurfaceVariant} 
                />
              </View>
              <TextInput
                label="Para recoger en tienda"
                value={formData.estimatedPickupTime?.toString() || ''}
                onChangeText={(text) =>
                  setFormData({
                    ...formData,
                    estimatedPickupTime: parseInt(text) || 0,
                  })
                }
                keyboardType="numeric"
                mode="outlined"
                disabled={!isEditing}
                style={styles.timeInput}
                right={<TextInput.Affix text="min" />}
                outlineStyle={styles.inputOutline}
              />
            </View>

            <View style={styles.timeInputContainer}>
              <View style={styles.timeIconWrapper}>
                <MaterialCommunityIcons 
                  name="moped" 
                  size={20} 
                  color={theme.colors.onSurfaceVariant} 
                />
              </View>
              <TextInput
                label="Entrega a domicilio"
                value={formData.estimatedDeliveryTime?.toString() || ''}
                onChangeText={(text) =>
                  setFormData({
                    ...formData,
                    estimatedDeliveryTime: parseInt(text) || 0,
                  })
                }
                keyboardType="numeric"
                mode="outlined"
                disabled={!isEditing}
                style={styles.timeInput}
                right={<TextInput.Affix text="min" />}
                outlineStyle={styles.inputOutline}
              />
            </View>

            <View style={styles.infoChip}>
              <Chip 
                icon="information" 
                mode="flat"
                style={styles.chip}
                textStyle={styles.chipText}
              >
                Los tiempos son estimados y pueden variar
              </Chip>
            </View>
          </View>
        </Surface>

        {/* Schedule Card */}
        <Surface style={styles.scheduleCard} elevation={1}>
          <View style={styles.scheduleHeader}>
            <MaterialCommunityIcons 
              name="calendar-clock" 
              size={24} 
              color={theme.colors.primary} 
            />
            <Text style={styles.scheduleTitle}>Horario de Operación</Text>
          </View>

          <View style={styles.scheduleContent}>
            <View style={styles.scheduleInputContainer}>
              <View style={styles.scheduleIconWrapper}>
                <MaterialCommunityIcons 
                  name="store-clock" 
                  size={20} 
                  color={theme.colors.onSurfaceVariant} 
                />
              </View>
              <View style={styles.scheduleInput}>
                <AnimatedLabelSelector
                  label="Hora de apertura"
                  value={formatTimeForDisplay(formData.openingTime || null)}
                  onPress={() => isEditing && setShowOpeningTimePicker(true)}
                  onClear={() => isEditing && setFormData({ ...formData, openingTime: null })}
                  disabled={!isEditing}
                />
              </View>
            </View>

            <View style={styles.scheduleInputContainer}>
              <View style={styles.scheduleIconWrapper}>
                <MaterialCommunityIcons 
                  name="store-off" 
                  size={20} 
                  color={theme.colors.onSurfaceVariant} 
                />
              </View>
              <View style={styles.scheduleInput}>
                <AnimatedLabelSelector
                  label="Hora de cierre"
                  value={formatTimeForDisplay(formData.closingTime || null)}
                  onPress={() => isEditing && setShowClosingTimePicker(true)}
                  onClear={() => isEditing && setFormData({ ...formData, closingTime: null })}
                  disabled={!isEditing}
                />
              </View>
            </View>

            <View style={styles.infoChip}>
              <Chip 
                icon="information" 
                mode="flat"
                style={styles.chip}
                textStyle={styles.chipText}
              >
                Formato 24 horas (ej: 09:00:00, 22:30:00)
              </Chip>
            </View>
          </View>
        </Surface>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {!isEditing ? (
            <Button
              mode="contained"
              onPress={() => setIsEditing(true)}
              style={[styles.editButton, { backgroundColor: theme.colors.tertiary }]}
              contentStyle={styles.editButtonContent}
              labelStyle={styles.editButtonLabel}
              icon="pencil"
              textColor={theme.colors.onTertiary}
            >
              Editar Configuración
            </Button>
          ) : (
            <View style={styles.editActions}>
              <Button
                mode="outlined"
                onPress={handleCancel}
                style={styles.cancelButton}
                contentStyle={styles.buttonContent}
              >
                Cancelar
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={updateConfigMutation.isPending}
                disabled={updateConfigMutation.isPending || !hasChanges()}
                style={styles.saveButton}
                contentStyle={styles.buttonContent}
                icon="check"
              >
                Guardar
              </Button>
            </View>
          )}
        </View>

        {/* System Info Card */}
        {config && (
          <Surface style={styles.infoCard} elevation={1}>
            <View style={styles.infoContent}>
              <MaterialCommunityIcons 
                name="information-outline" 
                size={20} 
                color={theme.colors.onSurfaceVariant} 
              />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Última actualización</Text>
                <Text style={styles.infoText}>
                  {new Date(config.updatedAt).toLocaleString('es-MX', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                </Text>
              </View>
            </View>
          </Surface>
        )}
      </ScrollView>

      <Portal>
        <Dialog visible={showDiscardDialog} onDismiss={() => setShowDiscardDialog(false)}>
          <Dialog.Title>Descartar cambios</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              ¿Estás seguro de que deseas descartar los cambios realizados?
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDiscardDialog(false)}>Cancelar</Button>
            <Button onPress={confirmDiscard}>Descartar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Time Picker Modals */}
      <DateTimePickerModal
        isVisible={showOpeningTimePicker}
        mode="time"
        onConfirm={handleOpeningTimeConfirm}
        onCancel={() => setShowOpeningTimePicker(false)}
        date={parseTimeString(formData.openingTime || null) || new Date()}
        locale="es_ES"
        is24Hour={true}
      />

      <DateTimePickerModal
        isVisible={showClosingTimePicker}
        mode="time"
        onConfirm={handleClosingTimeConfirm}
        onCancel={() => setShowClosingTimePicker(false)}
        date={parseTimeString(formData.closingTime || null) || new Date()}
        locale="es_ES"
        is24Hour={true}
      />
    </SafeAreaView>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      paddingBottom: theme.spacing.xl,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    errorText: {
      fontSize: 16,
      color: theme.colors.error,
      textAlign: 'center',
    },
    // Header styles
    header: {
      backgroundColor: theme.colors.primaryContainer,
      paddingTop: theme.spacing.m,
      paddingBottom: theme.spacing.m,
      paddingHorizontal: theme.spacing.m,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
    },
    headerContent: {
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.onPrimaryContainer,
      marginBottom: theme.spacing.xs,
    },
    headerSubtitle: {
      fontSize: 13,
      color: theme.colors.onPrimaryContainer,
      opacity: 0.8,
      textAlign: 'center',
    },
    // Status Card styles
    statusCard: {
      marginHorizontal: theme.spacing.m,
      marginTop: theme.spacing.l,
      borderRadius: 16,
      padding: theme.spacing.m,
      backgroundColor: theme.colors.surface,
    },
    statusHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.m,
    },
    statusTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginLeft: theme.spacing.s,
    },
    statusContent: {
      gap: theme.spacing.m,
    },
    statusRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statusInfo: {
      flex: 1,
      marginRight: theme.spacing.m,
    },
    statusLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.xs,
    },
    statusDescription: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    // Times Card styles
    timesCard: {
      marginHorizontal: theme.spacing.m,
      marginTop: theme.spacing.m,
      borderRadius: 16,
      padding: theme.spacing.m,
      backgroundColor: theme.colors.surface,
    },
    timesHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.m,
    },
    timesTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginLeft: theme.spacing.s,
    },
    timesContent: {
      gap: theme.spacing.m,
    },
    timeInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.s,
    },
    timeIconWrapper: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surfaceVariant,
      justifyContent: 'center',
      alignItems: 'center',
    },
    timeInput: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    inputOutline: {
      borderRadius: 12,
    },
    infoChip: {
      marginTop: theme.spacing.xs,
    },
    chip: {
      backgroundColor: theme.colors.secondaryContainer,
    },
    chipText: {
      fontSize: 12,
    },
    // Schedule Card styles
    scheduleCard: {
      marginHorizontal: theme.spacing.m,
      marginTop: theme.spacing.m,
      borderRadius: 16,
      padding: theme.spacing.m,
      backgroundColor: theme.colors.surface,
    },
    scheduleHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.m,
    },
    scheduleTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginLeft: theme.spacing.s,
    },
    scheduleContent: {
      gap: theme.spacing.m,
    },
    scheduleInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.s,
    },
    scheduleIconWrapper: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surfaceVariant,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scheduleInput: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    // Action styles
    actionContainer: {
      marginHorizontal: theme.spacing.m,
      marginTop: theme.spacing.l,
    },
    editButton: {
      borderRadius: 12,
      elevation: 2,
    },
    editButtonContent: {
      paddingVertical: theme.spacing.xs,
    },
    editButtonLabel: {
      fontSize: 16,
      fontWeight: '600',
    },
    editActions: {
      flexDirection: 'row',
      gap: theme.spacing.s,
    },
    cancelButton: {
      flex: 1,
      borderRadius: 12,
    },
    saveButton: {
      flex: 1,
      borderRadius: 12,
      elevation: 2,
    },
    buttonContent: {
      paddingVertical: theme.spacing.xs,
    },
    // Info Card styles
    infoCard: {
      marginHorizontal: theme.spacing.m,
      marginTop: theme.spacing.m,
      borderRadius: 12,
      padding: theme.spacing.m,
      backgroundColor: theme.colors.surfaceVariant,
    },
    infoContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.s,
    },
    infoTextContainer: {
      flex: 1,
    },
    infoTitle: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      opacity: 0.7,
    },
    infoText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
    },
  });

export default RestaurantConfigScreen;