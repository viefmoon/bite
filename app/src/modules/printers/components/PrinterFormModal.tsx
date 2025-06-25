import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Modal,
  Portal,
  Text,
  Button,
  Switch,
  HelperText,
  ActivityIndicator,
  RadioButton,
} from 'react-native-paper';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAppTheme, AppTheme } from '../../../app/styles/theme';
import {
  PrinterFormData,
  printerFormSchema,
  ThermalPrinter,
  CreateThermalPrinterDto,
  UpdateThermalPrinterDto,
} from '../schema/printer.schema';
import {
  useCreatePrinterMutation,
  useUpdatePrinterMutation,
} from '../hooks/usePrintersQueries';
import AnimatedLabelInput from '../../../app/components/common/AnimatedLabelInput';

interface PrinterFormModalProps {
  visible: boolean;
  onDismiss: () => void;
  editingItem: ThermalPrinter | null;
  initialDataFromDiscovery?: Partial<PrinterFormData>;
}

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    modalSurface: {
      padding: 0,
      margin: theme.spacing.l,
      borderRadius: theme.roundness * 2,
      elevation: 4,
      backgroundColor: theme.colors.background,
      maxHeight: '90%',
      overflow: 'hidden',
    },
    modalHeader: {
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.m,
      paddingHorizontal: theme.spacing.l,
    },
    formContainer: {
      maxHeight: '100%',
    },
    scrollViewContent: {
      padding: theme.spacing.l,
      paddingBottom: theme.spacing.xl,
    },
    modalTitle: {
      color: theme.colors.onPrimary,
      fontWeight: '700',
      textAlign: 'center',
    },
    input: {
      marginBottom: theme.spacing.m,
    },
    switchLabel: {
      color: theme.colors.onSurfaceVariant,
      marginRight: theme.spacing.m,
      fontSize: 16,
      flexShrink: 1,
    },
    switchComponentContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.m,
      paddingVertical: theme.spacing.s,
    },
    radioGroupContainer: {
      marginBottom: theme.spacing.m,
    },
    radioGroupLabel: {
      marginBottom: theme.spacing.xs,
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
    },
    radioGroupHorizontal: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      flexWrap: 'wrap',
    },
    radioButtonItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: theme.spacing.s,
      paddingVertical: 0,
    },
    radioLabel: {
      fontSize: 14,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'center',
      paddingVertical: theme.spacing.m,
      paddingHorizontal: theme.spacing.l,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      gap: theme.spacing.m,
    },
    formButton: {
      borderRadius: theme.roundness,
      paddingHorizontal: theme.spacing.xs,
      flex: 1,
      maxWidth: 200,
    },
    cancelButton: {},
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: theme.roundness * 2,
      zIndex: 10,
    },
    helperText: {
      marginTop: -theme.spacing.s,
      marginBottom: theme.spacing.s,
    },
  });

const PrinterFormModal: React.FC<PrinterFormModalProps> = ({
  visible,
  onDismiss,
  editingItem,
  initialDataFromDiscovery,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const isEditing = !!editingItem;

  const createMutation = useCreatePrinterMutation();
  const updateMutation = useUpdatePrinterMutation();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const defaultValues = useMemo((): PrinterFormData => {
    const baseDefaults: PrinterFormData = {
      name: '',
      connectionType: 'NETWORK',
      ipAddress: undefined,
      port: undefined,
      path: undefined,
      isActive: true,
      macAddress: undefined,
    };
    // Aplicar valores iniciales si se está editando
    if (isEditing && editingItem) {
      return {
        name: editingItem.name,
        connectionType: editingItem.connectionType,
        ipAddress: editingItem.ipAddress ?? undefined,
        port: editingItem.port ?? undefined,
        path: editingItem.path ?? undefined,
        isActive: editingItem.isActive,
        macAddress: editingItem.macAddress ?? undefined,
      };
    }
    // Aplicar valores desde descubrimiento si se está creando y existen
    if (!isEditing && initialDataFromDiscovery) {
      return {
        ...baseDefaults,
        name:
          initialDataFromDiscovery.name ||
          `Impresora ${initialDataFromDiscovery.ipAddress}`,
        connectionType: 'NETWORK',
        ipAddress: initialDataFromDiscovery.ipAddress,
        port: initialDataFromDiscovery.port,
        macAddress: initialDataFromDiscovery.macAddress,
      };
    }
    return baseDefaults;
  }, [editingItem, isEditing, initialDataFromDiscovery]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PrinterFormData>({
    resolver: zodResolver(printerFormSchema),
    defaultValues: defaultValues,
  });

  const connectionType = watch('connectionType');

  useEffect(() => {
    if (visible) {
      reset(defaultValues);
    }
  }, [visible, editingItem, initialDataFromDiscovery, reset, defaultValues]);

  const onSubmit: SubmitHandler<PrinterFormData> = async (formData) => {
    const dataToSend = { ...formData };
    if (dataToSend.connectionType === 'NETWORK') {
      dataToSend.path = undefined;
    } else {
      dataToSend.ipAddress = undefined;
      dataToSend.port = undefined;
    }
    if (dataToSend.port && typeof dataToSend.port === 'string') {
      dataToSend.port = parseInt(dataToSend.port, 10);
      if (isNaN(dataToSend.port)) {
        dataToSend.port = undefined;
      }
    }

    try {
      if (isEditing && editingItem) {
        await updateMutation.mutateAsync({
          id: editingItem.id,
          data: dataToSend as UpdateThermalPrinterDto,
        });
      } else {
        await createMutation.mutateAsync(dataToSend as CreateThermalPrinterDto);
      }
      onDismiss();
    } catch (error) {}
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalSurface}
        dismissable={!isSubmitting}
      >
        <View style={styles.formContainer}>
          <View style={styles.modalHeader}>
            <Text variant="titleLarge" style={styles.modalTitle}>
              {isEditing ? 'Editar Impresora' : 'Nueva Impresora'}
            </Text>
          </View>

          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            {/* Nombre */}
            <Controller
              name="name"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <AnimatedLabelInput
                  label="Nombre *"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={!!errors.name}
                  disabled={isSubmitting}
                  containerStyle={styles.input}
                />
              )}
            />
            {errors.name && (
              <HelperText
                type="error"
                visible={!!errors.name}
                style={styles.helperText}
              >
                {errors.name.message}
              </HelperText>
            )}

            {/* Tipo de Conexión */}
            <View style={styles.radioGroupContainer}>
              <Text style={styles.radioGroupLabel}>Tipo de Conexión *</Text>
              <Controller
                name="connectionType"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <RadioButton.Group onValueChange={onChange} value={value}>
                    <View style={styles.radioGroupHorizontal}>
                      <RadioButton.Item
                        label="Red"
                        value="NETWORK"
                        style={styles.radioButtonItem}
                        labelStyle={styles.radioLabel}
                        position="leading"
                        disabled={isSubmitting}
                      />
                      <RadioButton.Item
                        label="USB"
                        value="USB"
                        style={styles.radioButtonItem}
                        labelStyle={styles.radioLabel}
                        position="leading"
                        disabled={true}
                      />
                    </View>
                  </RadioButton.Group>
                )}
              />
              {errors.connectionType && (
                <HelperText
                  type="error"
                  visible={!!errors.connectionType}
                  style={styles.helperText}
                >
                  {errors.connectionType.message}
                </HelperText>
              )}
            </View>

            {/* Campos Condicionales */}
            {connectionType === 'NETWORK' && (
              <>
                <Controller
                  name="ipAddress"
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <AnimatedLabelInput
                      label="Dirección IP *"
                      value={value ?? ''}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={!!errors.ipAddress}
                      disabled={isSubmitting}
                      containerStyle={styles.input}
                      keyboardType="decimal-pad"
                    />
                  )}
                />
                {errors.ipAddress && (
                  <HelperText
                    type="error"
                    visible={!!errors.ipAddress}
                    style={styles.helperText}
                  >
                    {errors.ipAddress.message}
                  </HelperText>
                )}

                <Controller
                  name="port"
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <AnimatedLabelInput
                      label="Puerto *"
                      value={
                        value !== undefined && value !== null
                          ? String(value)
                          : ''
                      }
                      onChangeText={(text) => {
                        if (!text) {
                          onChange(undefined);
                          return;
                        }
                        const parsedPort = parseInt(text, 10);
                        onChange(isNaN(parsedPort) ? undefined : parsedPort);
                      }}
                      onBlur={onBlur}
                      error={!!errors.port}
                      disabled={isSubmitting}
                      containerStyle={styles.input}
                      keyboardType="number-pad"
                    />
                  )}
                />
                {errors.port && (
                  <HelperText
                    type="error"
                    visible={!!errors.port}
                    style={styles.helperText}
                  >
                    {errors.port.message}
                  </HelperText>
                )}

                <Controller
                  name="macAddress"
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <AnimatedLabelInput
                      label="Dirección MAC (Opcional)"
                      value={value ?? ''}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={!!errors.macAddress}
                      disabled={isSubmitting}
                      containerStyle={styles.input}
                      autoCapitalize="characters"
                    />
                  )}
                />
                {errors.macAddress && (
                  <HelperText
                    type="error"
                    visible={!!errors.macAddress}
                    style={styles.helperText}
                  >
                    {errors.macAddress.message}
                  </HelperText>
                )}
              </>
            )}

            {connectionType !== 'NETWORK' && (
              <>
                <Controller
                  name="path"
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <AnimatedLabelInput
                      label="Ruta / Identificador *"
                      value={value ?? ''}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={!!errors.path}
                      disabled={isSubmitting}
                      containerStyle={styles.input}
                      placeholder={
                        connectionType === 'USB'
                          ? '/dev/usb/lp0'
                          : connectionType === 'SERIAL'
                            ? '/dev/ttyS0'
                            : 'Dirección BT'
                      }
                    />
                  )}
                />
                {errors.path && (
                  <HelperText
                    type="error"
                    visible={!!errors.path}
                    style={styles.helperText}
                  >
                    {errors.path.message}
                  </HelperText>
                )}
              </>
            )}

            {/* Estado Activo */}
            <View style={styles.switchComponentContainer}>
              <Text variant="bodyLarge" style={styles.switchLabel}>
                Activa
              </Text>
              <Controller
                name="isActive"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <Switch
                    value={value}
                    onValueChange={onChange}
                    disabled={isSubmitting}
                  />
                )}
              />
            </View>
            {errors.isActive && (
              <HelperText
                type="error"
                visible={!!errors.isActive}
                style={styles.helperText}
              >
                {errors.isActive.message}
              </HelperText>
            )}
          </ScrollView>

          {isSubmitting && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator
                animating={true}
                size="large"
                color={theme.colors.primary}
              />
            </View>
          )}

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={onDismiss}
              style={[styles.formButton, styles.cancelButton]}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              disabled={isSubmitting}
              style={styles.formButton}
            >
              {isEditing ? 'Guardar' : 'Crear'}
            </Button>
          </View>
        </View>
      </Modal>
    </Portal>
  );
};

export default PrinterFormModal;
