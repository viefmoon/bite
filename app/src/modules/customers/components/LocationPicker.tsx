import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import {
  Surface,
  Text,
  Button,
  IconButton,
  ActivityIndicator,
  TextInput,
  Chip,
} from 'react-native-paper';
import MapView, { Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useAppTheme, AppTheme } from '@/app/styles/theme';

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

const MEXICO_CITY_REGION = {
  latitude: 19.4326,
  longitude: -99.1332,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export default function LocationPicker({
  visible,
  onDismiss,
  onConfirm,
  initialLocation,
  address,
}: LocationPickerProps) {
  const theme = useAppTheme();
  const styles = getStyles(theme);
  const mapRef = useRef<MapView>(null);

  const [region, setRegion] = useState<Region>(
    initialLocation
      ? {
          ...initialLocation,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }
      : MEXICO_CITY_REGION,
  );

  const [selectedLocation, setSelectedLocation] = useState(
    initialLocation || null,
  );
  const [geocodedAddress, setGeocodedAddress] = useState(address || '');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  useEffect(() => {
    if (visible) {
      checkLocationPermission();
    }
  }, [visible]);

  const checkLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setHasLocationPermission(status === 'granted');
  };

  const getCurrentLocation = async () => {
    if (!hasLocationPermission) {
      Alert.alert(
        'Permisos requeridos',
        'Se necesitan permisos de ubicación para usar esta función.',
      );
      return;
    }

    setIsLoadingLocation(true);
    try {
      const location = await Location.getCurrentPositionAsync({});
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      setRegion(newRegion);
      setSelectedLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      mapRef.current?.animateToRegion(newRegion, 500);
      
      // Geocodificar la ubicación actual
      await reverseGeocode(
        location.coords.latitude,
        location.coords.longitude,
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener la ubicación actual');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleMapPress = async (event: any) => {
    const { coordinate } = event.nativeEvent;
    setSelectedLocation(coordinate);
    await reverseGeocode(coordinate.latitude, coordinate.longitude);
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    setIsGeocoding(true);
    try {
      const [result] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      
      if (result) {
        const addressParts = [];
        
        if (result.streetNumber) addressParts.push(result.streetNumber);
        if (result.street) addressParts.push(result.street);
        if (result.district) addressParts.push(result.district);
        if (result.city) addressParts.push(result.city);
        if (result.region) addressParts.push(result.region);
        if (result.postalCode) addressParts.push(result.postalCode);
        if (result.country) addressParts.push(result.country);
        
        const formattedAddress = addressParts.filter(Boolean).join(', ');
        setGeocodedAddress(formattedAddress);
      }
    } catch (error) {
      console.error('Error en geocodificación:', error);
      setGeocodedAddress('');
    } finally {
      setIsGeocoding(false);
    }
  };

  const searchByAddress = async () => {
    if (!geocodedAddress.trim()) return;

    setIsGeocoding(true);
    try {
      const results = await Location.geocodeAsync(geocodedAddress);
      if (results.length > 0) {
        const { latitude, longitude } = results[0];
        const newRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
        setRegion(newRegion);
        setSelectedLocation({ latitude, longitude });
        mapRef.current?.animateToRegion(newRegion, 500);
      } else {
        Alert.alert('No encontrado', 'No se pudo encontrar la dirección');
      }
    } catch (error) {
      Alert.alert('Error', 'Error al buscar la dirección');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onConfirm({
        ...selectedLocation,
        geocodedAddress: geocodedAddress || undefined,
      });
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onDismiss}
      presentationStyle="fullScreen"
    >
      <View style={styles.container}>
        <Surface style={styles.header} elevation={2}>
          <View style={styles.headerContent}>
            <IconButton
              icon="close"
              size={24}
              onPress={onDismiss}
            />
            <Text variant="titleLarge" style={styles.title}>
              Seleccionar ubicación
            </Text>
            <View style={{ width: 48 }} />
          </View>
        </Surface>

        <View style={styles.searchContainer}>
          <TextInput
            mode="outlined"
            placeholder="Buscar dirección..."
            value={geocodedAddress}
            onChangeText={setGeocodedAddress}
            onSubmitEditing={searchByAddress}
            right={
              <TextInput.Icon
                icon={isGeocoding ? 'loading' : 'magnify'}
                onPress={searchByAddress}
                disabled={isGeocoding}
              />
            }
            style={styles.searchInput}
          />
        </View>

        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            region={region}
            onRegionChangeComplete={setRegion}
            onPress={handleMapPress}
            showsUserLocation={hasLocationPermission}
            showsMyLocationButton={false}
          >
            {selectedLocation && (
              <Marker
                coordinate={selectedLocation}
                title="Ubicación seleccionada"
                description={geocodedAddress}
              />
            )}
          </MapView>

          <TouchableOpacity
            style={styles.currentLocationButton}
            onPress={getCurrentLocation}
            disabled={isLoadingLocation}
          >
            <Surface style={styles.floatingButton} elevation={2}>
              {isLoadingLocation ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <IconButton
                  icon="crosshairs-gps"
                  size={24}
                  iconColor={theme.colors.primary}
                />
              )}
            </Surface>
          </TouchableOpacity>
        </View>

        {selectedLocation && (
          <Surface style={styles.infoContainer} elevation={1}>
            <View style={styles.coordinatesContainer}>
              <Chip icon="map-marker" compact mode="flat">
                Lat: {selectedLocation.latitude.toFixed(6)}
              </Chip>
              <Chip icon="map-marker" compact mode="flat">
                Lng: {selectedLocation.longitude.toFixed(6)}
              </Chip>
            </View>
            {geocodedAddress && (
              <Text
                variant="bodyMedium"
                numberOfLines={2}
                style={styles.addressText}
              >
                {geocodedAddress}
              </Text>
            )}
          </Surface>
        )}

        <View style={styles.actions}>
          <Button
            mode="text"
            onPress={onDismiss}
            style={styles.button}
          >
            Cancelar
          </Button>
          <Button
            mode="contained"
            onPress={handleConfirm}
            disabled={!selectedLocation}
            style={styles.button}
          >
            Confirmar ubicación
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      backgroundColor: theme.colors.surface,
      paddingTop: Platform.OS === 'ios' ? 44 : 0,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 56,
    },
    title: {
      fontWeight: '600',
    },
    searchContainer: {
      padding: theme.spacing.m,
      backgroundColor: theme.colors.surface,
    },
    searchInput: {
      backgroundColor: theme.colors.background,
    },
    mapContainer: {
      flex: 1,
      position: 'relative',
    },
    map: {
      flex: 1,
    },
    currentLocationButton: {
      position: 'absolute',
      bottom: theme.spacing.l,
      right: theme.spacing.l,
    },
    floatingButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
    },
    infoContainer: {
      padding: theme.spacing.m,
      backgroundColor: theme.colors.surface,
    },
    coordinatesContainer: {
      flexDirection: 'row',
      gap: theme.spacing.s,
      marginBottom: theme.spacing.s,
    },
    addressText: {
      color: theme.colors.onSurfaceVariant,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      padding: theme.spacing.m,
      gap: theme.spacing.s,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
    },
    button: {
      minWidth: 120,
    },
  });