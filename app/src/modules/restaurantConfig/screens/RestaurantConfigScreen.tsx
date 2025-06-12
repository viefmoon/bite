import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  Card,
  Switch,
  TextInput,
  Button,
  ActivityIndicator,
  Portal,
  Dialog,
  Paragraph,
} from 'react-native-paper';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import { useRestaurantConfigQueries } from '../hooks/useRestaurantConfigQueries';
import { UpdateRestaurantConfigDto } from '../types/restaurantConfig.types';

const RestaurantConfigScreen: React.FC = () => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  
  const { useGetConfig, useUpdateConfig } = useRestaurantConfigQueries();
  const { data: config, isLoading, error } = useGetConfig();
  const updateConfigMutation = useUpdateConfig();

  const [formData, setFormData] = useState<UpdateRestaurantConfigDto>({});
  const [isEditing, setIsEditing] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  React.useEffect(() => {
    if (config) {
      setFormData({
        acceptingOrders: config.acceptingOrders,
        estimatedPickupTime: config.estimatedPickupTime,
        estimatedDeliveryTime: config.estimatedDeliveryTime,
      });
    }
  }, [config]);

  const handleSubmit = async () => {
    try {
      await updateConfigMutation.mutateAsync(formData);
      setIsEditing(false);
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  const handleCancel = () => {
    if (hasChanges()) {
      setShowDiscardDialog(true);
    } else {
      resetForm();
    }
  };

  const hasChanges = () => {
    if (!config) return false;
    return (
      formData.acceptingOrders !== config.acceptingOrders ||
      formData.estimatedPickupTime !== config.estimatedPickupTime ||
      formData.estimatedDeliveryTime !== config.estimatedDeliveryTime
    );
  };

  const resetForm = () => {
    if (config) {
      setFormData({
        acceptingOrders: config.acceptingOrders,
        estimatedPickupTime: config.estimatedPickupTime,
        estimatedDeliveryTime: config.estimatedDeliveryTime,
      });
    }
    setIsEditing(false);
  };

  const confirmDiscard = () => {
    resetForm();
    setShowDiscardDialog(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error al cargar la configuración</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Title
            title="Configuración del Restaurante"
            subtitle="Ajusta los parámetros generales del restaurante"
            titleStyle={styles.cardTitle}
          />
          <Card.Content>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Estado del Servicio</Text>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Aceptando órdenes</Text>
                <Switch
                  value={formData.acceptingOrders}
                  onValueChange={(value) =>
                    setFormData({ ...formData, acceptingOrders: value })
                  }
                  disabled={!isEditing}
                  color={theme.colors.primary}
                />
              </View>
              {!formData.acceptingOrders && (
                <Text style={styles.warningText}>
                  El restaurante no está aceptando órdenes nuevas
                </Text>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tiempos Estimados</Text>
              <TextInput
                label="Tiempo de preparación para recoger (minutos)"
                value={formData.estimatedPickupTime?.toString() || ''}
                onChangeText={(text) =>
                  setFormData({
                    ...formData,
                    estimatedPickupTime: parseInt(text) || 0,
                  })
                }
                keyboardType="numeric"
                mode="outlined"
                disabled={!isEditing}
                style={styles.input}
              />
              <TextInput
                label="Tiempo de entrega a domicilio (minutos)"
                value={formData.estimatedDeliveryTime?.toString() || ''}
                onChangeText={(text) =>
                  setFormData({
                    ...formData,
                    estimatedDeliveryTime: parseInt(text) || 0,
                  })
                }
                keyboardType="numeric"
                mode="outlined"
                disabled={!isEditing}
                style={styles.input}
              />
            </View>
          </Card.Content>
          <Card.Actions style={styles.cardActions}>
            {!isEditing ? (
              <Button
                mode="contained"
                onPress={() => setIsEditing(true)}
                style={styles.editButton}
              >
                Editar Configuración
              </Button>
            ) : (
              <>
                <Button
                  mode="outlined"
                  onPress={handleCancel}
                  style={styles.cancelButton}
                >
                  Cancelar
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  loading={updateConfigMutation.isPending}
                  disabled={updateConfigMutation.isPending || !hasChanges()}
                  style={styles.saveButton}
                >
                  Guardar Cambios
                </Button>
              </>
            )}
          </Card.Actions>
        </Card>

        {config && (
          <Card style={[styles.card, styles.infoCard]}>
            <Card.Content>
              <Text style={styles.infoTitle}>Información del Sistema</Text>
              <Text style={styles.infoText}>
                Última actualización: {new Date(config.updatedAt).toLocaleString('es-MX')}
              </Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      <Portal>
        <Dialog visible={showDiscardDialog} onDismiss={() => setShowDiscardDialog(false)}>
          <Dialog.Title>Descartar cambios</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              ¿Estás seguro de que deseas descartar los cambios realizados?
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDiscardDialog(false)}>Cancelar</Button>
            <Button onPress={confirmDiscard}>Descartar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      padding: theme.spacing.m,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    errorText: {
      fontSize: 16,
      color: theme.colors.error,
      textAlign: 'center',
    },
    card: {
      marginBottom: theme.spacing.m,
      elevation: 2,
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    section: {
      marginBottom: theme.spacing.l,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.s,
    },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.s,
    },
    switchLabel: {
      fontSize: 16,
      color: theme.colors.onSurface,
    },
    warningText: {
      fontSize: 14,
      color: theme.colors.error,
      marginTop: theme.spacing.xs,
      fontStyle: 'italic',
    },
    input: {
      marginBottom: theme.spacing.m,
    },
    cardActions: {
      paddingHorizontal: theme.spacing.m,
      paddingBottom: theme.spacing.m,
    },
    editButton: {
      flex: 1,
    },
    cancelButton: {
      marginRight: theme.spacing.s,
    },
    saveButton: {
      flex: 1,
    },
    infoCard: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    infoTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
      marginBottom: theme.spacing.xs,
    },
    infoText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
  });

export default RestaurantConfigScreen;