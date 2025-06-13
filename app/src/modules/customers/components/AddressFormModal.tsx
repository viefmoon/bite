import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Modal,
  Portal,
  Text,
  TextInput,
  Button,
  Switch,
  HelperText,
  Surface,
  Chip,
  Avatar,
  IconButton,
} from 'react-native-paper';
import {
  useForm,
  Controller,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import { Address, CreateAddressDto } from '../types/customer.types';
import { addressSchema, AddressFormInputs } from '../schema/customer.schema';
import LocationPicker from './LocationPicker';

interface AddressFormModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (data: CreateAddressDto) => Promise<void>;
  editingItem: Address | null;
  isSubmitting: boolean;
  customerId: string;
}

export default function AddressFormModal({
  visible,
  onDismiss,
  onSubmit,
  editingItem,
  isSubmitting,
  customerId,
}: AddressFormModalProps) {
  const theme = useAppTheme();
  const styles = getStyles(theme);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<AddressFormInputs>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
      reference: '',
      isDefault: false,
    },
  });

  const latitude = watch('latitude');
  const longitude = watch('longitude');
  const geocodedAddress = watch('geocodedAddress');

  useEffect(() => {
    if (editingItem) {
      reset({
        street: editingItem.street,
        number: editingItem.number,
        complement: editingItem.complement || '',
        neighborhood: editingItem.neighborhood,
        city: editingItem.city,
        state: editingItem.state,
        zipCode: editingItem.zipCode,
        reference: editingItem.reference || '',
        latitude: editingItem.latitude,
        longitude: editingItem.longitude,
        geocodedAddress: editingItem.geocodedAddress || '',
        isDefault: editingItem.isDefault,
      });
    } else {
      reset({
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        zipCode: '',
        reference: '',
        isDefault: false,
      });
    }
  }, [editingItem, reset]);

  const handleLocationConfirm = (location: {
    latitude: number;
    longitude: number;
    geocodedAddress?: string;
  }) => {
    setValue('latitude', location.latitude);
    setValue('longitude', location.longitude);
    if (location.geocodedAddress) {
      setValue('geocodedAddress', location.geocodedAddress);
    }
    setShowLocationPicker(false);
  };

  const handleFormSubmit = async (data: AddressFormInputs) => {
    await onSubmit(data);
  };

  const buildDisplayAddress = () => {
    const parts = [];
    const streetValue = watch('street');
    const numberValue = watch('number');
    const neighborhoodValue = watch('neighborhood');
    const cityValue = watch('city');
    const stateValue = watch('state');
    
    if (streetValue && numberValue) {
      parts.push(`${streetValue} ${numberValue}`);
    }
    if (neighborhoodValue) parts.push(neighborhoodValue);
    if (cityValue && stateValue) {
      parts.push(`${cityValue}, ${stateValue}`);
    }
    
    return parts.join(', ');
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
            <View style={[styles.headerContainer, { backgroundColor: theme.colors.primary }]}>
              <View style={styles.headerLeft}>
                <Avatar.Icon 
                  size={32} 
                  icon={editingItem ? 'map-marker-radius' : 'map-marker-plus'}
                  style={[styles.headerIcon, { backgroundColor: theme.colors.onPrimary + '20' }]}
                  color={theme.colors.onPrimary}
                />
                <View style={styles.headerTextContainer}>
                  <Text style={[styles.modalTitle, { color: theme.colors.onPrimary }]} variant="titleMedium">
                    {editingItem ? 'Editar Dirección' : 'Nueva Dirección'}
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
                    Información de la Dirección
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
                  name="street"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.inputContainer}>
                      <TextInput
                        label="Calle"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={!!errors.street}
                        mode="outlined"
                        placeholder="Ej: Av. Insurgentes"
                        left={<TextInput.Icon icon="road" />}
                        outlineStyle={styles.inputOutline}
                      />
                      {errors.street && (
                        <HelperText type="error" visible={!!errors.street}>
                          {errors.street.message}
                        </HelperText>
                      )}
                    </View>
                  )}
                />

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Controller
                    control={control}
                    name="number"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View style={styles.inputContainer}>
                        <TextInput
                          label="Número"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          error={!!errors.number}
                          mode="outlined"
                          placeholder="123"
                          left={<TextInput.Icon icon="numeric" />}
                          outlineStyle={styles.inputOutline}
                        />
                        {errors.number && (
                          <HelperText type="error" visible={!!errors.number}>
                            {errors.number.message}
                          </HelperText>
                        )}
                      </View>
                    )}
                  />
                </View>

                <View style={styles.halfInput}>
                  <Controller
                    control={control}
                    name="complement"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View style={styles.inputContainer}>
                        <TextInput
                          label="Interior"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          mode="outlined"
                          placeholder="Depto 4B"
                          left={<TextInput.Icon icon="home-variant" />}
                          outlineStyle={styles.inputOutline}
                        />
                      </View>
                    )}
                  />
                </View>
              </View>

                <Controller
                  control={control}
                  name="neighborhood"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.inputContainer}>
                      <TextInput
                        label="Colonia"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={!!errors.neighborhood}
                        mode="outlined"
                        placeholder="Ej: Roma Norte"
                        left={<TextInput.Icon icon="map" />}
                        outlineStyle={styles.inputOutline}
                      />
                      {errors.neighborhood && (
                        <HelperText type="error" visible={!!errors.neighborhood}>
                          {errors.neighborhood.message}
                        </HelperText>
                      )}
                    </View>
                  )}
                />

                <Controller
                  control={control}
                  name="city"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.inputContainer}>
                      <TextInput
                        label="Ciudad"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={!!errors.city}
                        mode="outlined"
                        placeholder="Ej: Ciudad de México"
                        left={<TextInput.Icon icon="city" />}
                        outlineStyle={styles.inputOutline}
                      />
                      {errors.city && (
                        <HelperText type="error" visible={!!errors.city}>
                          {errors.city.message}
                        </HelperText>
                      )}
                    </View>
                  )}
                />

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Controller
                    control={control}
                    name="state"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View style={styles.inputContainer}>
                        <TextInput
                          label="Estado"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          error={!!errors.state}
                          mode="outlined"
                          placeholder="Ej: CDMX"
                          left={<TextInput.Icon icon="map-marker" />}
                          outlineStyle={styles.inputOutline}
                        />
                        {errors.state && (
                          <HelperText type="error" visible={!!errors.state}>
                            {errors.state.message}
                          </HelperText>
                        )}
                      </View>
                    )}
                  />
                </View>

                <View style={styles.halfInput}>
                  <Controller
                    control={control}
                    name="zipCode"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View style={styles.inputContainer}>
                        <TextInput
                          label="C.P."
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          error={!!errors.zipCode}
                          mode="outlined"
                          placeholder="06700"
                          keyboardType="numeric"
                          maxLength={5}
                          left={<TextInput.Icon icon="mailbox" />}
                          outlineStyle={styles.inputOutline}
                        />
                        {errors.zipCode && (
                          <HelperText type="error" visible={!!errors.zipCode}>
                            {errors.zipCode.message}
                          </HelperText>
                        )}
                      </View>
                    )}
                  />
                </View>
              </View>

              </View>

              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle} variant="titleMedium">
                    Información Adicional
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
                  name="reference"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.inputContainer}>
                      <TextInput
                        label="Referencias"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        mode="outlined"
                        placeholder="Entre calles, color de fachada, etc."
                        multiline
                        numberOfLines={2}
                        left={<TextInput.Icon icon="sign-direction" />}
                        outlineStyle={styles.inputOutline}
                      />
                    </View>
                  )}
                />

                {/* Sección de Ubicación */}
                <View style={styles.locationSection}>
                  {latitude && longitude ? (
                    <Surface style={styles.locationCard} elevation={1}>
                      <View style={styles.locationCardContent}>
                        <IconButton
                          icon="map-marker"
                          size={20}
                          iconColor={theme.colors.primary}
                        />
                        <View style={styles.locationInfo}>
                          <Text variant="bodyMedium" style={styles.coordinatesText}>
                            {latitude.toFixed(6)}, {longitude.toFixed(6)}
                          </Text>
                          {geocodedAddress && (
                            <Text variant="bodySmall" style={styles.geocodedText}>
                              {geocodedAddress}
                            </Text>
                          )}
                        </View>
                      </View>
                    </Surface>
                  ) : (
                    <Surface style={styles.emptyLocationCard} elevation={0}>
                      <Text variant="bodyMedium" style={styles.noLocationText}>
                        No se ha seleccionado ubicación
                      </Text>
                    </Surface>
                  )}

                  <Button
                    mode="outlined"
                    onPress={() => setShowLocationPicker(true)}
                    icon="map-marker-plus"
                    style={styles.locationButton}
                  >
                    {latitude && longitude ? 'Cambiar ubicación' : 'Seleccionar ubicación'}
                  </Button>
                </View>

                <Controller
                  control={control}
                  name="isDefault"
                  render={({ field: { onChange, value } }) => (
                    <Surface style={styles.switchContainer} elevation={1}>
                      <View style={styles.switchContent}>
                        <View style={styles.switchTextContainer}>
                          <Text style={styles.switchLabel} variant="bodyLarge">
                            Dirección predeterminada
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
              </View>

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

      <LocationPicker
        visible={showLocationPicker}
        onDismiss={() => setShowLocationPicker(false)}
        onConfirm={handleLocationConfirm}
        initialLocation={
          latitude && longitude
            ? { latitude, longitude }
            : undefined
        }
        address={buildDisplayAddress()}
      />
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
    row: {
      flexDirection: 'row',
      gap: theme.spacing.s,
    },
    halfInput: {
      flex: 1,
    },
    locationSection: {
      marginTop: theme.spacing.s,
    },
    locationCard: {
      borderRadius: theme.roundness * 2,
      padding: theme.spacing.m,
      marginBottom: theme.spacing.s,
    },
    locationCardContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    locationInfo: {
      flex: 1,
      marginLeft: theme.spacing.xs,
    },
    coordinatesText: {
      fontWeight: '500',
      color: theme.colors.onSurface,
    },
    geocodedText: {
      color: theme.colors.onSurfaceVariant,
      marginTop: theme.spacing.xs,
    },
    emptyLocationCard: {
      padding: theme.spacing.l,
      borderRadius: theme.roundness * 2,
      backgroundColor: theme.colors.surfaceVariant,
      alignItems: 'center',
      marginBottom: theme.spacing.s,
    },
    noLocationText: {
      color: theme.colors.onSurfaceVariant,
    },
    locationButton: {
      marginTop: theme.spacing.xs,
    },
    switchContainer: {
      borderRadius: theme.roundness * 2,
      padding: theme.spacing.s,
      marginTop: theme.spacing.s,
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
  });