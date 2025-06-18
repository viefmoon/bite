import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  Switch,
  TextInput,
  Button,
  ActivityIndicator,
  Portal,
  Dialog,
  Paragraph,
  Surface,
  Chip,
  SegmentedButtons,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import { useRestaurantConfigQueries } from '../hooks/useRestaurantConfigQueries';
import { UpdateRestaurantConfigDto, CreateBusinessHoursDto } from '../types/restaurantConfig.types';
import BusinessHoursForm from '../components/BusinessHoursForm';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

type TabType = 'basic' | 'operation' | 'schedule' | 'delivery';

const RestaurantConfigScreen: React.FC = () => {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const styles = React.useMemo(() => createStyles(theme, width), [theme, width]);

  const { useGetConfig, useUpdateConfig } = useRestaurantConfigQueries();
  const { data: config, isLoading, error } = useGetConfig();
  const updateConfigMutation = useUpdateConfig();

  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [formData, setFormData] = useState<UpdateRestaurantConfigDto>({});
  const [isEditing, setIsEditing] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  React.useEffect(() => {
    if (config) {
      setFormData({
        // Información básica
        restaurantName: config.restaurantName,
        phoneMain: config.phoneMain,
        phoneSecondary: config.phoneSecondary,
        address: config.address,
        city: config.city,
        state: config.state,
        postalCode: config.postalCode,
        country: config.country,
        // Configuración de operación
        acceptingOrders: config.acceptingOrders,
        estimatedPickupTime: config.estimatedPickupTime,
        estimatedDeliveryTime: config.estimatedDeliveryTime,
        openingGracePeriod: config.openingGracePeriod,
        closingGracePeriod: config.closingGracePeriod,
        timeZone: config.timeZone,
        // Configuración de delivery
        deliveryCoverageArea: config.deliveryCoverageArea,
        // Horarios
        businessHours: config.businessHours,
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
    return JSON.stringify(formData) !== JSON.stringify({
      restaurantName: config.restaurantName,
      phoneMain: config.phoneMain,
      phoneSecondary: config.phoneSecondary,
      address: config.address,
      city: config.city,
      state: config.state,
      postalCode: config.postalCode,
      country: config.country,
      acceptingOrders: config.acceptingOrders,
      estimatedPickupTime: config.estimatedPickupTime,
      estimatedDeliveryTime: config.estimatedDeliveryTime,
      openingGracePeriod: config.openingGracePeriod,
      closingGracePeriod: config.closingGracePeriod,
      timeZone: config.timeZone,
      deliveryCoverageArea: config.deliveryCoverageArea,
      businessHours: config.businessHours,
    });
  };

  const resetForm = () => {
    if (config) {
      setFormData({
        restaurantName: config.restaurantName,
        phoneMain: config.phoneMain,
        phoneSecondary: config.phoneSecondary,
        address: config.address,
        city: config.city,
        state: config.state,
        postalCode: config.postalCode,
        country: config.country,
        acceptingOrders: config.acceptingOrders,
        estimatedPickupTime: config.estimatedPickupTime,
        estimatedDeliveryTime: config.estimatedDeliveryTime,
        openingGracePeriod: config.openingGracePeriod,
        closingGracePeriod: config.closingGracePeriod,
        timeZone: config.timeZone,
        deliveryCoverageArea: config.deliveryCoverageArea,
        businessHours: config.businessHours,
      });
    }
    setIsEditing(false);
  };

  const confirmDiscard = () => {
    resetForm();
    setShowDiscardDialog(false);
  };

  const renderBasicInfo = () => (
    <View style={styles.tabContent}>
      <Surface style={styles.section} elevation={1}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons
            name="store-outline"
            size={24}
            color={theme.colors.primary}
          />
          <Text style={styles.sectionTitle}>Información del Restaurante</Text>
        </View>

        <View style={styles.sectionContent}>
          <TextInput
            label="Nombre del restaurante"
            value={formData.restaurantName || ''}
            onChangeText={(text) => setFormData({ ...formData, restaurantName: text })}
            mode="outlined"
            disabled={!isEditing}
            style={styles.input}
            outlineStyle={styles.inputOutline}
          />

          <View style={styles.row}>
            <TextInput
              label="Teléfono principal"
              value={formData.phoneMain || ''}
              onChangeText={(text) => setFormData({ ...formData, phoneMain: text })}
              mode="outlined"
              disabled={!isEditing}
              style={[styles.input, styles.halfInput]}
              outlineStyle={styles.inputOutline}
              keyboardType="phone-pad"
              left={<TextInput.Icon icon="phone" />}
            />
            <TextInput
              label="Teléfono secundario"
              value={formData.phoneSecondary || ''}
              onChangeText={(text) => setFormData({ ...formData, phoneSecondary: text })}
              mode="outlined"
              disabled={!isEditing}
              style={[styles.input, styles.halfInput]}
              outlineStyle={styles.inputOutline}
              keyboardType="phone-pad"
              left={<TextInput.Icon icon="cellphone" />}
            />
          </View>

          <TextInput
            label="Dirección"
            value={formData.address || ''}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
            mode="outlined"
            disabled={!isEditing}
            style={styles.input}
            outlineStyle={styles.inputOutline}
            multiline
            numberOfLines={2}
            left={<TextInput.Icon icon="map-marker" />}
          />

          <View style={styles.row}>
            <TextInput
              label="Ciudad"
              value={formData.city || ''}
              onChangeText={(text) => setFormData({ ...formData, city: text })}
              mode="outlined"
              disabled={!isEditing}
              style={[styles.input, styles.halfInput]}
              outlineStyle={styles.inputOutline}
            />
            <TextInput
              label="Estado"
              value={formData.state || ''}
              onChangeText={(text) => setFormData({ ...formData, state: text })}
              mode="outlined"
              disabled={!isEditing}
              style={[styles.input, styles.halfInput]}
              outlineStyle={styles.inputOutline}
            />
          </View>

          <View style={styles.row}>
            <TextInput
              label="Código postal"
              value={formData.postalCode || ''}
              onChangeText={(text) => setFormData({ ...formData, postalCode: text })}
              mode="outlined"
              disabled={!isEditing}
              style={[styles.input, styles.halfInput]}
              outlineStyle={styles.inputOutline}
              keyboardType="numeric"
            />
            <TextInput
              label="País"
              value={formData.country || ''}
              onChangeText={(text) => setFormData({ ...formData, country: text })}
              mode="outlined"
              disabled={!isEditing}
              style={[styles.input, styles.halfInput]}
              outlineStyle={styles.inputOutline}
            />
          </View>
        </View>
      </Surface>
    </View>
  );

  const renderOperationConfig = () => (
    <View style={styles.tabContent}>
      {/* Service Status Card */}
      <Surface style={styles.section} elevation={1}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons
            name="store-check"
            size={24}
            color={theme.colors.primary}
          />
          <Text style={styles.sectionTitle}>Estado del Servicio</Text>
        </View>

        <View style={styles.sectionContent}>
          <View style={styles.statusRow}>
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>Recepción de Órdenes</Text>
              <Text style={styles.statusDescription}>
                {formData.acceptingOrders
                  ? 'Las órdenes están siendo aceptadas'
                  : 'No se están aceptando órdenes nuevas'}
              </Text>
            </View>
            <Switch
              value={formData.acceptingOrders}
              onValueChange={(value) => setFormData({ ...formData, acceptingOrders: value })}
              disabled={!isEditing}
              color={theme.colors.primary}
            />
          </View>
        </View>
      </Surface>

      {/* Delivery Times Card */}
      <Surface style={styles.section} elevation={1}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons
            name="clock-time-four"
            size={24}
            color={theme.colors.primary}
          />
          <Text style={styles.sectionTitle}>Tiempos de Servicio</Text>
        </View>

        <View style={styles.sectionContent}>
          <View style={styles.timeInputContainer}>
            <View style={styles.timeIconWrapper}>
              <MaterialCommunityIcons
                name="walk"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            </View>
            <TextInput
              label="Para recoger en tienda"
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
              style={styles.timeInput}
              right={<TextInput.Affix text="min" />}
              outlineStyle={styles.inputOutline}
            />
          </View>

          <View style={styles.timeInputContainer}>
            <View style={styles.timeIconWrapper}>
              <MaterialCommunityIcons
                name="moped"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            </View>
            <TextInput
              label="Entrega a domicilio"
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
              style={styles.timeInput}
              right={<TextInput.Affix text="min" />}
              outlineStyle={styles.inputOutline}
            />
          </View>

          <View style={styles.timeInputContainer}>
            <View style={styles.timeIconWrapper}>
              <MaterialCommunityIcons
                name="timer"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            </View>
            <TextInput
              label="Periodo de gracia al abrir"
              value={formData.openingGracePeriod?.toString() || ''}
              onChangeText={(text) =>
                setFormData({
                  ...formData,
                  openingGracePeriod: parseInt(text) || 0,
                })
              }
              keyboardType="numeric"
              mode="outlined"
              disabled={!isEditing}
              style={styles.timeInput}
              right={<TextInput.Affix text="min" />}
              outlineStyle={styles.inputOutline}
            />
          </View>

          <View style={styles.timeInputContainer}>
            <View style={styles.timeIconWrapper}>
              <MaterialCommunityIcons
                name="timer-off-outline"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            </View>
            <TextInput
              label="Periodo de gracia al cerrar"
              value={formData.closingGracePeriod?.toString() || ''}
              onChangeText={(text) =>
                setFormData({
                  ...formData,
                  closingGracePeriod: parseInt(text) || 0,
                })
              }
              keyboardType="numeric"
              mode="outlined"
              disabled={!isEditing}
              style={styles.timeInput}
              right={<TextInput.Affix text="min" />}
              outlineStyle={styles.inputOutline}
            />
          </View>

          <View style={styles.infoChip}>
            <Chip
              icon="information"
              mode="flat"
              style={styles.chip}
              textStyle={styles.chipText}
            >
              Los tiempos son estimados y pueden variar
            </Chip>
          </View>
        </View>
      </Surface>

      {/* Time Zone */}
      <Surface style={styles.section} elevation={1}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons
            name="earth"
            size={24}
            color={theme.colors.primary}
          />
          <Text style={styles.sectionTitle}>Zona Horaria</Text>
        </View>

        <View style={styles.sectionContent}>
          <TextInput
            label="Zona horaria"
            value={formData.timeZone || ''}
            onChangeText={(text) => setFormData({ ...formData, timeZone: text })}
            mode="outlined"
            disabled={!isEditing}
            style={styles.input}
            outlineStyle={styles.inputOutline}
            left={<TextInput.Icon icon="map-clock" />}
          />
        </View>
      </Surface>
    </View>
  );

  const renderSchedule = () => (
    <View style={styles.tabContent}>
      <Surface style={styles.section} elevation={1}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons
            name="calendar-clock"
            size={24}
            color={theme.colors.primary}
          />
          <Text style={styles.sectionTitle}>Horario de Operación</Text>
        </View>

        <View style={styles.sectionContent}>
          <BusinessHoursForm
            businessHours={formData.businessHours || []}
            isEditing={isEditing}
            onChange={(hours: CreateBusinessHoursDto[]) =>
              setFormData({ ...formData, businessHours: hours })
            }
          />
        </View>
      </Surface>
    </View>
  );

  const renderDelivery = () => (
    <View style={styles.tabContent}>
      <Surface style={styles.section} elevation={1}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons
            name="map-marker-radius"
            size={24}
            color={theme.colors.primary}
          />
          <Text style={styles.sectionTitle}>Área de Cobertura</Text>
        </View>

        <View style={styles.sectionContent}>
          <View style={styles.deliveryPlaceholder}>
            <MaterialCommunityIcons
              name="map"
              size={64}
              color={theme.colors.onSurfaceVariant}
              style={{ opacity: 0.5 }}
            />
            <Text style={styles.placeholderText}>
              La configuración del área de cobertura estará disponible próximamente
            </Text>
          </View>
        </View>
      </Surface>
    </View>
  );

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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Configuración del Restaurante</Text>
          <Text style={styles.headerSubtitle}>
            Administra todos los ajustes de tu negocio
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          <SegmentedButtons
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as TabType)}
            buttons={[
              {
                value: 'basic',
                label: 'Información',
                icon: 'store',
              },
              {
                value: 'operation',
                label: 'Operación',
                icon: 'cog',
              },
              {
                value: 'schedule',
                label: 'Horarios',
                icon: 'calendar',
              },
              {
                value: 'delivery',
                label: 'Delivery',
                icon: 'moped',
              },
            ]}
            style={styles.tabs}
          />
        </ScrollView>
      </View>

      {/* Content */}
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        extraScrollHeight={100}
      >
        {activeTab === 'basic' && renderBasicInfo()}
        {activeTab === 'operation' && renderOperationConfig()}
        {activeTab === 'schedule' && renderSchedule()}
        {activeTab === 'delivery' && renderDelivery()}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {!isEditing ? (
            <Button
              mode="contained"
              onPress={() => setIsEditing(true)}
              style={[styles.editButton, { backgroundColor: theme.colors.tertiary }]}
              contentStyle={styles.editButtonContent}
              labelStyle={styles.editButtonLabel}
              icon="pencil"
              textColor={theme.colors.onTertiary}
            >
              Editar Configuración
            </Button>
          ) : (
            <View style={styles.editActions}>
              <Button
                mode="outlined"
                onPress={handleCancel}
                style={styles.cancelButton}
                contentStyle={styles.buttonContent}
              >
                Cancelar
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={updateConfigMutation.isPending}
                disabled={updateConfigMutation.isPending || !hasChanges()}
                style={styles.saveButton}
                contentStyle={styles.buttonContent}
                icon="check"
              >
                Guardar
              </Button>
            </View>
          )}
        </View>

        {/* System Info Card */}
        {config && (
          <Surface style={styles.infoCard} elevation={1}>
            <View style={styles.infoContent}>
              <MaterialCommunityIcons
                name="information-outline"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Última actualización</Text>
                <Text style={styles.infoText}>
                  {new Date(config.updatedAt).toLocaleString('es-MX', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </Text>
              </View>
            </View>
          </Surface>
        )}
      </KeyboardAwareScrollView>

      <Portal>
        <Dialog
          visible={showDiscardDialog}
          onDismiss={() => setShowDiscardDialog(false)}
        >
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

const createStyles = (theme: AppTheme, width: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      paddingBottom: theme.spacing.xl,
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
    // Header styles
    header: {
      backgroundColor: theme.colors.primaryContainer,
      paddingTop: theme.spacing.m,
      paddingBottom: theme.spacing.m,
      paddingHorizontal: theme.spacing.m,
    },
    headerContent: {
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.onPrimaryContainer,
      marginBottom: theme.spacing.xs,
    },
    headerSubtitle: {
      fontSize: 13,
      color: theme.colors.onPrimaryContainer,
      opacity: 0.8,
      textAlign: 'center',
    },
    // Tabs
    tabsContainer: {
      backgroundColor: theme.colors.background,
      paddingVertical: theme.spacing.s,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surfaceVariant,
    },
    tabsContent: {
      paddingHorizontal: theme.spacing.m,
    },
    tabs: {
      minWidth: width - theme.spacing.m * 2,
    },
    tabContent: {
      padding: theme.spacing.m,
      gap: theme.spacing.m,
    },
    // Section styles
    section: {
      borderRadius: 16,
      padding: theme.spacing.m,
      backgroundColor: theme.colors.surface,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.m,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginLeft: theme.spacing.s,
    },
    sectionContent: {
      gap: theme.spacing.m,
    },
    // Input styles
    input: {
      backgroundColor: theme.colors.surface,
    },
    inputOutline: {
      borderRadius: 12,
    },
    row: {
      flexDirection: 'row',
      gap: theme.spacing.s,
    },
    halfInput: {
      flex: 1,
    },
    // Status styles
    statusRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statusInfo: {
      flex: 1,
      marginRight: theme.spacing.m,
    },
    statusLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.xs,
    },
    statusDescription: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    // Time input styles
    timeInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.s,
    },
    timeIconWrapper: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surfaceVariant,
      justifyContent: 'center',
      alignItems: 'center',
    },
    timeInput: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    infoChip: {
      marginTop: theme.spacing.xs,
    },
    chip: {
      backgroundColor: theme.colors.secondaryContainer,
    },
    chipText: {
      fontSize: 12,
    },
    // Delivery placeholder
    deliveryPlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.xl * 2,
      gap: theme.spacing.m,
    },
    placeholderText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      opacity: 0.7,
    },
    // Action styles
    actionContainer: {
      marginHorizontal: theme.spacing.m,
      marginTop: theme.spacing.l,
    },
    editButton: {
      borderRadius: 12,
      elevation: 2,
    },
    editButtonContent: {
      paddingVertical: theme.spacing.xs,
    },
    editButtonLabel: {
      fontSize: 16,
      fontWeight: '600',
    },
    editActions: {
      flexDirection: 'row',
      gap: theme.spacing.s,
    },
    cancelButton: {
      flex: 1,
      borderRadius: 12,
    },
    saveButton: {
      flex: 1,
      borderRadius: 12,
      elevation: 2,
    },
    buttonContent: {
      paddingVertical: theme.spacing.xs,
    },
    // Info Card styles
    infoCard: {
      marginHorizontal: theme.spacing.m,
      marginTop: theme.spacing.m,
      borderRadius: 12,
      padding: theme.spacing.m,
      backgroundColor: theme.colors.surfaceVariant,
    },
    infoContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.s,
    },
    infoTextContainer: {
      flex: 1,
    },
    infoTitle: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      opacity: 0.7,
    },
    infoText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
    },
  });

export default RestaurantConfigScreen;