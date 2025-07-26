import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Portal,
  Modal,
  Text,
  TextInput,
  Button,
  Switch,
  HelperText,
  Surface,
  IconButton,
  Chip,
  Avatar,
  Icon,
} from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@/app/lib/zodResolver';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import { useResponsive } from '@/app/hooks/useResponsive';
import {
  Customer,
  Address,
  CustomerFormInputs,
  customerFormSchema,
} from '../schema/customer.schema';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import AnimatedLabelSelector from '@/app/components/common/AnimatedLabelSelector';
import { DateTimePickerSafe } from '@/app/components/DateTimePickerSafe';
import PhoneNumberInput from '@/app/components/common/PhoneNumberInput';
import { useGetAddressesByCustomer } from '../hooks/useCustomersQueries';
import AddressFormModal from './AddressFormModal';
import { addressesService } from '../services/addressesService';
import { useSnackbarStore } from '@/app/store/snackbarStore';

interface CustomerFormModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (data: CustomerFormInputs) => Promise<void>;
  editingItem: Customer | null;
  isSubmitting: boolean;
}

export default function CustomerFormModal({
  visible,
  onDismiss,
  onSubmit,
  editingItem,
  isSubmitting,
}: CustomerFormModalProps) {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const styles = getStyles(theme, responsive);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isSubmittingAddress, setIsSubmittingAddress] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [dateOnChange, setDateOnChange] = useState<
    ((value: string) => void) | null
  >(null);
  const { showSnackbar } = useSnackbarStore();

  // Query para obtener direcciones del cliente
  const { data: addresses = [], refetch: refetchAddresses } =
    useGetAddressesByCustomer(editingItem?.id || '', {
      enabled: !!editingItem?.id,
    });

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CustomerFormInputs>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      whatsappPhoneNumber: '',
      email: '',
      birthDate: '',
      isActive: true,
      isBanned: false,
      banReason: '',
    },
  });

  useEffect(() => {
    if (editingItem) {
      reset({
        firstName: editingItem.firstName,
        lastName: editingItem.lastName,
        whatsappPhoneNumber: editingItem.whatsappPhoneNumber || '',
        email: editingItem.email || '',
        birthDate: editingItem.birthDate
          ? new Date(editingItem.birthDate).toISOString().split('T')[0]
          : '',
        isActive: editingItem.isActive,
        isBanned: editingItem.isBanned || false,
        banReason: editingItem.banReason || '',
      });
    } else {
      reset({
        firstName: '',
        lastName: '',
        whatsappPhoneNumber: '',
        email: '',
        birthDate: '',
        isActive: true,
        isBanned: false,
        banReason: '',
      });
    }
  }, [editingItem, reset]);

  const isBanned = watch('isBanned');

  const handleAddressSubmit = async (data: any) => {
    try {
      setIsSubmittingAddress(true);
      if (editingAddress) {
        await addressesService.update(editingAddress.id, data);
        showSnackbar({ message: 'Dirección actualizada', type: 'success' });
      } else if (editingItem) {
        await addressesService.create(editingItem.id, data);
        showSnackbar({ message: 'Dirección agregada', type: 'success' });
      }
      await refetchAddresses();
      setShowAddressModal(false);
      setEditingAddress(null);
    } catch (error) {
      showSnackbar({ message: 'Error al guardar la dirección', type: 'error' });
    } finally {
      setIsSubmittingAddress(false);
    }
  };

  const handleFormSubmit = async (data: CustomerFormInputs) => {
    // Limpiar campos vacíos antes de enviar
    const cleanedData = {
      ...data,
      email: data.email || undefined,
      birthDate: data.birthDate || undefined,
      banReason: data.banReason || undefined,
    };

    // El número ya viene completo desde nuestro componente
    await onSubmit(cleanedData);
  };

  return (
    <>
      <Portal>
        <Modal
          visible={visible}
          onDismiss={onDismiss}
          contentContainerStyle={styles.modalContainer}
        >
          <Surface style={styles.modalContent} elevation={5}>
            <View
              style={[
                styles.headerContainer,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <View style={styles.headerLeft}>
                <Avatar.Icon
                  size={32}
                  icon={editingItem ? 'account-edit' : 'account-plus'}
                  style={[
                    styles.headerIcon,
                    { backgroundColor: theme.colors.onPrimary + '20' },
                  ]}
                  color={theme.colors.onPrimary}
                />
                <View style={styles.headerTextContainer}>
                  <Text
                    style={[
                      styles.modalTitle,
                      { color: theme.colors.onPrimary },
                    ]}
                    variant="titleMedium"
                  >
                    {editingItem ? 'Editar Cliente' : 'Nuevo Cliente'}
                  </Text>
                </View>
              </View>
              <IconButton
                icon="close"
                size={24}
                onPress={onDismiss}
                disabled={isSubmitting}
                iconColor={theme.colors.onPrimary}
              />
            </View>

            <ScrollView
              style={styles.formContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle} variant="titleMedium">
                    Información Personal
                  </Text>
                  <Chip
                    mode="flat"
                    compact
                    style={styles.requiredChip}
                    textStyle={styles.requiredChipText}
                  >
                    Requerido
                  </Chip>
                </View>

                <Controller
                  control={control}
                  name="firstName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.inputContainer}>
                      <TextInput
                        label="Nombre"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={!!errors.firstName}
                        mode="outlined"
                        placeholder="Ej: Juan"
                        left={<TextInput.Icon icon="account" />}
                        outlineStyle={styles.inputOutline}
                      />
                      {errors.firstName && (
                        <HelperText type="error" visible={!!errors.firstName}>
                          {errors.firstName.message}
                        </HelperText>
                      )}
                    </View>
                  )}
                />

                <Controller
                  control={control}
                  name="lastName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.inputContainer}>
                      <TextInput
                        label="Apellido"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={!!errors.lastName}
                        mode="outlined"
                        placeholder="Ej: Pérez"
                        left={<TextInput.Icon icon="account" />}
                        outlineStyle={styles.inputOutline}
                      />
                      {errors.lastName && (
                        <HelperText type="error" visible={!!errors.lastName}>
                          {errors.lastName.message}
                        </HelperText>
                      )}
                    </View>
                  )}
                />
              </View>

              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle} variant="titleMedium">
                    Información de Contacto
                  </Text>
                  <Chip
                    mode="flat"
                    compact
                    style={styles.optionalChip}
                    textStyle={styles.optionalChipText}
                  >
                    Opcional
                  </Chip>
                </View>

                <Controller
                  control={control}
                  name="whatsappPhoneNumber"
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.inputContainer}>
                      <PhoneNumberInput
                        value={value || ''}
                        onChange={onChange}
                        error={!!errors.whatsappPhoneNumber}
                        helperText={errors.whatsappPhoneNumber?.message}
                        placeholder="Teléfono"
                      />
                    </View>
                  )}
                />

                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.inputContainer}>
                      <TextInput
                        label="Correo electrónico"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={!!errors.email}
                        mode="outlined"
                        placeholder="juan@example.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        left={<TextInput.Icon icon="email" />}
                        outlineStyle={styles.inputOutline}
                      />
                      {errors.email && (
                        <HelperText type="error" visible={!!errors.email}>
                          {errors.email.message}
                        </HelperText>
                      )}
                    </View>
                  )}
                />

                <Controller
                  control={control}
                  name="birthDate"
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.inputContainer}>
                      <AnimatedLabelSelector
                        label="Fecha de nacimiento"
                        value={
                          value
                            ? format(new Date(value), "d 'de' MMMM 'de' yyyy", {
                                locale: es,
                              })
                            : ''
                        }
                        onPress={() => {
                          setTempDate(value ? new Date(value) : new Date());
                          setDateOnChange(() => onChange);
                          setShowDatePicker(true);
                        }}
                        error={!!errors.birthDate}
                      />
                      {errors.birthDate && (
                        <HelperText type="error" visible={!!errors.birthDate}>
                          {errors.birthDate.message}
                        </HelperText>
                      )}
                    </View>
                  )}
                />
              </View>

              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle} variant="titleMedium">
                    Estado
                  </Text>
                </View>

                <Controller
                  control={control}
                  name="isActive"
                  render={({ field: { onChange, value } }) => (
                    <Surface style={styles.switchContainer} elevation={1}>
                      <View style={styles.switchContent}>
                        <View style={styles.switchTextContainer}>
                          <Text style={styles.switchLabel} variant="bodyLarge">
                            Cliente activo
                          </Text>
                        </View>
                        <Switch
                          value={value}
                          onValueChange={onChange}
                          color={theme.colors.primary}
                        />
                      </View>
                    </Surface>
                  )}
                />

                <Controller
                  control={control}
                  name="isBanned"
                  render={({ field: { onChange, value } }) => (
                    <Surface
                      style={[styles.switchContainer, styles.bannedContainer]}
                      elevation={1}
                    >
                      <View style={styles.switchContent}>
                        <View style={styles.switchTextContainer}>
                          <Text style={styles.switchLabel} variant="bodyLarge">
                            Cliente baneado
                          </Text>
                          <Text
                            style={styles.switchDescription}
                            variant="bodySmall"
                          >
                            Los clientes baneados no pueden realizar pedidos
                          </Text>
                        </View>
                        <Switch
                          value={value}
                          onValueChange={onChange}
                          color={theme.colors.error}
                        />
                      </View>
                    </Surface>
                  )}
                />

                {isBanned && (
                  <>
                    <Controller
                      control={control}
                      name="banReason"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <View
                          style={[
                            styles.inputContainer,
                            styles.banReasonContainer,
                          ]}
                        >
                          <TextInput
                            label="Razón del baneo"
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            mode="outlined"
                            placeholder="Ej: Comportamiento inapropiado"
                            multiline
                            numberOfLines={2}
                            left={<TextInput.Icon icon="alert-circle" />}
                            outlineStyle={styles.inputOutline}
                            outlineColor={theme.colors.error}
                            activeOutlineColor={theme.colors.error}
                          />
                        </View>
                      )}
                    />

                    {editingItem?.bannedAt && (
                      <Surface style={styles.infoCard} elevation={1}>
                        <View style={styles.infoCardContent}>
                          <IconButton
                            icon="calendar-clock"
                            size={20}
                            iconColor={theme.colors.error}
                          />
                          <View style={styles.infoText}>
                            <Text
                              variant="labelMedium"
                              style={styles.infoLabel}
                            >
                              Fecha de baneo
                            </Text>
                            <Text variant="bodyMedium" style={styles.infoValue}>
                              {new Date(editingItem.bannedAt).toLocaleString()}
                            </Text>
                          </View>
                        </View>
                      </Surface>
                    )}
                  </>
                )}
              </View>

              {/* Sección de WhatsApp - Solo en modo edición */}
              {editingItem && (
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle} variant="titleMedium">
                      Información de WhatsApp
                    </Text>
                  </View>

                  <Surface style={styles.whatsappCard} elevation={1}>
                    <View style={styles.whatsappRow}>
                      <View style={styles.whatsappStat}>
                        <Icon
                          source="message-text"
                          size={20}
                          color={theme.colors.primary}
                        />
                        <View style={styles.whatsappStatContent}>
                          <Text
                            variant="bodySmall"
                            style={styles.whatsappLabel}
                          >
                            Mensajes totales
                          </Text>
                          <Text
                            variant="titleMedium"
                            style={styles.whatsappValue}
                          >
                            {editingItem.whatsappMessageCount || 0}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.whatsappDivider} />

                      <View style={styles.whatsappStat}>
                        <Icon
                          source="clock-outline"
                          size={20}
                          color={theme.colors.primary}
                        />
                        <View style={styles.whatsappStatContent}>
                          <Text
                            variant="bodySmall"
                            style={styles.whatsappLabel}
                          >
                            Último mensaje
                          </Text>
                          <Text
                            variant="bodyMedium"
                            style={styles.whatsappValue}
                          >
                            {editingItem.lastWhatsappMessageTime
                              ? new Date(
                                  editingItem.lastWhatsappMessageTime,
                                ).toLocaleDateString()
                              : 'Sin mensajes'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Surface>
                </View>
              )}

              {/* Sección de Stripe - Solo en modo edición */}
              {editingItem?.stripeCustomerId && (
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle} variant="titleMedium">
                      Información de Pago
                    </Text>
                  </View>

                  <Surface style={styles.stripeCard} elevation={1}>
                    <View style={styles.stripeContent}>
                      <Icon
                        source="credit-card"
                        size={24}
                        color={theme.colors.primary}
                      />
                      <View style={styles.stripeInfo}>
                        <Text variant="bodySmall" style={styles.stripeLabel}>
                          Stripe Customer ID
                        </Text>
                        <Text
                          variant="bodyMedium"
                          style={styles.stripeValue}
                          selectable
                        >
                          {editingItem.stripeCustomerId}
                        </Text>
                      </View>
                    </View>
                  </Surface>
                </View>
              )}

              {/* Sección de Direcciones - Solo en modo edición */}
              {editingItem && (
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle} variant="titleMedium">
                      Direcciones
                    </Text>
                    <Button
                      mode="text"
                      onPress={() => {
                        setEditingAddress(null);
                        setShowAddressModal(true);
                      }}
                      icon="plus"
                      compact
                    >
                      Agregar
                    </Button>
                  </View>

                  {addresses.length === 0 ? (
                    <Surface style={styles.emptyAddressContainer} elevation={0}>
                      <Text
                        style={styles.emptyAddressText}
                        variant="bodyMedium"
                      >
                        No hay direcciones registradas
                      </Text>
                    </Surface>
                  ) : (
                    <View style={styles.addressList}>
                      {addresses.map((address: Address) => (
                        <Surface
                          key={address.id}
                          style={styles.addressCard}
                          elevation={1}
                        >
                          <View style={styles.addressContent}>
                            <View style={styles.addressHeader}>
                              <IconButton
                                icon="map-marker"
                                size={20}
                                iconColor={theme.colors.primary}
                              />
                              <View style={styles.addressInfo}>
                                <Text
                                  style={styles.addressName}
                                  variant="titleSmall"
                                >
                                  {address.name}
                                </Text>
                                <Text
                                  style={styles.addressStreet}
                                  variant="bodyMedium"
                                >
                                  {address.street} {address.number}
                                  {address.interiorNumber &&
                                    `, ${address.interiorNumber}`}
                                </Text>
                                <Text
                                  style={styles.addressDetails}
                                  variant="bodySmall"
                                >
                                  {address.neighborhood}, {address.city},{' '}
                                  {address.state}
                                </Text>
                                {address.isDefault && (
                                  <Chip
                                    mode="flat"
                                    compact
                                    style={styles.defaultChip}
                                    textStyle={styles.defaultChipText}
                                  >
                                    Predeterminada
                                  </Chip>
                                )}
                              </View>
                            </View>
                            <View style={styles.addressActions}>
                              <IconButton
                                icon="pencil"
                                size={20}
                                onPress={() => {
                                  setEditingAddress(address);
                                  setShowAddressModal(true);
                                }}
                              />
                              <IconButton
                                icon="delete"
                                size={20}
                                iconColor={theme.colors.error}
                                onPress={async () => {
                                  try {
                                    await addressesService.remove(address.id);
                                    await refetchAddresses();
                                    showSnackbar({
                                      message: 'Dirección eliminada',
                                      type: 'success',
                                    });
                                  } catch (error) {
                                    showSnackbar({
                                      message: 'Error al eliminar la dirección',
                                      type: 'error',
                                    });
                                  }
                                }}
                              />
                            </View>
                          </View>
                        </Surface>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* Espacio adicional para el teclado */}
              <View style={{ height: 10 }} />
            </ScrollView>

            <Surface style={styles.buttonContainer} elevation={2}>
              <Button
                onPress={onDismiss}
                disabled={isSubmitting}
                style={[styles.button, styles.cancelButton]}
                textColor={theme.colors.onSecondaryContainer}
              >
                Cancelar
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmit(handleFormSubmit)}
                disabled={isSubmitting}
                loading={isSubmitting}
                style={[styles.button, styles.confirmButton]}
                buttonColor={theme.colors.primary}
              >
                {editingItem ? 'Guardar' : 'Crear'}
              </Button>
            </Surface>
          </Surface>
        </Modal>
      </Portal>

      {/* Modal de Dirección */}
      {editingItem && (
        <AddressFormModal
          visible={showAddressModal}
          onDismiss={() => {
            setShowAddressModal(false);
            setEditingAddress(null);
          }}
          onSubmit={handleAddressSubmit}
          editingItem={editingAddress}
          isSubmitting={isSubmittingAddress}
          customerId={editingItem.id}
        />
      )}

      {/* Date Picker */}
      <DateTimePickerSafe
        visible={showDatePicker}
        mode="date"
        value={tempDate}
        onConfirm={(date) => {
          if (dateOnChange) {
            dateOnChange(date.toISOString().split('T')[0]);
          }
          setShowDatePicker(false);
        }}
        onCancel={() => setShowDatePicker(false)}
        title="Fecha de nacimiento"
        maximumDate={new Date()}
      />
    </>
  );
}

const getStyles = (
  theme: AppTheme,
  responsive: ReturnType<typeof useResponsive>,
) =>
  StyleSheet.create({
    modalContainer: {
      margin: responsive.isTablet ? 20 : 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      borderRadius: theme.roundness * 2,
      backgroundColor: theme.colors.surface,
      maxHeight: '95%',
      minHeight: responsive.isTablet ? 600 : '80%',
      width: responsive.isTablet ? '85%' : '100%',
      maxWidth: responsive.isTablet ? 800 : undefined,
      overflow: 'hidden',
    },
    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: responsive.isTablet
        ? theme.spacing.m * 0.7
        : theme.spacing.m,
      paddingVertical: responsive.isTablet
        ? theme.spacing.xs * 0.7
        : theme.spacing.xs,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    headerIcon: {
      marginRight: responsive.isTablet
        ? theme.spacing.s * 0.7
        : theme.spacing.s,
    },
    headerTextContainer: {
      flex: 1,
    },
    modalTitle: {
      fontWeight: '700',
      fontSize: responsive.isTablet ? 16 : 18,
    },
    formContainer: {
      flex: 1,
      paddingHorizontal: responsive.isTablet
        ? theme.spacing.m * 0.7
        : theme.spacing.m,
      paddingTop: responsive.isTablet
        ? theme.spacing.xs * 0.7
        : theme.spacing.xs,
    },
    sectionContainer: {
      marginBottom: responsive.isTablet
        ? theme.spacing.s * 0.7
        : theme.spacing.s,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: responsive.isTablet
        ? theme.spacing.xs * 0.7
        : theme.spacing.xs,
    },
    sectionTitle: {
      fontWeight: '600',
      color: theme.colors.onSurface,
      fontSize: responsive.isTablet ? 13 : 14,
    },
    requiredChip: {
      backgroundColor: theme.colors.errorContainer,
    },
    requiredChipText: {
      color: theme.colors.onErrorContainer,
      fontSize: responsive.isTablet ? 10 : 11,
    },
    optionalChip: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    optionalChipText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: responsive.isTablet ? 10 : 11,
    },
    inputContainer: {
      marginBottom: responsive.isTablet
        ? theme.spacing.xs * 0.7
        : theme.spacing.xs,
    },
    inputOutline: {
      borderRadius: theme.roundness * 2,
    },
    switchContainer: {
      borderRadius: theme.roundness * 2,
      padding: responsive.isTablet ? theme.spacing.xs * 0.7 : theme.spacing.xs,
    },
    switchContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    switchTextContainer: {
      flex: 1,
      marginRight: responsive.isTablet
        ? theme.spacing.m * 0.7
        : theme.spacing.m,
    },
    switchLabel: {
      color: theme.colors.onSurface,
      fontWeight: '500',
      fontSize: responsive.isTablet ? 14 : 16,
    },
    switchDescription: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
      fontSize: responsive.isTablet ? 12 : 14,
    },
    bannedContainer: {
      marginTop: responsive.isTablet ? theme.spacing.s * 0.7 : theme.spacing.s,
    },
    banReasonContainer: {
      marginTop: responsive.isTablet ? theme.spacing.s * 0.7 : theme.spacing.s,
    },
    infoCard: {
      borderRadius: theme.roundness * 2,
      padding: responsive.isTablet ? theme.spacing.m * 0.7 : theme.spacing.m,
      marginTop: responsive.isTablet ? theme.spacing.s * 0.7 : theme.spacing.s,
      backgroundColor: theme.colors.errorContainer,
    },
    infoCardContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    infoText: {
      flex: 1,
      marginLeft: responsive.isTablet
        ? theme.spacing.xs * 0.7
        : theme.spacing.xs,
    },
    infoLabel: {
      color: theme.colors.onErrorContainer,
      opacity: 0.8,
      fontSize: responsive.isTablet ? 11 : 12,
    },
    infoValue: {
      color: theme.colors.onErrorContainer,
      fontWeight: '500',
      fontSize: responsive.isTablet ? 13 : 14,
    },
    whatsappCard: {
      borderRadius: theme.roundness * 2,
      padding: responsive.isTablet ? theme.spacing.m * 0.7 : theme.spacing.m,
      backgroundColor: theme.colors.primaryContainer + '20',
    },
    whatsappRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    whatsappStat: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: responsive.isTablet ? theme.spacing.s * 0.7 : theme.spacing.s,
    },
    whatsappStatContent: {
      flex: 1,
    },
    whatsappLabel: {
      color: theme.colors.onSurfaceVariant,
      fontSize: responsive.isTablet ? 11 : 12,
    },
    whatsappValue: {
      color: theme.colors.onSurface,
      fontWeight: '600',
      marginTop: 2,
      fontSize: responsive.isTablet ? 13 : 14,
    },
    whatsappDivider: {
      width: 1,
      height: responsive.isTablet ? 35 : 40,
      backgroundColor: theme.colors.outlineVariant,
      marginHorizontal: responsive.isTablet
        ? theme.spacing.m * 0.7
        : theme.spacing.m,
    },
    stripeCard: {
      borderRadius: theme.roundness * 2,
      padding: responsive.isTablet ? theme.spacing.m * 0.7 : theme.spacing.m,
      backgroundColor: theme.colors.surfaceVariant,
    },
    stripeContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: responsive.isTablet ? theme.spacing.m * 0.7 : theme.spacing.m,
    },
    stripeInfo: {
      flex: 1,
    },
    stripeLabel: {
      color: theme.colors.onSurfaceVariant,
      fontSize: responsive.isTablet ? 11 : 12,
      marginBottom: responsive.isTablet ? 3 : 4,
    },
    stripeValue: {
      color: theme.colors.onSurface,
      fontWeight: '500',
      fontFamily: 'monospace',
      fontSize: responsive.isTablet ? 13 : 14,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      padding: responsive.isTablet ? theme.spacing.s * 0.7 : theme.spacing.s,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      gap: responsive.isTablet ? theme.spacing.s * 0.7 : theme.spacing.s,
      borderBottomLeftRadius: theme.roundness * 2,
      borderBottomRightRadius: theme.roundness * 2,
    },
    button: {
      flex: 1,
      maxWidth: 150,
    },
    cancelButton: {
      backgroundColor: theme.colors.secondaryContainer,
    },
    confirmButton: {},
    addressList: {
      gap: responsive.isTablet ? theme.spacing.s * 0.7 : theme.spacing.s,
    },
    addressCard: {
      borderRadius: theme.roundness * 2,
      padding: responsive.isTablet ? theme.spacing.s * 0.7 : theme.spacing.s,
      marginBottom: responsive.isTablet
        ? theme.spacing.xs * 0.65
        : theme.spacing.xs,
    },
    addressContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    addressHeader: {
      flexDirection: 'row',
      flex: 1,
    },
    addressInfo: {
      flex: 1,
      marginLeft: responsive.isTablet
        ? theme.spacing.xs * 0.7
        : theme.spacing.xs,
    },
    addressName: {
      fontWeight: '600',
      color: theme.colors.primary,
      fontSize: responsive.isTablet ? 13 : 14,
    },
    addressStreet: {
      fontWeight: '500',
      color: theme.colors.onSurface,
      fontSize: responsive.isTablet ? 13 : 14,
    },
    addressDetails: {
      color: theme.colors.onSurfaceVariant,
      marginTop: responsive.isTablet
        ? theme.spacing.xs * 0.65
        : theme.spacing.xs,
      fontSize: responsive.isTablet ? 12 : 13,
    },
    addressActions: {
      flexDirection: 'row',
    },
    defaultChip: {
      marginTop: responsive.isTablet
        ? theme.spacing.xs * 0.65
        : theme.spacing.xs,
      backgroundColor: theme.colors.primaryContainer,
    },
    defaultChipText: {
      color: theme.colors.onPrimaryContainer,
      fontSize: responsive.isTablet ? 9 : 10,
    },
    emptyAddressContainer: {
      padding: responsive.isTablet ? theme.spacing.l * 0.7 : theme.spacing.l,
      borderRadius: theme.roundness * 2,
      backgroundColor: theme.colors.surfaceVariant,
      alignItems: 'center',
    },
    emptyAddressText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: responsive.isTablet ? 13 : 14,
    },
  });
