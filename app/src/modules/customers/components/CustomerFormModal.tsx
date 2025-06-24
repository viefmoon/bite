import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Portal, Modal,
  Text,
  TextInput,
  Button,
  Switch,
  HelperText,
  Surface,
  IconButton,
  Chip,
  Avatar,
  Icon, } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import { Customer, Address } from '../types/customer.types';
import {
  CustomerFormInputs,
  customerFormSchema,
} from '../schema/customer.schema';
import { DatePickerModal } from 'react-native-paper-dates';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import AnimatedLabelSelector from '@/app/components/common/AnimatedLabelSelector';
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
  const styles = getStyles(theme);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | undefined>(undefined);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isSubmittingAddress, setIsSubmittingAddress] = useState(false);
  const [countryCode, setCountryCode] = useState('+52');
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
      // Extraer código de país del número si existe
      let phoneWithoutCode = editingItem.whatsappPhoneNumber || '';
      let extractedCode = '+52'; // Por defecto México

      if (phoneWithoutCode.startsWith('+')) {
        // Buscar el código de país (asumiendo que es de 2-4 dígitos después del +)
        const match = phoneWithoutCode.match(/^(\+\d{1,3})/);
        if (match) {
          extractedCode = match[1];
          phoneWithoutCode = phoneWithoutCode.substring(extractedCode.length);
        }
      }

      setCountryCode(extractedCode);

      reset({
        firstName: editingItem.firstName,
        lastName: editingItem.lastName,
        whatsappPhoneNumber: phoneWithoutCode,
        email: editingItem.email || '',
        birthDate: editingItem.birthDate
          ? new Date(editingItem.birthDate).toISOString().split('T')[0]
          : '',
        isActive: editingItem.isActive,
        isBanned: editingItem.isBanned || false,
        banReason: editingItem.banReason || '',
      });
    } else {
      setCountryCode('+52');
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

  const formatPhoneNumber = (text: string) => {
    // Eliminar todos los caracteres no numéricos
    const cleaned = text.replace(/\D/g, '');

    // Formatear según la longitud
    if (cleaned.length <= 2) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
    } else if (cleaned.length <= 10) {
      return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 6)} ${cleaned.slice(6)}`;
    } else {
      return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 6)} ${cleaned.slice(6, 10)}`;
    }
  };

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
    // Formatear el número de teléfono con el código de país si existe
    const formattedData = {
      ...data,
      whatsappPhoneNumber: data.whatsappPhoneNumber
        ? `${countryCode}${data.whatsappPhoneNumber}`
        : undefined,
    };

    await onSubmit(formattedData);
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
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.inputContainer}>
                      <View style={styles.phoneContainer}>
                        <TextInput
                          label="Código"
                          value={countryCode}
                          onChangeText={setCountryCode}
                          mode="outlined"
                          style={styles.countryCodeInput}
                          placeholder="+52"
                          keyboardType="phone-pad"
                          maxLength={4}
                          outlineStyle={styles.inputOutline}
                        />
                        <TextInput
                          label="WhatsApp"
                          value={formatPhoneNumber(value || '')}
                          onChangeText={(text) => {
                            const cleaned = text.replace(/\D/g, '');
                            onChange(cleaned);
                          }}
                          onBlur={onBlur}
                          error={!!errors.whatsappPhoneNumber}
                          mode="outlined"
                          placeholder="55 1234 5678"
                          keyboardType="phone-pad"
                          maxLength={13}
                          style={styles.phoneNumberInput}
                          left={<TextInput.Icon icon="phone" />}
                          outlineStyle={styles.inputOutline}
                        />
                      </View>
                      {errors.whatsappPhoneNumber && (
                        <HelperText type="error" visible={!!errors.whatsappPhoneNumber}>
                          {errors.whatsappPhoneNumber.message}
                        </HelperText>
                      )}
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
                          setTempDate(value ? new Date(value) : undefined);
                          setShowDatePicker(true);
                        }}
                        error={!!errors.birthDate}
                      />
                      {errors.birthDate && (
                        <HelperText type="error" visible={!!errors.birthDate}>
                          {errors.birthDate.message}
                        </HelperText>
                      )}
                      <DatePickerModal
                        visible={showDatePicker}
                        mode="single"
                        onDismiss={() => setShowDatePicker(false)}
                        date={tempDate}
                        onConfirm={(params) => {
                          if (params.date) {
                            onChange(params.date.toISOString().split('T')[0]);
                            setTempDate(params.date);
                          }
                          setShowDatePicker(false);
                        }}
                        validRange={{
                          endDate: new Date(),
                        }}
                        locale="es"
                        saveLabel="Confirmar"
                        label="Seleccionar fecha"
                      />
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
                        <Text
                          variant="bodySmall"
                          style={styles.stripeLabel}
                        >
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
                                  {address.complement &&
                                    `, ${address.complement}`}
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
              <View style={{ height: 20 }} />
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
    </>
  );
}

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    modalContainer: {
      margin: 20,
    },
    modalContent: {
      borderRadius: theme.roundness * 3,
      backgroundColor: theme.colors.surface,
      maxHeight: '90%',
    },
    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
      borderTopLeftRadius: theme.roundness * 3,
      borderTopRightRadius: theme.roundness * 3,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    headerIcon: {
      marginRight: theme.spacing.s,
    },
    headerTextContainer: {
      flex: 1,
    },
    modalTitle: {
      fontWeight: '700',
    },
    formContainer: {
      maxHeight: 400,
      paddingHorizontal: theme.spacing.m,
      paddingTop: theme.spacing.s,
    },
    sectionContainer: {
      marginBottom: theme.spacing.m,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.s,
    },
    sectionTitle: {
      fontWeight: '600',
      color: theme.colors.onSurface,
      fontSize: 15,
    },
    requiredChip: {
      backgroundColor: theme.colors.errorContainer,
    },
    requiredChipText: {
      color: theme.colors.onErrorContainer,
      fontSize: 11,
    },
    optionalChip: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    optionalChipText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 11,
    },
    inputContainer: {
      marginBottom: theme.spacing.s,
    },
    inputOutline: {
      borderRadius: theme.roundness * 2,
    },
    phoneContainer: {
      flexDirection: 'row',
      gap: theme.spacing.s,
    },
    countryCodeInput: {
      width: 80,
    },
    phoneNumberInput: {
      flex: 1,
    },
    switchContainer: {
      borderRadius: theme.roundness * 2,
      padding: theme.spacing.s,
    },
    switchContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    switchTextContainer: {
      flex: 1,
      marginRight: theme.spacing.m,
    },
    switchLabel: {
      color: theme.colors.onSurface,
      fontWeight: '500',
    },
    switchDescription: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    bannedContainer: {
      marginTop: theme.spacing.s,
    },
    banReasonContainer: {
      marginTop: theme.spacing.s,
    },
    infoCard: {
      borderRadius: theme.roundness * 2,
      padding: theme.spacing.m,
      marginTop: theme.spacing.s,
      backgroundColor: theme.colors.errorContainer,
    },
    infoCardContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    infoText: {
      flex: 1,
      marginLeft: theme.spacing.xs,
    },
    infoLabel: {
      color: theme.colors.onErrorContainer,
      opacity: 0.8,
    },
    infoValue: {
      color: theme.colors.onErrorContainer,
      fontWeight: '500',
    },
    whatsappCard: {
      borderRadius: theme.roundness * 2,
      padding: theme.spacing.m,
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
      gap: theme.spacing.s,
    },
    whatsappStatContent: {
      flex: 1,
    },
    whatsappLabel: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
    },
    whatsappValue: {
      color: theme.colors.onSurface,
      fontWeight: '600',
      marginTop: 2,
    },
    whatsappDivider: {
      width: 1,
      height: 40,
      backgroundColor: theme.colors.outlineVariant,
      marginHorizontal: theme.spacing.m,
    },
    stripeCard: {
      borderRadius: theme.roundness * 2,
      padding: theme.spacing.m,
      backgroundColor: theme.colors.surfaceVariant,
    },
    stripeContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.m,
    },
    stripeInfo: {
      flex: 1,
    },
    stripeLabel: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
      marginBottom: 4,
    },
    stripeValue: {
      color: theme.colors.onSurface,
      fontWeight: '500',
      fontFamily: 'monospace',
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      padding: theme.spacing.s,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      gap: theme.spacing.s,
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
      gap: theme.spacing.s,
    },
    addressCard: {
      borderRadius: theme.roundness * 2,
      padding: theme.spacing.m,
      marginBottom: theme.spacing.s,
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
      marginLeft: theme.spacing.xs,
    },
    addressName: {
      fontWeight: '600',
      color: theme.colors.primary,
    },
    addressStreet: {
      fontWeight: '500',
      color: theme.colors.onSurface,
    },
    addressDetails: {
      color: theme.colors.onSurfaceVariant,
      marginTop: theme.spacing.xs,
    },
    addressActions: {
      flexDirection: 'row',
    },
    defaultChip: {
      marginTop: theme.spacing.xs,
      backgroundColor: theme.colors.primaryContainer,
    },
    defaultChipText: {
      color: theme.colors.onPrimaryContainer,
      fontSize: 10,
    },
    emptyAddressContainer: {
      padding: theme.spacing.l,
      borderRadius: theme.roundness * 2,
      backgroundColor: theme.colors.surfaceVariant,
      alignItems: 'center',
    },
    emptyAddressText: {
      color: theme.colors.onSurfaceVariant,
    },
  });
