import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
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
  Icon,
  ActivityIndicator,
} from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@/app/lib/zodResolver';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import {
  Address,
  addressSchema,
  AddressFormInputs,
} from '../schema/customer.schema';
import { WebView } from 'react-native-webview';
import { GOOGLE_MAPS_CONFIG } from '../constants/maps.config';
import { useGoogleMapsConfig } from '@/hooks/useGoogleMapsConfig';
import { useSnackbarStore } from '@/app/store/snackbarStore';

interface AddressFormModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (data: AddressFormInputs) => Promise<void>;
  editingItem: Address | null;
  isSubmitting: boolean;
  customerId?: string;
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
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);
  const { config: mapsConfig, loading: isLoadingApiKey } =
    useGoogleMapsConfig();
  const apiKey = mapsConfig?.apiKey;
  const [mapReady, setMapReady] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    trigger,
  } = useForm<AddressFormInputs>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: '',
      street: '',
      number: '',
      interiorNumber: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'México',
      deliveryInstructions: '',
      isDefault: false,
    },
  });

  const latitude = watch('latitude');
  const longitude = watch('longitude');

  useEffect(() => {
    if (editingItem) {
      reset({
        name: editingItem.name,
        street: editingItem.street,
        number: editingItem.number,
        interiorNumber: editingItem.interiorNumber || '',
        neighborhood: editingItem.neighborhood,
        city: editingItem.city,
        state: editingItem.state,
        zipCode: editingItem.zipCode,
        country: editingItem.country || 'México',
        deliveryInstructions: editingItem.deliveryInstructions || '',
        latitude: editingItem.latitude
          ? Number(editingItem.latitude)
          : undefined,
        longitude: editingItem.longitude
          ? Number(editingItem.longitude)
          : undefined,
        isDefault: editingItem.isDefault,
      });
    } else {
      reset({
        name: '',
        street: '',
        number: '',
        interiorNumber: '',
        neighborhood: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'México',
        deliveryInstructions: '',
        isDefault: false,
      });
    }
  }, [editingItem, reset]);

  const mapHtml = React.useMemo(
    () =>
      apiKey
        ? `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      height: 100%;
      width: 100%;
      overflow: hidden;
      touch-action: manipulation;
    }
    #map {
      height: 100%;
      width: 100%;
      touch-action: manipulation;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    let map;
    let marker;
    let currentLocation = null;

    function initMap() {
      const initialLocation = ${
        latitude && longitude
          ? `{ lat: ${latitude}, lng: ${longitude} }`
          : 'null'
      };
      const mapCenter = initialLocation || { lat: ${GOOGLE_MAPS_CONFIG.defaultCenter.lat}, lng: ${GOOGLE_MAPS_CONFIG.defaultCenter.lng} };
      
      map = new google.maps.Map(document.getElementById('map'), {
        center: mapCenter,
        zoom: initialLocation ? ${GOOGLE_MAPS_CONFIG.locationZoom} : ${GOOGLE_MAPS_CONFIG.defaultZoom},
        ...${JSON.stringify(GOOGLE_MAPS_CONFIG.mapOptions)},
        gestureHandling: ${isMapFullscreen ? "'greedy'" : "'cooperative'"}
      });

      if (initialLocation) {
        marker = new google.maps.Marker({
          position: initialLocation,
          map: map,
          draggable: true,
          animation: google.maps.Animation.DROP,
          title: "Ubicación de la dirección"
        });
        
        currentLocation = initialLocation;
        
        marker.addListener('dragend', function() {
          currentLocation = {
            lat: marker.getPosition().lat(),
            lng: marker.getPosition().lng()
          };
          sendMessage('locationUpdated', {
            latitude: currentLocation.lat,
            longitude: currentLocation.lng
          });
        });
      }

      map.addListener('click', function(event) {
        if (!marker) {
          marker = new google.maps.Marker({
            position: event.latLng,
            map: map,
            draggable: true,
            animation: google.maps.Animation.DROP,
            title: "Ubicación de la dirección"
          });
          
          marker.addListener('dragend', function() {
            currentLocation = {
              lat: marker.getPosition().lat(),
              lng: marker.getPosition().lng()
            };
            sendMessage('locationUpdated', {
              latitude: currentLocation.lat,
              longitude: currentLocation.lng
            });
          });
        } else {
          marker.setPosition(event.latLng);
        }
        
        currentLocation = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng()
        };
        sendMessage('locationUpdated', {
          latitude: currentLocation.lat,
          longitude: currentLocation.lng
        });
      });

      window.addEventListener('message', handleMessage);
      sendMessage('mapReady', {});
    }

    function handleMessage(event) {
      try {
        const data = JSON.parse(event.data);
        
        switch(data.type) {
          case 'setLocation':
            setLocation(data.latitude, data.longitude);
            break;
          case 'centerOnLocation':
            centerOnLocation();
            break;
        }
      } catch (e) {
      }
    }

    function setLocation(lat, lng) {
      const position = new google.maps.LatLng(lat, lng);
      
      if (!marker) {
        marker = new google.maps.Marker({
          position: position,
          map: map,
          draggable: true,
          animation: google.maps.Animation.DROP,
          title: "Ubicación de la dirección"
        });
        
        marker.addListener('dragend', function() {
          currentLocation = {
            lat: marker.getPosition().lat(),
            lng: marker.getPosition().lng()
          };
          sendMessage('locationUpdated', {
            latitude: currentLocation.lat,
            longitude: currentLocation.lng
          });
        });
      } else {
        marker.setPosition(position);
      }
      
      map.setCenter(position);
      currentLocation = { lat, lng };
    }

    function centerOnLocation() {
      if (currentLocation) {
        map.setCenter(currentLocation);
        map.setZoom(16);
      }
    }

    function sendMessage(type, data) {
      try {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: type,
            ...data
          }));
        }
      } catch (e) {
      }
    }
  </script>
  <script async defer
    src="https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap">
  </script>
</body>
</html>
  `
        : '',
    [latitude, longitude, isMapFullscreen, apiKey],
  );

  const handleWebViewMessage = React.useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);

        switch (data.type) {
          case 'mapReady':
            setMapReady(true);
            setIsMapLoading(false);
            break;
          case 'locationUpdated':
            setValue('latitude', Number(data.latitude));
            setValue('longitude', Number(data.longitude));
            break;
        }
      } catch (e) {}
    },
    [setValue],
  );

  const sendMessageToWebView = React.useCallback((type: string, data: any) => {
    if (webViewRef.current) {
      const message = JSON.stringify({ type, ...data });
      webViewRef.current.postMessage(message);
    }
  }, []);

  useEffect(() => {
    if (mapReady && latitude !== undefined && longitude !== undefined) {
      sendMessageToWebView('setLocation', {
        latitude,
        longitude,
      });
    }
  }, [latitude, longitude, mapReady]);

  useEffect(() => {
    if (visible) {
      setIsMapLoading(true);
      setMapReady(false);
    }
  }, [visible]);

  const handleFormSubmit = React.useCallback(
    async (data: AddressFormInputs) => {
      const formattedData: AddressFormInputs = {
        name: data.name,
        street: data.street,
        number: data.number,
        interiorNumber: data.interiorNumber || undefined,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country,
        deliveryInstructions: data.deliveryInstructions || undefined,
        latitude: data.latitude !== undefined ? data.latitude : undefined,
        longitude: data.longitude !== undefined ? data.longitude : undefined,
        isDefault: data.isDefault || false,
      };
      await onSubmit(formattedData);
    },
    [onSubmit],
  );

  const hasValidCoordinates = React.useMemo(() => {
    return (
      latitude !== undefined &&
      longitude !== undefined &&
      !isNaN(Number(latitude)) &&
      !isNaN(Number(longitude)) &&
      Number(latitude) !== 0 &&
      Number(longitude) !== 0
    );
  }, [latitude, longitude]);

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
                  size={28}
                  icon={editingItem ? 'map-marker-radius' : 'map-marker-plus'}
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
              ref={scrollViewRef}
              style={styles.formContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Controller
                control={control}
                name="isDefault"
                render={({ field: { onChange, value } }) => (
                  <Surface
                    style={[
                      styles.switchContainer,
                      { marginBottom: theme.spacing.m },
                    ]}
                    elevation={1}
                  >
                    <View style={styles.switchContent}>
                      <View style={styles.switchTextContainer}>
                        <Text style={styles.switchLabel} variant="bodyLarge">
                          Dirección predeterminada
                        </Text>
                        <Text
                          style={styles.switchDescription}
                          variant="bodySmall"
                        >
                          Esta será la dirección principal para los pedidos
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
                  name="name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.inputContainer}>
                      <TextInput
                        label="Nombre de la dirección"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={!!errors.name}
                        mode="outlined"
                        placeholder="Ej: Casa, Oficina, Casa de mamá"
                        left={<TextInput.Icon icon="tag" />}
                        outlineStyle={styles.inputOutline}
                      />
                      {errors.name && (
                        <HelperText type="error" visible={!!errors.name}>
                          {errors.name.message}
                        </HelperText>
                      )}
                    </View>
                  )}
                />

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
                      name="interiorNumber"
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
                        <HelperText
                          type="error"
                          visible={!!errors.neighborhood}
                        >
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

                <Controller
                  control={control}
                  name="country"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.inputContainer}>
                      <TextInput
                        label="País"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={!!errors.country}
                        mode="outlined"
                        placeholder="México"
                        left={<TextInput.Icon icon="earth" />}
                        outlineStyle={styles.inputOutline}
                      />
                      {errors.country && (
                        <HelperText type="error" visible={!!errors.country}>
                          {errors.country.message}
                        </HelperText>
                      )}
                    </View>
                  )}
                />
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
                  name="deliveryInstructions"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.inputContainer}>
                      <TextInput
                        label="Instrucciones de entrega"
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

                <View style={styles.locationWrapper}>
                  <View style={styles.locationHeader}>
                    <Text style={styles.locationLabel} variant="bodyMedium">
                      Ubicación en el mapa
                    </Text>
                    {hasValidCoordinates && (
                      <Button
                        mode="text"
                        onPress={() => {
                          setValue('latitude', undefined);
                          setValue('longitude', undefined);
                          trigger(['latitude', 'longitude']);
                        }}
                        icon="close"
                        compact
                        style={styles.clearLocationBtn}
                      >
                        Limpiar
                      </Button>
                    )}
                  </View>

                  <Surface style={styles.mapContainer} elevation={1}>
                    <View style={styles.mapInstructions}>
                      <Icon
                        source="gesture-two-double-tap"
                        size={20}
                        color={theme.colors.primary}
                      />
                      <Text
                        style={styles.mapInstructionText}
                        variant="bodySmall"
                      >
                        Usa dos dedos para mover el mapa • Toca para marcar
                        ubicación
                      </Text>
                    </View>

                    <View style={styles.mapView}>
                      {isLoadingApiKey || !mapHtml ? (
                        <View style={[styles.map, styles.mapLoadingContainer]}>
                          <ActivityIndicator
                            size="large"
                            color={theme.colors.primary}
                          />
                          <Text style={styles.mapLoadingText}>
                            Cargando mapa...
                          </Text>
                        </View>
                      ) : (
                        <WebView
                          ref={webViewRef}
                          source={{ html: mapHtml }}
                          style={styles.map}
                          onMessage={handleWebViewMessage}
                          onError={(_error) => {}}
                          javaScriptEnabled={true}
                          domStorageEnabled={true}
                          startInLoadingState={true}
                          mixedContentMode="compatibility"
                          allowsInlineMediaPlayback={true}
                          originWhitelist={['*']}
                          scalesPageToFit={false}
                          bounces={false}
                          scrollEnabled={false}
                          nestedScrollEnabled={false}
                        />
                      )}

                      {isMapLoading && (
                        <View style={styles.mapLoadingContainer}>
                          <Surface style={styles.mapLoadingCard} elevation={3}>
                            <ActivityIndicator
                              size="large"
                              color={theme.colors.primary}
                            />
                            <Text style={styles.mapLoadingText}>
                              Cargando mapa...
                            </Text>
                          </Surface>
                        </View>
                      )}

                      {mapReady && (
                        <>
                          <View style={styles.expandButtonContainer}>
                            <Button
                              mode="contained"
                              icon={
                                isMapFullscreen
                                  ? 'fullscreen-exit'
                                  : 'fullscreen'
                              }
                              onPress={() =>
                                setIsMapFullscreen(!isMapFullscreen)
                              }
                              style={styles.expandButton}
                              labelStyle={styles.expandButtonLabel}
                            >
                              {isMapFullscreen ? 'Cerrar' : 'Expandir mapa'}
                            </Button>
                          </View>

                          {hasValidCoordinates && (
                            <View style={styles.centerButtonContainer}>
                              <IconButton
                                icon="crosshairs-gps"
                                mode="contained"
                                containerColor={theme.colors.primaryContainer}
                                iconColor={theme.colors.onPrimaryContainer}
                                size={20}
                                onPress={() =>
                                  sendMessageToWebView('centerOnLocation', {})
                                }
                                style={styles.floatingButton}
                              />
                            </View>
                          )}
                        </>
                      )}
                    </View>

                    {hasValidCoordinates && (
                      <View style={styles.coordinatesContainer}>
                        <Text
                          variant="labelSmall"
                          style={styles.coordinatesLabel}
                        >
                          Coordenadas:
                        </Text>
                        <Text
                          variant="bodySmall"
                          style={styles.coordinatesText}
                        >
                          {Number(latitude).toFixed(6)},{' '}
                          {Number(longitude).toFixed(6)}
                        </Text>
                      </View>
                    )}
                  </Surface>
                </View>
              </View>

              <View style={styles.scrollSpacer} />
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
                onPress={() => {
                  handleSubmit(handleFormSubmit, (validationErrors) => {
                    const errorMessages = Object.entries(validationErrors)
                      .map(([field, error]) => {
                        if (error && 'message' in error) {
                          const fieldNames: Record<string, string> = {
                            name: 'Nombre de la dirección',
                            street: 'Calle',
                            number: 'Número',
                            neighborhood: 'Colonia',
                            city: 'Ciudad',
                            state: 'Estado',
                            zipCode: 'Código postal',
                            country: 'País',
                          };
                          const fieldName = fieldNames[field] || field;
                          return `${fieldName}: ${error.message}`;
                        }
                        return null;
                      })
                      .filter(Boolean);

                    if (errorMessages.length > 0) {
                      showSnackbar({
                        message: errorMessages[0] || 'Error de validación',
                        type: 'error',
                      });

                      scrollViewRef.current?.scrollTo({
                        x: 0,
                        y: 0,
                        animated: true,
                      });
                    }
                  })();
                }}
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

      <Portal>
        <Modal
          visible={isMapFullscreen}
          onDismiss={() => setIsMapFullscreen(false)}
          contentContainerStyle={styles.fullscreenModalContainer}
        >
          <Surface style={styles.fullscreenModalContent} elevation={5}>
            <View style={styles.fullscreenHeader}>
              <Text variant="titleLarge" style={styles.fullscreenTitle}>
                Ubicación
              </Text>
              <IconButton
                icon="close"
                size={28}
                onPress={() => setIsMapFullscreen(false)}
                style={styles.fullscreenCloseButton}
              />
            </View>

            <View style={styles.fullscreenMapContainer}>
              <WebView
                source={{ html: mapHtml }}
                style={styles.map}
                onMessage={handleWebViewMessage}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={false}
                mixedContentMode="compatibility"
                allowsInlineMediaPlayback={true}
                originWhitelist={['*']}
                scalesPageToFit={false}
              />

              {hasValidCoordinates && (
                <View style={styles.fullscreenCoordinates}>
                  <Surface style={styles.coordinatesBadge} elevation={3}>
                    <Icon
                      source="map-marker"
                      size={20}
                      color={theme.colors.primary}
                    />
                    <Text variant="bodyLarge" style={styles.coordinatesText}>
                      {Number(latitude).toFixed(6)},{' '}
                      {Number(longitude).toFixed(6)}
                    </Text>
                  </Surface>
                </View>
              )}
            </View>
          </Surface>
        </Modal>
      </Portal>
    </>
  );
}

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    modalContainer: {
      margin: 10,
      justifyContent: 'center',
    },
    modalContent: {
      borderRadius: theme.roundness * 3,
      backgroundColor: theme.colors.surface,
      maxHeight: '95%',
      minHeight: '80%',
      overflow: 'hidden',
    },
    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.xs,
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
      flex: 1,
      paddingHorizontal: theme.spacing.m,
      paddingTop: theme.spacing.xs,
    },
    sectionContainer: {
      marginBottom: theme.spacing.s,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    sectionTitle: {
      fontWeight: '600',
      color: theme.colors.onSurface,
      fontSize: 14,
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
      marginBottom: theme.spacing.xs,
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
    locationWrapper: {
      marginTop: theme.spacing.m,
    },
    locationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.s,
    },
    locationLabel: {
      fontWeight: '500',
      color: theme.colors.onSurface,
    },
    clearLocationBtn: {
      marginRight: -theme.spacing.s,
    },
    mapContainer: {
      borderRadius: theme.roundness * 2,
      overflow: 'hidden',
      backgroundColor: theme.colors.surface,
    },
    mapInstructions: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.s,
      backgroundColor: theme.colors.primaryContainer,
      gap: theme.spacing.s,
    },
    mapInstructionText: {
      flex: 1,
      color: theme.colors.onPrimaryContainer,
    },
    mapView: {
      height: 300,
      position: 'relative',
    },
    map: {
      ...StyleSheet.absoluteFillObject,
    },
    mapLoadingContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    mapLoadingCard: {
      padding: theme.spacing.xl,
      borderRadius: 16,
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
    },
    mapLoadingText: {
      marginTop: theme.spacing.m,
      fontSize: 14,
      color: theme.colors.onSurface,
      fontWeight: '500',
    },
    expandButtonContainer: {
      position: 'absolute',
      top: theme.spacing.s,
      right: theme.spacing.s,
      zIndex: 10,
    },
    expandButton: {
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    expandButtonLabel: {
      fontSize: 14,
      fontWeight: '600',
    },
    centerButtonContainer: {
      position: 'absolute',
      bottom: theme.spacing.s,
      right: theme.spacing.s,
    },
    floatingButton: {
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    coordinatesContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.s,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      gap: theme.spacing.xs,
    },
    coordinatesLabel: {
      color: theme.colors.onSurfaceVariant,
    },
    coordinatesText: {
      fontWeight: '500',
      color: theme.colors.onSurface,
      fontFamily: 'monospace',
    },
    switchContainer: {
      borderRadius: theme.roundness * 2,
      padding: theme.spacing.xs,
      marginTop: theme.spacing.xs,
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
      fontSize: 12,
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
    fullscreenModalContainer: {
      flex: 1,
      margin: 0,
    },
    fullscreenModalContent: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    fullscreenHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingLeft: theme.spacing.l,
      paddingRight: theme.spacing.s,
      paddingVertical: theme.spacing.s,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
      height: 56,
    },
    fullscreenTitle: {
      fontWeight: '600',
      color: theme.colors.onSurface,
      flex: 1,
    },
    fullscreenCloseButton: {
      margin: 0,
    },
    fullscreenMapContainer: {
      flex: 1,
      position: 'relative',
    },
    fullscreenCoordinates: {
      position: 'absolute',
      bottom: theme.spacing.m,
      left: theme.spacing.m,
    },
    coordinatesBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
      borderRadius: theme.roundness * 2,
      backgroundColor: theme.colors.surface,
      gap: theme.spacing.s,
    },
    scrollSpacer: {
      height: 10,
    },
  });
