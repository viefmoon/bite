import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Alert, useWindowDimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import {
  Surface,
  IconButton,
  ActivityIndicator,
  Text,
} from 'react-native-paper';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import { DeliveryCoveragePoint } from '../types/restaurantConfig.types';
import { useGoogleMapsConfig } from '@/hooks/useGoogleMapsConfig';

interface DeliveryCoverageMapProps {
  initialPolygon?: DeliveryCoveragePoint[] | null;
  isEditing: boolean;
  onChange?: (polygon: DeliveryCoveragePoint[]) => void;
  restaurantLocation?: {
    latitude: number;
    longitude: number;
  };
}

export const WebViewDeliveryCoverageMap: React.FC<DeliveryCoverageMapProps> = ({
  initialPolygon,
  isEditing,
  onChange,
  restaurantLocation,
}) => {
  const theme = useAppTheme();
  const { width, height } = useWindowDimensions();
  const webViewRef = useRef<WebView>(null);
  const { config: mapsConfig, loading: isLoadingApiKey } =
    useGoogleMapsConfig();
  const apiKey = mapsConfig?.apiKey;

  const styles = React.useMemo(
    () => createStyles(theme, width, height),
    [theme, width, height],
  );

  const [mapReady, setMapReady] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPolygon, setCurrentPolygon] = useState<DeliveryCoveragePoint[]>(
    () => {
      return initialPolygon || [];
    },
  );

  // HTML del mapa con Google Maps API
  const mapHtml = apiKey
    ? `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
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
    }
    #map {
      height: 100%;
      width: 100%;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    let map;
    let polygon;
    let markers = [];
    let isEditing = false;
    let polygonPath = [];

    function initMap() {
      // Inicializar el mapa
      const initialLocation = ${
        restaurantLocation
          ? `{ lat: ${restaurantLocation.latitude}, lng: ${restaurantLocation.longitude} }`
          : '{ lat: 20.5425, lng: -102.7935 }'
      };
      
      map = new google.maps.Map(document.getElementById('map'), {
        center: initialLocation,
        zoom: 14,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: false
      });

      // Escuchar mensajes desde React Native
      window.addEventListener('message', handleMessage);
      
      // Notificar que el mapa está listo
      sendMessage('mapReady', {});
    }

    function handleMessage(event) {
      try {
        const data = JSON.parse(event.data);
        
        switch(data.type) {
          case 'setPolygon':
            setPolygon(data.coordinates);
            break;
          case 'setEditMode':
            setEditMode(data.isEditing);
            break;
          case 'centerOnPolygon':
            centerOnPolygon();
            break;
          case 'clearPolygon':
            clearPolygon();
            break;
        }
      } catch (e) {
        // Error handling message
      }
    }

    function setPolygon(coordinates) {
      // Limpiar polígono anterior
      if (polygon) {
        polygon.setMap(null);
      }
      
      // Limpiar marcadores
      markers.forEach(marker => marker.setMap(null));
      markers = [];
      
      // Convertir coordenadas
      polygonPath = coordinates.map(coord => ({
        lat: coord.lat || coord.latitude,
        lng: coord.lng || coord.longitude
      }));
      
      
      if (polygonPath.length >= 3) {
        // Crear polígono
        polygon = new google.maps.Polygon({
          paths: polygonPath,
          strokeColor: '#FF0000',
          strokeOpacity: 0.8,
          strokeWeight: 3,
          fillColor: '#FF0000',
          fillOpacity: 0.35,
          editable: false,
          draggable: false
        });
        
        polygon.setMap(map);
        
        // Centrar en el polígono
        setTimeout(() => {
          centerOnPolygon();
          // Notificar que el polígono se ha dibujado
          sendMessage('polygonSet', {});
        }, 100);
      }
    }

    function setEditMode(editing) {
      isEditing = editing;
      
      if (isEditing) {
        // Habilitar clicks en el mapa
        google.maps.event.clearListeners(map, 'click');
        map.addListener('click', function(event) {
          addPoint(event.latLng);
        });
        
        // Mostrar marcadores inmediatamente
        updateMarkers();
      } else {
        // Deshabilitar clicks
        google.maps.event.clearListeners(map, 'click');
        
        // Ocultar marcadores
        markers.forEach(marker => marker.setMap(null));
        markers = [];
      }
    }

    function addPoint(latLng) {
      if (!isEditing) return;
      
      polygonPath.push({
        lat: latLng.lat(),
        lng: latLng.lng()
      });
      
      updatePolygon();
      updateMarkers();
      
      // Enviar actualización a React Native
      sendMessage('polygonUpdated', {
        coordinates: polygonPath
      });
    }

    function updatePolygon() {
      if (polygon) {
        polygon.setPath(polygonPath);
      } else if (polygonPath.length >= 3) {
        polygon = new google.maps.Polygon({
          paths: polygonPath,
          strokeColor: '#FF0000',
          strokeOpacity: 0.8,
          strokeWeight: 3,
          fillColor: '#FF0000',
          fillOpacity: 0.35
        });
        polygon.setMap(map);
      }
    }

    function updateMarkers() {
      // Limpiar marcadores anteriores
      markers.forEach(marker => marker.setMap(null));
      markers = [];
      
      if (!isEditing) return;
      
      // Crear nuevos marcadores
      polygonPath.forEach((point, index) => {
        const marker = new google.maps.Marker({
          position: point,
          map: map,
          draggable: true,
          label: {
            text: (index + 1).toString(),
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold'
          },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 20,
            fillColor: '#2563eb',
            fillOpacity: 1,
            strokeColor: 'white',
            strokeWeight: 2
          }
        });
        
        // Permitir arrastrar
        marker.addListener('dragend', function() {
          polygonPath[index] = {
            lat: marker.getPosition().lat(),
            lng: marker.getPosition().lng()
          };
          updatePolygon();
          sendMessage('polygonUpdated', {
            coordinates: polygonPath
          });
        });
        
        // Click para eliminar
        marker.addListener('click', function() {
          polygonPath.splice(index, 1);
          updatePolygon();
          updateMarkers();
          sendMessage('polygonUpdated', {
            coordinates: polygonPath
          });
        });
        
        markers.push(marker);
      });
    }

    function centerOnPolygon() {
      if (polygonPath.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        polygonPath.forEach(point => {
          bounds.extend(point);
        });
        map.fitBounds(bounds);
        
        // Ajustar el zoom si es necesario
        const listener = google.maps.event.addListener(map, 'idle', function() { 
          if (map.getZoom() > 18) {
            map.setZoom(18);
          }
          google.maps.event.removeListener(listener);
        });
      }
    }

    function clearPolygon() {
      polygonPath = [];
      if (polygon) {
        polygon.setMap(null);
        polygon = null;
      }
      markers.forEach(marker => marker.setMap(null));
      markers = [];
      
      sendMessage('polygonUpdated', {
        coordinates: []
      });
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
        // Error sending message
      }
    }
  </script>
  <script async defer
    src="https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap">
  </script>
</body>
</html>
  `
    : '';

  // Manejar mensajes del WebView
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      switch (data.type) {
        case 'mapReady':
          setMapReady(true);

          // Enviar polígono inicial si existe
          if (initialPolygon && initialPolygon.length > 0) {
            setTimeout(() => {
              sendMessageToWebView('setPolygon', {
                coordinates: initialPolygon,
              });
            }, 1000);
          } else {
            // Si no hay polígono inicial, ocultar el loading
            setIsLoading(false);
          }
          break;
        case 'polygonSet':
          // El polígono se ha dibujado en el mapa
          setIsLoading(false);
          break;
        case 'polygonUpdated': {
          const newPolygon = data.coordinates;
          setCurrentPolygon(newPolygon);
          if (onChange) {
            onChange(newPolygon);
          }
          break;
        }
      }
    } catch (e) {}
  };

  // Enviar mensaje al WebView
  const sendMessageToWebView = (type: string, data: any) => {
    if (webViewRef.current) {
      const message = JSON.stringify({ type, ...data });
      webViewRef.current.postMessage(message);
    }
  };

  // Actualizar el modo de edición cuando cambie
  useEffect(() => {
    if (mapReady) {
      sendMessageToWebView('setEditMode', {
        isEditing: isEditing && isDrawing,
      });
    }
  }, [isEditing, isDrawing, mapReady]);

  // Actualizar el polígono cuando cambie desde fuera
  useEffect(() => {
    if (mapReady && initialPolygon && initialPolygon.length > 0) {
      setCurrentPolygon(initialPolygon);
      sendMessageToWebView('setPolygon', { coordinates: initialPolygon });
    }
  }, [initialPolygon, mapReady]);

  // Resetear estados cuando el componente se monta
  useEffect(() => {
    setIsLoading(true);
    setMapReady(false);
  }, []);

  const toggleDrawing = () => {
    if (isDrawing && currentPolygon.length < 3) {
      Alert.alert(
        'Área incompleta',
        'Necesitas al menos 3 puntos para crear un área de cobertura.',
      );
      return;
    }
    const newDrawingState = !isDrawing;
    setIsDrawing(newDrawingState);

    // Enviar el estado de edición al mapa inmediatamente
    if (webViewRef.current) {
      const jsCode = `
        if (typeof setEditMode === 'function') {
          setEditMode(${newDrawingState});
        }
        true;
      `;
      webViewRef.current.injectJavaScript(jsCode);
    }
  };

  const clearPolygon = () => {
    sendMessageToWebView('clearPolygon', {});

    // También usar inyección directa
    if (webViewRef.current) {
      const jsCode = `
        if (typeof clearPolygon === 'function') {
          clearPolygon();
        }
        true;
      `;
      webViewRef.current.injectJavaScript(jsCode);
    }

    setCurrentPolygon([]);
    setIsDrawing(false);
    if (onChange) {
      onChange([]);
    }
  };

  const centerOnPolygon = () => {
    sendMessageToWebView('centerOnPolygon', {});

    // También usar inyección directa
    if (webViewRef.current) {
      const jsCode = `
        if (typeof centerOnPolygon === 'function') {
          centerOnPolygon();
        }
        true;
      `;
      webViewRef.current.injectJavaScript(jsCode);
    }
  };

  // Si estamos cargando la API key o no tenemos HTML, mostrar loading
  if (isLoadingApiKey || !mapHtml) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Surface style={styles.loadingCard} elevation={3}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>
            Cargando configuración del mapa...
          </Text>
        </Surface>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: mapHtml }}
        style={styles.map}
        onMessage={handleWebViewMessage}
        onLoad={() => {
          // Inyectar código JavaScript después de cargar
          if (
            webViewRef.current &&
            initialPolygon &&
            initialPolygon.length > 0
          ) {
            const jsCode = `
              setTimeout(() => {
                if (typeof setPolygon === 'function') {
                  setPolygon(${JSON.stringify(initialPolygon)});
                }
              }, 1500);
              true;
            `;
            webViewRef.current.injectJavaScript(jsCode);
          }
        }}
        onError={(error) => {}}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        mixedContentMode="compatibility"
        allowsInlineMediaPlayback={true}
        originWhitelist={['*']}
      />

      {/* Indicador de carga */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <Surface style={styles.loadingCard} elevation={3}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Cargando mapa...</Text>
          </Surface>
        </View>
      )}

      {/* Controles flotantes */}
      {isEditing && (
        <View style={styles.controls}>
          <Surface style={styles.controlsCard} elevation={2}>
            <View style={styles.controlsRow}>
              <IconButton
                icon={isDrawing ? 'check' : 'draw'}
                mode="contained"
                containerColor={
                  isDrawing ? theme.colors.primary : theme.colors.secondary
                }
                iconColor={
                  isDrawing ? theme.colors.onPrimary : theme.colors.onSecondary
                }
                size={24}
                onPress={toggleDrawing}
              />
              <IconButton
                icon="crosshairs-gps"
                mode="contained"
                containerColor={theme.colors.tertiaryContainer}
                iconColor={theme.colors.onTertiaryContainer}
                size={24}
                onPress={centerOnPolygon}
                disabled={currentPolygon.length === 0}
              />
              <IconButton
                icon="delete"
                mode="contained"
                containerColor={theme.colors.errorContainer}
                iconColor={theme.colors.onErrorContainer}
                size={24}
                onPress={clearPolygon}
                disabled={currentPolygon.length === 0}
              />
            </View>
          </Surface>
        </View>
      )}

      {/* Botón de centrar cuando no se está editando */}
      {!isEditing && currentPolygon.length > 0 && (
        <View style={styles.centerButtonContainer}>
          <IconButton
            icon="crosshairs-gps"
            mode="contained"
            containerColor={theme.colors.primaryContainer}
            iconColor={theme.colors.onPrimaryContainer}
            size={24}
            onPress={centerOnPolygon}
            style={styles.floatingCenterButton}
          />
        </View>
      )}
    </View>
  );
};

const createStyles = (theme: AppTheme, width: number, height: number) =>
  StyleSheet.create({
    container: {
      height: Math.min(height * 0.6, 500),
      width: '100%',
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: theme.colors.surfaceVariant,
    },
    map: {
      ...StyleSheet.absoluteFillObject,
    },
    controls: {
      position: 'absolute',
      top: theme.spacing.m,
      right: theme.spacing.m,
    },
    controlsCard: {
      borderRadius: 12,
      padding: theme.spacing.s,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    controlsRow: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
    statusText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: theme.spacing.xs,
    },
    centerButtonContainer: {
      position: 'absolute',
      bottom: theme.spacing.m,
      right: theme.spacing.m,
    },
    floatingCenterButton: {
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    loadingContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    loadingCard: {
      padding: theme.spacing.xl,
      borderRadius: 16,
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
    },
    loadingText: {
      marginTop: theme.spacing.m,
      fontSize: 16,
      color: theme.colors.onSurface,
      fontWeight: '500',
    },
  });

export default WebViewDeliveryCoverageMap;
