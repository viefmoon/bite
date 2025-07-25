import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Button, TextInput, Chip, HelperText } from 'react-native-paper';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import { ResponsiveModal } from '@/app/components/responsive/ResponsiveModal';

interface LocationPickerProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: (location: {
    latitude: number;
    longitude: number;
    geocodedAddress?: string;
  }) => void;
  initialLocation?: {
    latitude: number;
    longitude: number;
  };
  address?: string;
}

export default function LocationPicker({
  visible,
  onDismiss,
  onConfirm,
  initialLocation,
  address,
}: LocationPickerProps) {
  const theme = useAppTheme();
  const styles = getStyles(theme);

  const [latitude, setLatitude] = useState(
    initialLocation?.latitude?.toString() || '',
  );
  const [longitude, setLongitude] = useState(
    initialLocation?.longitude?.toString() || '',
  );
  const [geocodedAddress, setGeocodedAddress] = useState(address || '');
  const [latitudeError, setLatitudeError] = useState('');
  const [longitudeError, setLongitudeError] = useState('');

  const validateCoordinates = () => {
    let isValid = true;
    setLatitudeError('');
    setLongitudeError('');

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (!latitude || isNaN(lat)) {
      setLatitudeError('Latitud inválida');
      isValid = false;
    } else if (lat < -90 || lat > 90) {
      setLatitudeError('La latitud debe estar entre -90 y 90');
      isValid = false;
    }

    if (!longitude || isNaN(lng)) {
      setLongitudeError('Longitud inválida');
      isValid = false;
    } else if (lng < -180 || lng > 180) {
      setLongitudeError('La longitud debe estar entre -180 y 180');
      isValid = false;
    }

    return isValid;
  };

  const handleConfirm = () => {
    if (validateCoordinates()) {
      onConfirm({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        geocodedAddress: geocodedAddress || undefined,
      });
    }
  };

  const handleUseCurrentLocation = () => {
    Alert.alert(
      'Función no disponible',
      'La función de mapas está temporalmente deshabilitada. Por favor, ingrese las coordenadas manualmente.',
      [{ text: 'OK' }],
    );
  };

  const footerActions = (
    <View style={styles.actions}>
      <Button mode="text" onPress={onDismiss} style={styles.button}>
        Cancelar
      </Button>
      <Button
        mode="contained"
        onPress={handleConfirm}
        disabled={!latitude || !longitude}
        style={styles.button}
      >
        Confirmar
      </Button>
    </View>
  );

  return (
    <ResponsiveModal
      visible={visible}
      onDismiss={onDismiss}
      title="Ubicación"
      maxWidthTablet={400}
      scrollable={false}
      footer={footerActions}
    >
      <View style={styles.content}>
        <Text variant="bodyMedium" style={styles.helperText}>
          Ingrese las coordenadas de la ubicación o use el botón para obtener su
          ubicación actual.
        </Text>

        <View style={styles.coordinatesRow}>
          <View style={styles.coordinateInput}>
            <TextInput
              mode="outlined"
              label="Latitud"
              value={latitude}
              onChangeText={setLatitude}
              keyboardType="numeric"
              placeholder="19.4326"
              error={!!latitudeError}
            />
            {latitudeError ? (
              <HelperText type="error" visible={!!latitudeError}>
                {latitudeError}
              </HelperText>
            ) : null}
          </View>

          <View style={styles.coordinateInput}>
            <TextInput
              mode="outlined"
              label="Longitud"
              value={longitude}
              onChangeText={setLongitude}
              keyboardType="numeric"
              placeholder="-99.1332"
              error={!!longitudeError}
            />
            {longitudeError ? (
              <HelperText type="error" visible={!!longitudeError}>
                {longitudeError}
              </HelperText>
            ) : null}
          </View>
        </View>

        <Button
          mode="outlined"
          onPress={handleUseCurrentLocation}
          icon="crosshairs-gps"
          style={styles.locationButton}
        >
          Usar mi ubicación actual
        </Button>

        <TextInput
          mode="outlined"
          label="Dirección (opcional)"
          value={geocodedAddress}
          onChangeText={setGeocodedAddress}
          multiline
          numberOfLines={2}
          placeholder="Calle, número, colonia, ciudad..."
          style={styles.addressInput}
        />

        {latitude && longitude && !latitudeError && !longitudeError && (
          <View style={styles.previewContainer}>
            <Text variant="labelMedium" style={styles.previewLabel}>
              Vista previa de coordenadas:
            </Text>
            <View style={styles.chipsContainer}>
              <Chip icon="map-marker" compact mode="flat">
                {parseFloat(latitude).toFixed(6)},{' '}
                {parseFloat(longitude).toFixed(6)}
              </Chip>
            </View>
          </View>
        )}
      </View>
    </ResponsiveModal>
  );
}

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    content: {
      // ResponsiveModal maneja el padding
    },
    helperText: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: theme.spacing.m,
    },
    coordinatesRow: {
      flexDirection: 'row',
      gap: theme.spacing.m,
      marginBottom: theme.spacing.m,
    },
    coordinateInput: {
      flex: 1,
    },
    locationButton: {
      marginBottom: theme.spacing.m,
    },
    addressInput: {
      marginBottom: theme.spacing.m,
    },
    previewContainer: {
      marginTop: theme.spacing.s,
    },
    previewLabel: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: theme.spacing.s,
    },
    chipsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.s,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: theme.spacing.s,
      // ResponsiveModal maneja padding, border
    },
    button: {
      minWidth: 100,
    },
  });
