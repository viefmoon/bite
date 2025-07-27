import { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  Text,
  Modal,
  Portal,
  Surface,
  RadioButton,
  TextInput,
  Button,
  HelperText,
  Chip,
  IconButton,
  useTheme,
} from 'react-native-paper';
import { useSnackbarStore } from '@/app/store/snackbarStore';
import { STORAGE_KEYS } from '@/app/constants/storageKeys';
import { ConnectionMode } from '@/services/serverConnectionService';
import { discoveryService } from '@/app/services/discoveryService';
import EncryptedStorage from '@/app/services/secureStorageService';
import axios from 'axios';

interface ServerConfigModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSuccess?: () => void;
}

export function ServerConfigModal({
  visible,
  onDismiss,
  onSuccess,
}: ServerConfigModalProps) {
  const theme = useTheme();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  const [mode, setMode] = useState<ConnectionMode>('auto');
  const [manualUrl, setManualUrl] = useState('');
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [remoteUrlAvailable, setRemoteUrlAvailable] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (visible) {
      loadSettings();
    }
  }, [visible]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const savedMode = (await EncryptedStorage.getItem(
        STORAGE_KEYS.CONNECTION_MODE,
      )) as ConnectionMode;
      const savedUrl = await EncryptedStorage.getItem(STORAGE_KEYS.MANUAL_URL);
      const currentApiUrl = await discoveryService.getApiUrl();

      if (savedMode) setMode(savedMode);
      if (savedUrl) setManualUrl(savedUrl);
      if (currentApiUrl) setCurrentUrl(currentApiUrl);

      if (currentApiUrl) {
        try {
          const response = await axios.get(`${currentApiUrl}/api/v1/discovery`);
          if (response.data.remoteUrl) {
            setRemoteUrlAvailable(response.data.remoteUrl);
          }
        } catch (error) {}
      }
    } catch (error) {
      // Error loading settings
    } finally {
      setLoading(false);
    }
  };

  const normalizeUrl = (url: string): string => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'http://' + url;
    }

    try {
      const parsed = new URL(url);
      if (
        !parsed.port &&
        (parsed.hostname.startsWith('192.168.') ||
          parsed.hostname.startsWith('10.') ||
          parsed.hostname.startsWith('172.') ||
          parsed.hostname === 'localhost' ||
          /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(parsed.hostname))
      ) {
        parsed.port = '3737';
      }
      return `${parsed.protocol}//${parsed.host}`;
    } catch {
      return url;
    }
  };

  const validateUrl = (url: string): boolean => {
    try {
      const normalized = normalizeUrl(url);
      const parsed = new URL(normalized);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  };

  const testConnection = async () => {
    if (mode === 'manual' && !validateUrl(manualUrl)) {
      showSnackbar({
        message: 'Por favor ingresa una URL válida',
        type: 'error',
      });
      return;
    }

    setTesting(true);
    try {
      let urlToTest = '';

      if (mode === 'auto') {
        // Probar auto-descubrimiento
        const discovered = await discoveryService.discoverServer();
        if (!discovered) {
          throw new Error('No se pudo encontrar el servidor en la red local');
        }
        urlToTest = discovered;
      } else if (mode === 'remote' && remoteUrlAvailable) {
        urlToTest = remoteUrlAvailable;
      } else {
        urlToTest = normalizeUrl(manualUrl);
      }

      // Verificar conexión
      const response = await axios.get(`${urlToTest}/api/v1/discovery`, {
        timeout: 5000,
      });

      if (response.data.type !== 'cloudbite-api') {
        throw new Error('El servidor no es compatible');
      }

      showSnackbar({ message: 'Conexión exitosa', type: 'success' });
      setCurrentUrl(urlToTest);
    } catch (error: any) {
      showSnackbar({
        message: error.message || 'Error al conectar con el servidor',
        type: 'error',
      });
    } finally {
      setTesting(false);
    }
  };

  const saveSettings = async () => {
    try {
      // Guardar modo de conexión
      await EncryptedStorage.setItem(STORAGE_KEYS.CONNECTION_MODE, mode);

      // Guardar URL manual si aplica
      if (mode === 'manual') {
        if (!validateUrl(manualUrl)) {
          showSnackbar({
            message: 'Por favor ingresa una URL válida',
            type: 'error',
          });
          return;
        }
        const normalizedUrl = normalizeUrl(manualUrl);
        await EncryptedStorage.setItem(STORAGE_KEYS.MANUAL_URL, normalizedUrl);
        await discoveryService.setServerUrl(normalizedUrl, true);

        // En web, verificar la conexión inmediatamente
        if (Platform.OS === 'web') {
          try {
            const response = await axios.get(
              `${normalizedUrl}/api/v1/discovery`,
              {
                timeout: 5000,
              },
            );
            if (response.data.type === 'cloudbite-api') {
              // El servicio detectará automáticamente el cambio de URL
            }
          } catch (error) {
            // Error verificando conexión después de guardar
          }
        }
      } else if (mode === 'remote' && remoteUrlAvailable) {
        await discoveryService.setServerUrl(remoteUrlAvailable, true);
      } else {
        // Modo automático - limpiar URL manual
        await discoveryService.setServerUrl(null, true);
      }

      // La reconexión se manejará en el onSuccess callback

      showSnackbar({ message: 'Configuración guardada', type: 'success' });
      onSuccess?.();
      onDismiss();
    } catch (error: any) {
      showSnackbar({
        message: error.message || 'Error al guardar la configuración',
        type: 'error',
      });
    }
  };

  const styles = StyleSheet.create({
    modal: {
      justifyContent: 'center',
      alignItems: 'center',
      margin: 20,
    },
    container: {
      width: '100%',
      maxWidth: 500,
      maxHeight: '90%',
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
    },
    content: {
      padding: 16,
    },
    loadingContainer: {
      padding: 40,
      alignItems: 'center',
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 16,
    },
    successChip: {
      backgroundColor: theme.colors.primaryContainer,
    },
    errorChip: {
      backgroundColor: theme.colors.errorContainer,
    },
    urlText: {
      flex: 1,
      marginLeft: 8,
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
    },
    section: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
      color: theme.colors.onSurface,
    },
    manualConfig: {
      marginTop: 8,
      marginLeft: 32,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
    },
  });

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
        dismissable={!testing}
      >
        <Surface style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Configuración del Servidor</Text>
            <IconButton
              icon="close"
              size={24}
              onPress={onDismiss}
              disabled={testing}
            />
          </View>

          <ScrollView style={styles.content}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
              </View>
            ) : (
              <>
                {/* Estado actual */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Estado de Conexión</Text>
                  {currentUrl ? (
                    <View style={styles.statusContainer}>
                      <Chip
                        icon="check-circle"
                        mode="flat"
                        style={styles.successChip}
                      >
                        Conectado
                      </Chip>
                      <Text
                        variant="bodySmall"
                        style={styles.urlText}
                        numberOfLines={1}
                      >
                        {currentUrl}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.statusContainer}>
                      <Chip
                        icon="alert-circle"
                        mode="flat"
                        style={styles.errorChip}
                      >
                        Sin conexión
                      </Chip>
                    </View>
                  )}
                </View>

                {/* Modo de conexión */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Modo de Conexión</Text>
                  <RadioButton.Group
                    onValueChange={(value) => setMode(value as ConnectionMode)}
                    value={mode}
                  >
                    <RadioButton.Item
                      label="Automático (Red Local)"
                      value="auto"
                      status={mode === 'auto' ? 'checked' : 'unchecked'}
                    />
                    <HelperText type="info" visible={mode === 'auto'}>
                      Busca automáticamente el servidor en tu red local
                    </HelperText>

                    {remoteUrlAvailable && (
                      <>
                        <RadioButton.Item
                          label="Remoto (Internet)"
                          value="remote"
                          status={mode === 'remote' ? 'checked' : 'unchecked'}
                        />
                        <HelperText type="info" visible={mode === 'remote'}>
                          Usa el servidor remoto: {remoteUrlAvailable}
                        </HelperText>
                      </>
                    )}

                    <RadioButton.Item
                      label="Manual"
                      value="manual"
                      status={mode === 'manual' ? 'checked' : 'unchecked'}
                    />

                    {mode === 'manual' && (
                      <View style={styles.manualConfig}>
                        <TextInput
                          label="URL del Servidor"
                          value={manualUrl}
                          onChangeText={setManualUrl}
                          placeholder="192.168.1.230 o http://192.168.1.230:3737"
                          mode="outlined"
                          autoCapitalize="none"
                          autoCorrect={false}
                          keyboardType="url"
                          error={manualUrl !== '' && !validateUrl(manualUrl)}
                        />
                        <HelperText
                          type="info"
                          visible={mode === 'manual' && manualUrl === ''}
                        >
                          Puedes ingresar solo la IP. El puerto 3737 se agregará
                          automáticamente.
                        </HelperText>
                        <HelperText
                          type="error"
                          visible={manualUrl !== '' && !validateUrl(manualUrl)}
                        >
                          URL inválida
                        </HelperText>
                      </View>
                    )}
                  </RadioButton.Group>
                </View>
              </>
            )}
          </ScrollView>

          <View style={styles.actions}>
            <Button mode="text" onPress={onDismiss} disabled={testing}>
              Cancelar
            </Button>
            <Button
              mode="outlined"
              onPress={testConnection}
              loading={testing}
              disabled={testing || loading}
              icon="connection"
            >
              Probar
            </Button>
            <Button
              mode="contained"
              onPress={saveSettings}
              disabled={testing || loading}
              icon="content-save"
            >
              Guardar
            </Button>
          </View>
        </Surface>
      </Modal>
    </Portal>
  );
}
