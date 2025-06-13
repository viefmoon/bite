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
  Divider,
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
          <Surface style={styles.modalContent} elevation={4}>
            <Text style={styles.modalTitle} variant="titleLarge">
              {editingItem ? 'Editar Dirección' : 'Nueva Dirección'}
            </Text>

            <ScrollView style={styles.formContainer}>
              <Controller
                control={control}
                name="street"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <TextInput
                      label="Calle *"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={!!errors.street}
                      mode="outlined"
                      placeholder="Ej: Av. Insurgentes"
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
                          label="Número *"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          error={!!errors.number}
                          mode="outlined"
                          placeholder="123"
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
                      label="Colonia *"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={!!errors.neighborhood}
                      mode="outlined"
                      placeholder="Ej: Roma Norte"
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
                      label="Ciudad *"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={!!errors.city}
                      mode="outlined"
                      placeholder="Ej: Ciudad de México"
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
                          label="Estado *"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          error={!!errors.state}
                          mode="outlined"
                          placeholder="Ej: CDMX"
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
                          label="C.P. *"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          error={!!errors.zipCode}
                          mode="outlined"
                          placeholder="06700"
                          keyboardType="numeric"
                          maxLength={5}
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
                    />
                  </View>
                )}
              />

              <Divider style={styles.divider} />

              {/* Sección de Ubicación */}
              <View style={styles.locationSection}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Ubicación en el mapa
                </Text>
                
                {latitude && longitude ? (
                  <View style={styles.locationInfo}>
                    <Chip icon="map-marker" compact mode="flat">
                      {latitude.toFixed(6)}, {longitude.toFixed(6)}
                    </Chip>
                    {geocodedAddress && (
                      <Text variant="bodySmall" style={styles.geocodedText}>
                        {geocodedAddress}
                      </Text>
                    )}
                  </View>
                ) : (
                  <Text variant="bodyMedium" style={styles.noLocationText}>
                    No se ha seleccionado ubicación
                  </Text>
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
                  <View style={styles.switchContainer}>
                    <Text style={styles.switchLabel}>
                      Dirección predeterminada
                    </Text>
                    <Switch
                      value={value}
                      onValueChange={onChange}
                      color={theme.colors.primary}
                    />
                  </View>
                )}
              />
            </ScrollView>

            <View style={styles.buttonContainer}>
              <Button
                mode="text"
                onPress={onDismiss}
                disabled={isSubmitting}
                style={styles.button}
              >
                Cancelar
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmit(handleFormSubmit)}
                disabled={isSubmitting}
                loading={isSubmitting}
                style={styles.button}
              >
                {editingItem ? 'Guardar' : 'Crear'}
              </Button>
            </View>
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
      margin: theme.spacing.l,
    },
    modalContent: {
      padding: theme.spacing.l,
      borderRadius: theme.roundness * 2,
      maxHeight: '90%',
    },
    modalTitle: {
      marginBottom: theme.spacing.l,
      textAlign: 'center',
      fontWeight: '700',
    },
    formContainer: {
      marginBottom: theme.spacing.m,
    },
    inputContainer: {
      marginBottom: theme.spacing.m,
    },
    row: {
      flexDirection: 'row',
      gap: theme.spacing.m,
    },
    halfInput: {
      flex: 1,
    },
    divider: {
      marginVertical: theme.spacing.l,
    },
    locationSection: {
      marginBottom: theme.spacing.l,
    },
    sectionTitle: {
      marginBottom: theme.spacing.m,
      fontWeight: '600',
    },
    locationInfo: {
      marginBottom: theme.spacing.m,
    },
    geocodedText: {
      marginTop: theme.spacing.s,
      color: theme.colors.onSurfaceVariant,
    },
    noLocationText: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: theme.spacing.m,
    },
    locationButton: {
      marginTop: theme.spacing.s,
    },
    switchContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.m,
      paddingHorizontal: theme.spacing.s,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.roundness,
      marginBottom: theme.spacing.m,
    },
    switchLabel: {
      ...theme.fonts.bodyLarge,
      color: theme.colors.onSurfaceVariant,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: theme.spacing.m,
    },
    button: {
      marginLeft: theme.spacing.s,
    },
  });