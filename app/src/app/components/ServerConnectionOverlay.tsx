import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {
  Surface,
  Text,
  Button,
  Icon,
  Portal,
} from 'react-native-paper';
import { useAppTheme } from '../styles/theme';
import { ServerConnectionState } from '../hooks/useServerConnection';

interface ServerConnectionOverlayProps {
  connectionState: ServerConnectionState;
}

const { height } = Dimensions.get('window');

export const ServerConnectionOverlay: React.FC<ServerConnectionOverlayProps> = ({
  connectionState,
}) => {
  const theme = useAppTheme();
  const { isSearching, isConnected, error, retry, hasWifi } = connectionState;


  // No mostrar overlay si está conectado
  if (isConnected) {
    return null;
  }

  const styles = StyleSheet.create({
    modal: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    surface: {
      width: '85%',
      maxWidth: 400,
      padding: 24,
      borderRadius: 16,
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
    },
    iconContainer: {
      marginBottom: 20,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
      marginBottom: 12,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 24,
      textAlign: 'center',
      lineHeight: 22,
    },
    errorText: {
      fontSize: 14,
      color: theme.colors.error,
      marginBottom: 20,
      textAlign: 'center',
    },
    loadingContainer: {
      marginBottom: 20,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    buttonsContainer: {
      marginTop: 8,
      width: '100%',
    },
    button: {
      marginVertical: 6,
    },
    instructionsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginTop: 16,
      marginBottom: 8,
    },
    instructionItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginVertical: 4,
      paddingHorizontal: 16,
    },
    instructionNumber: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: 'bold',
      marginRight: 8,
      minWidth: 20,
    },
    instructionText: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 20,
    },
  });


  return (
    <Portal>
      <Modal
        visible={true}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modal}>
          <Surface style={styles.surface} elevation={4}>
            {isSearching ? (
              <>
                <View style={styles.iconContainer}>
                  <Icon
                    source="lan-connect"
                    size={64}
                    color={theme.colors.primary}
                  />
                </View>
                <Text style={styles.title}>
                  {error?.includes('Reconectando') ? 'Reconectando...' : 'Buscando Servidor'}
                </Text>
                <Text style={styles.subtitle}>
                  {error?.includes('Reconectando') 
                    ? 'Restableciendo conexión con el servidor...'
                    : 'Escaneando la red local para encontrar el servidor CloudBite...'}
                </Text>
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={styles.loadingText}>
                    Esto puede tomar unos segundos
                  </Text>
                </View>
              </>
            ) : !hasWifi ? (
              // Modal simplificado cuando no hay WiFi
              <>
                <View style={styles.iconContainer}>
                  <Icon
                    source="wifi-off"
                    size={64}
                    color={theme.colors.error}
                  />
                </View>
                <Text style={styles.title}>Sin Conexión WiFi</Text>
                <Text style={styles.subtitle}>
                  Activa el WiFi y conéctate a la red del servidor
                </Text>
              </>
            ) : (
              // Modal completo cuando hay WiFi pero no se encuentra el servidor
              <>
                <View style={styles.iconContainer}>
                  <Icon
                    source="lan-disconnect"
                    size={64}
                    color={theme.colors.error}
                  />
                </View>
                <Text style={styles.title}>Servidor No Encontrado</Text>
                <Text style={styles.subtitle}>
                  No se pudo encontrar el servidor CloudBite.
                </Text>
                {error && (
                  <Text style={styles.errorText}>{error}</Text>
                )}
                
                <Text style={styles.instructionsTitle}>
                  Verifica lo siguiente:
                </Text>
                
                <View style={styles.instructionItem}>
                  <Text style={styles.instructionNumber}>1.</Text>
                  <Text style={styles.instructionText}>
                    El servidor está ejecutándose en el puerto 3737
                  </Text>
                </View>
                
                <View style={styles.instructionItem}>
                  <Text style={styles.instructionNumber}>2.</Text>
                  <Text style={styles.instructionText}>
                    Tu dispositivo está conectado a la misma red WiFi que el servidor
                  </Text>
                </View>
                
                <View style={styles.instructionItem}>
                  <Text style={styles.instructionNumber}>3.</Text>
                  <Text style={styles.instructionText}>
                    No hay firewall bloqueando el puerto 3737
                  </Text>
                </View>

                <View style={styles.buttonsContainer}>
                  <Button
                    mode="contained"
                    onPress={retry}
                    style={styles.button}
                    icon="refresh"
                  >
                    Reintentar Búsqueda
                  </Button>
                </View>
              </>
            )}
          </Surface>
        </View>
      </Modal>
    </Portal>
  );
};