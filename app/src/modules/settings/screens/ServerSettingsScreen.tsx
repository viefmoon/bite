import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  Text,
  Card,
  RadioButton,
  TextInput,
  Button,
  HelperText,
  Portal,
  Dialog,
  Paragraph,
  IconButton,
  Chip,
  Surface,
  Icon,
  TouchableRipple,
  ProgressBar,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSnackbar } from '@/hooks/useSnackbar';
import {
  serverConnectionService,
  ConnectionMode,
} from '@/services/serverConnectionService';
import { discoveryService } from '@/app/services/discoveryService';
import EncryptedStorage from '@/app/services/secureStorageService';
import { useAppTheme } from '@/app/styles/theme';
import { useResponsive } from '@/app/hooks/useResponsive';
import { useServerConnection } from '@/app/hooks/useServerConnection';
import axios from 'axios';

const STORAGE_KEYS = {
  CONNECTION_MODE: 'connection_mode',
  MANUAL_URL: 'manual_server_url',
};

export function ServerSettingsScreen() {
  const navigation = useNavigation();
  const { showSnackbar } = useSnackbar();
  const theme = useAppTheme();
  const responsive = useResponsive();
  const { isConnected, isHealthy, serverUrl, isSearching } =
    useServerConnection();

  const [mode, setMode] = useState<ConnectionMode>('auto');
  const [manualUrl, setManualUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryProgress, setDiscoveryProgress] = useState({
    current: 0,
    total: 0,
    message: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    // Actualizar el campo manual cuando cambie serverUrl
    if (serverUrl && !loading) {
      try {
        const url = new URL(serverUrl);
        setManualUrl(url.hostname);
      } catch {
        // Si no es una URL válida, intentar extraer la IP
        const cleanUrl = serverUrl.replace(/^https?:\/\//, '').split(':')[0];
        setManualUrl(cleanUrl);
      }
    }
  }, [serverUrl, loading]);

  const loadSettings = async () => {
    try {
      const [savedMode, savedUrl] = await Promise.all([
        EncryptedStorage.getItem(
          STORAGE_KEYS.CONNECTION_MODE,
        ) as Promise<ConnectionMode>,
        EncryptedStorage.getItem(STORAGE_KEYS.MANUAL_URL),
      ]);

      if (savedMode) setMode(savedMode);

      // Si hay una URL de servidor actual (de cualquier fuente), usarla para el campo manual
      if (serverUrl) {
        try {
          const url = new URL(serverUrl);
          setManualUrl(url.hostname);
        } catch {
          // Si no es una URL válida, intentar extraer la IP
          const cleanUrl = serverUrl.replace(/^https?:\/\//, '').split(':')[0];
          setManualUrl(cleanUrl);
        }
      } else if (savedUrl) {
        // Si no hay servidor actual pero sí una URL manual guardada, usarla
        try {
          const url = new URL(savedUrl);
          setManualUrl(url.hostname);
        } catch {
          // Si no es una URL válida, usar como está
          setManualUrl(savedUrl);
        }
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const validateUrl = (url: string): boolean => {
    // Validar que sea una IP válida o un dominio
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const domainRegex =
      /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;

    // Quitar espacios
    const trimmed = url.trim();

    // No debe incluir protocolo ni puerto
    if (
      trimmed.includes('http://') ||
      trimmed.includes('https://') ||
      trimmed.includes(':')
    ) {
      return false;
    }

    return ipRegex.test(trimmed) || domainRegex.test(trimmed);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Validar primero si es manual
      if (mode === 'manual') {
        if (!validateUrl(manualUrl)) {
          showSnackbar('Por favor ingresa una URL válida', 'error');
          setSaving(false);
          return;
        }
      }

      // Guardar la configuración
      await EncryptedStorage.setItem(STORAGE_KEYS.CONNECTION_MODE, mode);

      if (mode === 'manual') {
        // Guardar la URL completa, no solo la IP
        const fullUrl = `http://${manualUrl.trim()}:3737`;
        await EncryptedStorage.setItem(STORAGE_KEYS.MANUAL_URL, fullUrl);
      }

      // Primero establecer la URL si es necesario
      let urlToCheck: string | null = null;

      if (mode === 'manual') {
        // Construir la URL completa con http y el puerto estándar
        const fullUrl = `http://${manualUrl.trim()}:3737`;
        await discoveryService.setServerUrl(fullUrl, true);
        urlToCheck = fullUrl;
      } else if (mode === 'auto') {
        // En modo auto, limpiar cualquier URL manual
        await discoveryService.setServerUrl(null, true);
      }

      // Luego establecer el modo (esto actualizará la URL mostrada)
      await serverConnectionService.setConnectionMode(mode);

      // Comportamiento diferente según el modo
      if (mode === 'auto') {
        // En modo automático, hacer discovery
        setIsDiscovering(true);
        showSnackbar('Iniciando búsqueda de servidor...', 'info');

        try {
          // Limpiar cualquier URL manual previa
          await discoveryService.setServerUrl(null, true);

          // Configurar callback de progreso
          discoveryService.setProgressCallback((progress) => {
            setDiscoveryProgress(progress);
          });

          // Hacer discovery
          const discoveredUrl = await discoveryService.discoverServer();

          if (discoveredUrl) {
            showSnackbar('Servidor encontrado ✓', 'success');
            // El discovery ya actualiza el estado, solo necesitamos iniciar el monitoreo
            const { healthMonitoringService } = await import(
              '@/services/healthMonitoringService'
            );
            healthMonitoringService.startMonitoring();
          } else {
            showSnackbar('No se encontró servidor en la red', 'error');
          }
        } catch (error) {
          showSnackbar('Error al buscar servidor', 'error');
        } finally {
          setIsDiscovering(false);
          discoveryService.setProgressCallback(null);
          setDiscoveryProgress({ current: 0, total: 0, message: '' });
        }
      } else {
        // Para manual, hacer reconnect para aplicar la nueva configuración
        showSnackbar('Aplicando configuración...', 'info');

        try {
          // Hacer reconnect que reinicializará todo con la nueva URL
          await serverConnectionService.reconnect();

          showSnackbar('Configuración guardada - Conectado ✓', 'success');
        } catch (error) {
          showSnackbar('Verificando conexión...', 'info');

          // Si el reconnect falla, intentar un health check directo
          const { healthMonitoringService } = await import(
            '@/services/healthMonitoringService'
          );

          try {
            const isHealthy = await healthMonitoringService.forceCheck();

            if (isHealthy) {
              showSnackbar(
                'Configuración guardada - Servidor accesible ✓',
                'success',
              );
              healthMonitoringService.startMonitoring();
            } else {
              showSnackbar(
                'Configuración guardada - El servidor no responde ✗',
                'warning',
              );
            }
          } catch (error) {
            showSnackbar(
              'Configuración guardada - Error al verificar servidor',
              'warning',
            );
          }
        }
      }
    } catch (error: any) {
      showSnackbar(
        error.message || 'Error al guardar la configuración',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  const renderConnectionStatus = () => {
    let chipIcon = 'alert-circle';
    let chipText = 'Sin conexión';
    let chipColor = theme.colors.error;
    let chipBgColor = theme.dark
      ? 'rgba(244, 67, 54, 0.2)'
      : 'rgba(244, 67, 54, 0.1)';

    if (isSearching) {
      chipIcon = 'wifi-sync';
      chipText = 'Buscando...';
      chipColor = theme.colors.warning || '#FF9800';
      chipBgColor = theme.dark
        ? 'rgba(255, 152, 0, 0.2)'
        : 'rgba(255, 152, 0, 0.1)';
    } else if (isConnected && isHealthy) {
      chipIcon = 'check-circle';
      chipText = 'Conectado';
      chipColor = theme.colors.success || '#4CAF50';
      chipBgColor = theme.dark
        ? 'rgba(76, 175, 80, 0.2)'
        : 'rgba(76, 175, 80, 0.1)';
    }

    return (
      <Chip
        icon={chipIcon}
        mode="flat"
        compact
        style={{
          backgroundColor: chipBgColor,
          transform: [{ scale: 0.85 }],
        }}
        textStyle={{ color: chipColor, fontSize: 12 }}
      >
        {chipText}
      </Chip>
    );
  };

  const styles = React.useMemo(
    () => createStyles(theme, responsive),
    [theme, responsive],
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Estado de Conexión */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Estado de Conexión</Text>
          {renderConnectionStatus()}
          <View style={{ flex: 1 }} />
          <IconButton
            icon="information"
            size={20}
            onPress={() => setShowInfo(true)}
            iconColor={theme.colors.onSurfaceVariant}
          />
        </View>

        <View>
          <Surface style={styles.infoCard} elevation={0}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Icon
                  source="server"
                  size={20}
                  color={theme.colors.onSurfaceVariant}
                />
                <View style={styles.infoContent}>
                  <Text variant="labelSmall" style={styles.infoLabel}>
                    Servidor
                  </Text>
                  <Text variant="bodyMedium" style={styles.infoValue}>
                    {serverUrl
                      ? serverUrl.replace(/^https?:\/\//, '').split(':')[0]
                      : '-'}
                  </Text>
                </View>
              </View>

              <View style={styles.infoDivider} />

              <View style={styles.infoItem}>
                <Icon
                  source="ethernet-cable"
                  size={20}
                  color={theme.colors.onSurfaceVariant}
                />
                <View style={styles.infoContent}>
                  <Text variant="labelSmall" style={styles.infoLabel}>
                    Puerto
                  </Text>
                  <Text variant="bodyMedium" style={styles.infoValue}>
                    {serverUrl
                      ? serverUrl.split(':').pop()?.split('/')[0] || '3737'
                      : '3737'}
                  </Text>
                </View>
              </View>
            </View>

            {serverUrl && !isHealthy && isConnected && (
              <View style={styles.healthWarning}>
                <Icon
                  source="alert"
                  size={16}
                  color={theme.colors.warning || '#FF9800'}
                />
                <Text variant="labelSmall" style={styles.healthWarningText}>
                  El servidor no responde correctamente
                </Text>
              </View>
            )}
          </Surface>
        </View>
      </View>

      {/* Modo de Conexión */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Modo de Conexión</Text>

        <RadioButton.Group
          onValueChange={(value) => setMode(value as ConnectionMode)}
          value={mode}
        >
          <TouchableRipple
            onPress={() => setMode('auto')}
            style={[
              styles.radioOption,
              mode === 'auto' && styles.radioOptionActive,
            ]}
            rippleColor={`${theme.colors.primary}20`}
          >
            <View style={styles.radioContent}>
              <Icon
                source="wifi"
                size={24}
                color={
                  mode === 'auto'
                    ? theme.colors.primary
                    : theme.colors.onSurfaceVariant
                }
              />
              <View style={styles.radioTextContainer}>
                <Text
                  variant="titleMedium"
                  style={[
                    styles.radioTitle,
                    mode === 'auto' && { color: theme.colors.primary },
                  ]}
                >
                  Automático
                </Text>
                <Text variant="bodySmall" style={styles.radioSubtitle}>
                  Busca el servidor en tu red local
                </Text>
              </View>
              <RadioButton
                value="auto"
                status={mode === 'auto' ? 'checked' : 'unchecked'}
              />
            </View>
          </TouchableRipple>

          <TouchableRipple
            onPress={() => setMode('manual')}
            style={[
              styles.radioOption,
              mode === 'manual' && styles.radioOptionActive,
              { marginBottom: 0 },
            ]}
            rippleColor={`${theme.colors.primary}20`}
          >
            <View>
              <View style={styles.radioContent}>
                <Icon
                  source="pencil-outline"
                  size={24}
                  color={
                    mode === 'manual'
                      ? theme.colors.primary
                      : theme.colors.onSurfaceVariant
                  }
                />
                <View style={styles.radioTextContainer}>
                  <Text
                    variant="titleMedium"
                    style={[
                      styles.radioTitle,
                      mode === 'manual' && { color: theme.colors.primary },
                    ]}
                  >
                    Manual
                  </Text>
                  <Text variant="bodySmall" style={styles.radioSubtitle}>
                    Especifica la URL del servidor
                  </Text>
                </View>
                <RadioButton
                  value="manual"
                  status={mode === 'manual' ? 'checked' : 'unchecked'}
                />
              </View>
              {mode === 'manual' && (
                <View style={styles.manualInputContainer}>
                  <TextInput
                    label="Dirección IP o Dominio"
                    value={manualUrl}
                    onChangeText={setManualUrl}
                    placeholder="192.168.1.100"
                    mode="outlined"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="default"
                    error={manualUrl !== '' && !validateUrl(manualUrl)}
                    outlineColor={theme.colors.outline}
                    activeOutlineColor={theme.colors.primary}
                    style={styles.manualInput}
                  />
                  <HelperText
                    type={
                      manualUrl !== '' && !validateUrl(manualUrl)
                        ? 'error'
                        : 'info'
                    }
                    visible={true}
                  >
                    {manualUrl !== '' && !validateUrl(manualUrl)
                      ? 'Ingresa solo la IP (ej: 192.168.1.100) sin http:// ni puerto'
                      : 'Solo la dirección IP sin protocolo. El puerto 3737 se añadirá automáticamente.'}
                  </HelperText>
                </View>
              )}
            </View>
          </TouchableRipple>
        </RadioButton.Group>
      </View>

      {/* Indicador de progreso del discovery */}
      {isDiscovering && (
        <View style={styles.discoveryProgressContainer}>
          <Surface style={styles.discoveryProgressCard} elevation={1}>
            <View style={styles.discoveryHeader}>
              <Icon
                source="magnify-scan"
                size={24}
                color={theme.colors.primary}
              />
              <Text style={styles.discoveryTitle}>
                Buscando servidor en la red
              </Text>
            </View>
            <ProgressBar
              progress={
                discoveryProgress.total > 0
                  ? discoveryProgress.current / discoveryProgress.total
                  : 0
              }
              color={theme.colors.primary}
              style={styles.progressBar}
            />
            <Text style={styles.discoveryMessage}>
              {discoveryProgress.message || 'Iniciando búsqueda...'}
            </Text>
            {discoveryProgress.total > 0 && (
              <Text style={styles.discoveryStats}>
                {discoveryProgress.current} de {discoveryProgress.total} IPs
                escaneadas
              </Text>
            )}
          </Surface>
        </View>
      )}

      {/* Botón de guardar */}
      <View style={styles.actionButtons}>
        <Button
          mode="contained"
          onPress={saveSettings}
          loading={saving}
          disabled={saving || isDiscovering}
          icon="content-save"
          style={styles.saveButton}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
        >
          Guardar Configuración
        </Button>
      </View>

      <Portal>
        <Dialog visible={showInfo} onDismiss={() => setShowInfo(false)}>
          <Dialog.Title>Información de Conexión</Dialog.Title>
          <Dialog.Content>
            <Paragraph style={styles.infoParagraph}>
              <Text style={styles.boldText}>Modo Automático:</Text>
              {'\n'}Ideal para uso en el restaurante. La app busca el servidor
              en la red local.
            </Paragraph>

            <Paragraph style={styles.infoParagraph}>
              <Text style={styles.boldText}>Modo Manual:</Text>
              {'\n'}Configura manualmente la URL del servidor para casos
              especiales.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowInfo(false)}>Cerrar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const createStyles = (theme: any, responsive: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    section: {
      marginHorizontal: 16,
      marginTop: 20,
      marginBottom: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: responsive?.isWeb ? 20 : 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginRight: 12,
    },
    infoCard: {
      backgroundColor: theme.dark
        ? theme.colors.surfaceVariant
        : theme.colors.surface,
      borderRadius: 12,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 8,
    },
    infoContent: {
      flex: 1,
    },
    infoLabel: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: 2,
      fontSize: responsive?.isWeb ? 12 : 11,
    },
    infoValue: {
      color: theme.colors.onSurface,
      fontWeight: '600',
      fontSize: responsive?.isWeb ? 16 : 14,
    },
    infoDivider: {
      width: 1,
      height: 40,
      backgroundColor: theme.colors.outlineVariant,
      marginHorizontal: 12,
    },
    healthWarning: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
    },
    healthWarningText: {
      color: theme.colors.warning || '#FF9800',
      flex: 1,
    },
    radioOption: {
      marginBottom: 12,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      overflow: 'hidden',
    },
    radioOptionActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.dark
        ? 'rgba(103, 80, 164, 0.08)'
        : 'rgba(103, 80, 164, 0.05)',
    },
    radioContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      gap: 12,
    },
    radioTextContainer: {
      flex: 1,
    },
    radioTitle: {
      color: theme.colors.onSurface,
      fontWeight: '600',
    },
    radioSubtitle: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    radioDetails: {
      marginTop: 8,
      marginLeft: 48,
      marginRight: 16,
      marginBottom: 12,
      padding: 8,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 8,
    },
    radioDetailsText: {
      color: theme.colors.onSurfaceVariant,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    manualInputContainer: {
      paddingTop: 8,
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    manualInput: {
      backgroundColor: theme.colors.surface,
    },
    actionButtons: {
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 20,
    },
    saveButton: {
      backgroundColor: theme.colors.primary,
    },
    buttonContent: {
      paddingVertical: 8,
    },
    buttonLabel: {
      fontSize: responsive?.isWeb ? 16 : 14,
    },
    infoParagraph: {
      marginBottom: 12,
      color: theme.colors.onSurfaceVariant,
      lineHeight: responsive?.isWeb ? 24 : 20,
    },
    boldText: {
      fontWeight: 'bold',
      color: theme.colors.onSurface,
    },
    discoveryProgressContainer: {
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 8,
    },
    discoveryProgressCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    discoveryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    discoveryTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
      flex: 1,
    },
    progressBar: {
      height: 6,
      borderRadius: 3,
      marginBottom: 12,
    },
    discoveryMessage: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 4,
    },
    discoveryStats: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
    },
  });
