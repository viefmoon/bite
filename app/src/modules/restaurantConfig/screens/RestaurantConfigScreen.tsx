import React, { useState } from 'react';
import { Portal } from 'react-native-paper';
import {
  View,
  StyleSheet,
  useWindowDimensions,
  BackHandler,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  Switch,
  TextInput,
  Button,
  ActivityIndicator,
  Dialog,
  Surface,
  Chip,
  Icon,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import { useResponsive } from '@/app/hooks/useResponsive';
import { useRestaurantConfigQueries } from '../hooks/useRestaurantConfigQueries';
import {
  UpdateRestaurantConfigDto,
  CreateBusinessHoursDto,
} from '../types/restaurantConfig.types';
import BusinessHoursForm from '../components/BusinessHoursForm';
import TimeZoneSelector from '../components/TimeZoneSelector';
// Removed KeyboardAwareScrollView - using native KeyboardAvoidingView instead
import { WebViewDeliveryCoverageMap } from '../components/WebViewDeliveryCoverageMap';
import ConfirmationModal from '@/app/components/common/ConfirmationModal';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { useRefreshOnFocus } from '@/app/hooks/useRefreshOnFocus';

type TabType = 'basic' | 'operation' | 'schedule';

const RestaurantConfigScreen: React.FC = () => {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const { width, height } = useWindowDimensions();
  const navigation = useNavigation();
  const styles = React.useMemo(
    () => createStyles(theme, responsive, width, height),
    [theme, responsive, width, height],
  );

  const { useGetConfig, useUpdateConfig } = useRestaurantConfigQueries();
  const { data: config, isLoading, error } = useGetConfig();
  const updateConfigMutation = useUpdateConfig();
  const updateDeliveryAreaMutation = useUpdateConfig({
    successMessage: 'Área de cobertura actualizada exitosamente',
  });

  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [pendingTab, setPendingTab] = useState<TabType | null>(null);
  const [formData, setFormData] = useState<UpdateRestaurantConfigDto>({});
  const [isEditing, setIsEditing] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [isEditingDelivery, setIsEditingDelivery] = useState(false);
  const [isNavigatingAway, setIsNavigatingAway] = useState(false);
  const [businessHoursModified, setBusinessHoursModified] = useState(false);
  const [originalDeliveryArea, setOriginalDeliveryArea] = useState<any>(null);
  const [showAreaValidationModal, setShowAreaValidationModal] = useState(false);
  const [showScheduleConflictModal, setShowScheduleConflictModal] =
    useState(false);

  // Refrescar configuración cuando la pantalla recibe foco
  useRefreshOnFocus([['restaurantConfig']]);

  // Función para validar conflictos de horarios
  const hasScheduleConflicts = React.useCallback(() => {
    if (!formData.businessHours) return false;

    for (let i = 0; i < formData.businessHours.length; i++) {
      const currentDay = formData.businessHours[i];
      if (currentDay.isClosed || !currentDay.openingTime) continue;

      // Verificar si el día anterior cierra después de medianoche
      const previousDayIndex = i === 0 ? 6 : i - 1;
      const previousDay = formData.businessHours.find(
        (h) => h.dayOfWeek === previousDayIndex,
      );

      if (
        !previousDay ||
        previousDay.isClosed ||
        !previousDay.closesNextDay ||
        !previousDay.closingTime
      ) {
        continue;
      }

      // Comparar horarios
      const [currentOpenHour, currentOpenMin] = currentDay.openingTime
        .split(':')
        .map(Number);
      const [prevCloseHour, prevCloseMin] = previousDay.closingTime
        .split(':')
        .map(Number);

      const currentOpenMinutes = currentOpenHour * 60 + currentOpenMin;
      const prevCloseMinutes = prevCloseHour * 60 + prevCloseMin;

      // Si el día actual abre antes o exactamente cuando cierre el día anterior
      if (currentOpenMinutes <= prevCloseMinutes) {
        return true;
      }
    }

    return false;
  }, [formData.businessHours]);

  // Función para verificar si hay cambios sin guardar
  const hasChanges = React.useCallback(() => {
    if (!config) return false;

    // Comparación simple de campos individuales
    const simpleFieldsChanged =
      formData.restaurantName !== config.restaurantName ||
      formData.phoneMain !== config.phoneMain ||
      formData.phoneSecondary !== config.phoneSecondary ||
      formData.address !== config.address ||
      formData.city !== config.city ||
      formData.state !== config.state ||
      formData.postalCode !== config.postalCode ||
      formData.country !== config.country ||
      formData.acceptingOrders !== config.acceptingOrders ||
      formData.estimatedPickupTime !== config.estimatedPickupTime ||
      formData.estimatedDeliveryTime !== config.estimatedDeliveryTime ||
      formData.estimatedDineInTime !== config.estimatedDineInTime ||
      formData.openingGracePeriod !== config.openingGracePeriod ||
      formData.closingGracePeriod !== config.closingGracePeriod ||
      formData.timeZone !== config.timeZone;

    // Comparar área de cobertura
    const deliveryAreaChanged =
      JSON.stringify(formData.deliveryCoverageArea) !==
      JSON.stringify(config.deliveryCoverageArea);

    return simpleFieldsChanged || deliveryAreaChanged || businessHoursModified;
  }, [config, formData, businessHoursModified]);

  // Interceptar navegación cuando hay cambios sin guardar
  useFocusEffect(
    React.useCallback(() => {
      const unsubscribe = navigation.addListener('beforeRemove', (e) => {
        if (!isEditing || !hasChanges()) {
          // Si no está editando o no hay cambios, permitir navegación
          return;
        }

        // Prevenir la navegación por defecto
        e.preventDefault();

        // Mostrar el diálogo de confirmación
        setIsNavigatingAway(true);
        setShowDiscardDialog(true);
      });

      return unsubscribe;
    }, [navigation, isEditing, hasChanges]),
  );

  // Manejar botón de retroceso de Android
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (isEditing && hasChanges()) {
          setIsNavigatingAway(true);
          setShowDiscardDialog(true);
          return true; // Prevenir el comportamiento por defecto
        }
        return false;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      return () => subscription.remove();
    }, [isEditing, hasChanges]),
  );

  React.useEffect(() => {
    if (config && !isEditing) {
      // Solo actualizar formData si no estamos editando
      // Si no hay businessHours, inicializar con valores por defecto
      const initialBusinessHours =
        config.businessHours && config.businessHours.length > 0
          ? config.businessHours.map((hour) => ({
              ...hour,
              // Normalizar el formato de tiempo a HH:MM
              openingTime: hour.openingTime
                ? hour.openingTime.substring(0, 5)
                : null,
              closingTime: hour.closingTime
                ? hour.closingTime.substring(0, 5)
                : null,
            }))
          : [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
              dayOfWeek,
              openingTime: '09:00',
              closingTime: '22:00',
              isClosed: false,
            }));

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
        estimatedDineInTime: config.estimatedDineInTime,
        openingGracePeriod: config.openingGracePeriod,
        closingGracePeriod: config.closingGracePeriod,
        timeZone: config.timeZone || 'America/Mexico_City',
        // Configuración de delivery
        deliveryCoverageArea: config.deliveryCoverageArea,
        // Horarios
        businessHours: initialBusinessHours,
      });
    }
  }, [config, isEditing]);

  const handleSubmit = async () => {
    // Validar conflictos de horarios antes de guardar
    if (hasScheduleConflicts()) {
      setShowScheduleConflictModal(true);
      return;
    }

    try {
      // Formatear los datos antes de enviarlos
      const dataToSubmit = {
        ...formData,
        // Formatear businessHours para quitar los segundos
        businessHours: formData.businessHours?.map((hour) => ({
          ...hour,
          openingTime: hour.openingTime
            ? hour.openingTime.substring(0, 5)
            : null,
          closingTime: hour.closingTime
            ? hour.closingTime.substring(0, 5)
            : null,
        })),
        // deliveryCoverageArea se envía tal como está (array de coordenadas)
      };

      await updateConfigMutation.mutateAsync(dataToSubmit);
      setIsEditing(false);
      setBusinessHoursModified(false);
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  const handleSaveDeliveryArea = async () => {
    try {
      // Guardar solo el área de cobertura
      await updateDeliveryAreaMutation.mutateAsync({
        deliveryCoverageArea: formData.deliveryCoverageArea,
      });

      // Actualizar el estado del config con la nueva área
      if (config) {
        // Esto asegura que el estado local se mantenga sincronizado
        setFormData((prev) => ({
          ...prev,
          deliveryCoverageArea: formData.deliveryCoverageArea,
        }));
      }
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

  const resetForm = () => {
    if (config) {
      // Usar la misma lógica de inicialización que en useEffect
      const initialBusinessHours =
        config.businessHours && config.businessHours.length > 0
          ? config.businessHours.map((hour) => ({
              ...hour,
              // Normalizar el formato de tiempo a HH:MM
              openingTime: hour.openingTime
                ? hour.openingTime.substring(0, 5)
                : null,
              closingTime: hour.closingTime
                ? hour.closingTime.substring(0, 5)
                : null,
            }))
          : [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
              dayOfWeek,
              openingTime: '09:00',
              closingTime: '22:00',
              isClosed: false,
            }));

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
        estimatedDineInTime: config.estimatedDineInTime,
        openingGracePeriod: config.openingGracePeriod,
        closingGracePeriod: config.closingGracePeriod,
        timeZone: config.timeZone || 'America/Mexico_City',
        deliveryCoverageArea: config.deliveryCoverageArea,
        businessHours: initialBusinessHours,
      });
    }
    setIsEditing(false);
    setBusinessHoursModified(false);
  };

  const confirmDiscard = () => {
    resetForm();
    setShowDiscardDialog(false);

    // Si estaba navegando fuera de la pantalla
    if (isNavigatingAway) {
      setIsNavigatingAway(false);
      navigation.goBack();
      return;
    }

    // Si hay una pestaña pendiente, cambiar a ella
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  };

  const handleTabChange = (newTab: TabType) => {
    // Permitir cambio libre de tabs, sin importar si está editando
    setActiveTab(newTab);
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
            onChangeText={(text) =>
              setFormData({ ...formData, restaurantName: text })
            }
            mode="outlined"
            disabled={!isEditing}
            style={styles.input}
            outlineStyle={styles.inputOutline}
          />

          <TextInput
            label="Teléfono principal"
            value={formData.phoneMain || ''}
            onChangeText={(text) =>
              setFormData({ ...formData, phoneMain: text })
            }
            mode="outlined"
            disabled={!isEditing}
            style={styles.input}
            outlineStyle={styles.inputOutline}
            keyboardType="phone-pad"
            left={<TextInput.Icon icon="phone" />}
          />

          <TextInput
            label="Teléfono secundario"
            value={formData.phoneSecondary || ''}
            onChangeText={(text) =>
              setFormData({ ...formData, phoneSecondary: text })
            }
            mode="outlined"
            disabled={!isEditing}
            style={styles.input}
            outlineStyle={styles.inputOutline}
            keyboardType="phone-pad"
            left={<TextInput.Icon icon="cellphone" />}
          />

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
              onChangeText={(text) =>
                setFormData({ ...formData, postalCode: text })
              }
              mode="outlined"
              disabled={!isEditing}
              style={[styles.input, styles.halfInput]}
              outlineStyle={styles.inputOutline}
              keyboardType="numeric"
            />
            <TextInput
              label="País"
              value={formData.country || ''}
              onChangeText={(text) =>
                setFormData({ ...formData, country: text })
              }
              mode="outlined"
              disabled={!isEditing}
              style={[styles.input, styles.halfInput]}
              outlineStyle={styles.inputOutline}
            />
          </View>

          {/* Botón para área de cobertura */}
          <View style={styles.deliveryButtonContainer}>
            <Button
              mode="contained-tonal"
              onPress={() => setShowDeliveryModal(true)}
              icon="map-marker-radius"
              style={styles.deliveryButton}
              contentStyle={styles.deliveryButtonContent}
              labelStyle={styles.deliveryButtonLabel}
            >
              Área de Cobertura
            </Button>
            {formData.deliveryCoverageArea &&
            formData.deliveryCoverageArea.length > 0 ? (
              <Text style={styles.deliveryStatusText}>
                Área de cobertura definida
              </Text>
            ) : (
              <Text
                style={[
                  styles.deliveryStatusText,
                  styles.deliveryStatusWarning,
                ]}
              >
                Sin área de cobertura definida
              </Text>
            )}
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
              onValueChange={(value) =>
                setFormData({ ...formData, acceptingOrders: value })
              }
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
                name="silverware-fork-knife"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            </View>
            <TextInput
              label="Para comer en el local"
              value={formData.estimatedDineInTime?.toString() || ''}
              onChangeText={(text) =>
                setFormData({
                  ...formData,
                  estimatedDineInTime: parseInt(text) || 0,
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
          <TimeZoneSelector
            value={formData.timeZone || 'America/Mexico_City'}
            onChange={(timezone) => {
              setFormData({ ...formData, timeZone: timezone });
            }}
            disabled={!isEditing}
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
            onChange={(hours: CreateBusinessHoursDto[]) => {
              setFormData((prev) => ({ ...prev, businessHours: hours }));
              setBusinessHoursModified(true);
            }}
          />
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
      {/* Tabs */}
      <View style={styles.header}>
        <View style={styles.tabsContainer}>
          <Pressable
            style={[styles.tab, activeTab === 'basic' && styles.tabActive]}
            onPress={() => handleTabChange('basic')}
          >
            <Icon
              source="store"
              size={20}
              color={
                activeTab === 'basic'
                  ? theme.colors.primary
                  : theme.colors.onSurfaceVariant
              }
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'basic' && styles.tabTextActive,
              ]}
            >
              Información
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tab, activeTab === 'operation' && styles.tabActive]}
            onPress={() => handleTabChange('operation')}
          >
            <Icon
              source="cog"
              size={20}
              color={
                activeTab === 'operation'
                  ? theme.colors.primary
                  : theme.colors.onSurfaceVariant
              }
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'operation' && styles.tabTextActive,
              ]}
            >
              Operación
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tab, activeTab === 'schedule' && styles.tabActive]}
            onPress={() => handleTabChange('schedule')}
          >
            <Icon
              source="calendar"
              size={20}
              color={
                activeTab === 'schedule'
                  ? theme.colors.primary
                  : theme.colors.onSurfaceVariant
              }
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'schedule' && styles.tabTextActive,
              ]}
            >
              Horarios
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {activeTab === 'basic' && renderBasicInfo()}
          {activeTab === 'operation' && renderOperationConfig()}
          {activeTab === 'schedule' && renderSchedule()}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        {!isEditing ? (
          <Button
            mode="contained"
            onPress={() => {
              setIsEditing(true);
              setBusinessHoursModified(false);
            }}
            style={[
              styles.editButton,
              { backgroundColor: theme.colors.tertiary },
            ]}
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
              disabled={updateConfigMutation.isPending}
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
                  timeZone: config.timeZone || 'America/Mexico_City',
                })}
              </Text>
            </View>
          </View>
        </Surface>
      )}

      <ConfirmationModal
        visible={showDiscardDialog}
        title="Descartar cambios"
        message="¿Estás seguro de que deseas descartar los cambios realizados?"
        onConfirm={confirmDiscard}
        onCancel={() => {
          setShowDiscardDialog(false);
          setIsNavigatingAway(false);
          setPendingTab(null);
        }}
        confirmText="Descartar"
        cancelText="Continuar editando"
        confirmButtonColor={theme.colors.error}
      />

      {/* Modal de Área de Cobertura */}
      <Portal>
        <Dialog
          visible={showDeliveryModal}
          onDismiss={() => {
            if (!updateDeliveryAreaMutation.isPending) {
              if (isEditingDelivery) {
                setFormData({
                  ...formData,
                  deliveryCoverageArea: originalDeliveryArea,
                });
              }
              setShowDeliveryModal(false);
              setIsEditingDelivery(false);
            }
          }}
          style={styles.deliveryDialog}
        >
          <Dialog.Content style={styles.deliveryDialogContent}>
            <Surface style={styles.deliveryMapWrapper} elevation={1}>
              <View style={styles.deliveryMapContainer}>
                <WebViewDeliveryCoverageMap
                  key={`coverage-map-${isEditingDelivery}`}
                  initialPolygon={formData.deliveryCoverageArea}
                  isEditing={isEditingDelivery}
                  onChange={(polygon) =>
                    setFormData({ ...formData, deliveryCoverageArea: polygon })
                  }
                  restaurantLocation={{
                    latitude: 20.5425,
                    longitude: -102.7935,
                  }}
                />
              </View>
            </Surface>
          </Dialog.Content>
          <View style={styles.deliveryDialogActions}>
            <View style={styles.deliveryDialogButtonsContainer}>
              {!isEditingDelivery ? (
                <>
                  <Button
                    onPress={() => setShowDeliveryModal(false)}
                    mode="outlined"
                    style={styles.deliveryDialogButton}
                    contentStyle={styles.deliveryButtonContent}
                    labelStyle={styles.cancelButtonLabel}
                  >
                    Cerrar
                  </Button>
                  <Button
                    onPress={() => {
                      setOriginalDeliveryArea(formData.deliveryCoverageArea);
                      setIsEditingDelivery(true);
                    }}
                    icon="pencil"
                    mode="contained"
                    style={styles.deliveryDialogButton}
                    contentStyle={styles.deliveryButtonContent}
                    labelStyle={styles.deliveryButtonLabel}
                  >
                    Editar
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onPress={() => {
                      setFormData({
                        ...formData,
                        deliveryCoverageArea: originalDeliveryArea,
                      });
                      setIsEditingDelivery(false);
                    }}
                    mode="outlined"
                    style={styles.deliveryDialogButton}
                    contentStyle={styles.deliveryButtonContent}
                    labelStyle={styles.cancelButtonLabel}
                    disabled={updateDeliveryAreaMutation.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onPress={async () => {
                      // Validar que haya al menos 3 puntos
                      if (
                        !formData.deliveryCoverageArea ||
                        formData.deliveryCoverageArea.length < 3
                      ) {
                        setShowAreaValidationModal(true);
                        return;
                      }

                      setIsEditingDelivery(false);
                      // Guardar el área de cobertura inmediatamente
                      await handleSaveDeliveryArea();
                      setShowDeliveryModal(false);
                    }}
                    mode="contained"
                    icon="check"
                    style={styles.deliveryDialogButton}
                    contentStyle={styles.deliveryButtonContent}
                    labelStyle={styles.deliveryButtonLabel}
                    loading={updateDeliveryAreaMutation.isPending}
                    disabled={updateDeliveryAreaMutation.isPending}
                  >
                    Guardar
                  </Button>
                </>
              )}
            </View>
          </View>
        </Dialog>
      </Portal>

      {/* Modal de validación de área */}
      <Portal>
        <Dialog
          visible={showAreaValidationModal}
          onDismiss={() => setShowAreaValidationModal(false)}
          style={styles.validationDialog}
        >
          <View style={styles.validationIconContainer}>
            <Surface style={styles.validationIconWrapper} elevation={0}>
              <MaterialCommunityIcons
                name="map-marker-alert"
                size={36}
                color={theme.colors.error}
              />
            </Surface>
          </View>
          <Dialog.Title style={styles.validationTitle}>
            Área incompleta
          </Dialog.Title>
          <Dialog.Content>
            <Text style={styles.validationMessage}>
              Se requieren al menos 3 puntos para definir un área de cobertura
              válida.
            </Text>
            <Text style={styles.validationHint}>
              Haz clic en el mapa para agregar más puntos o usa el botón de
              dibujar.
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={styles.validationActions}>
            <Button
              onPress={() => setShowAreaValidationModal(false)}
              mode="contained"
              style={styles.validationButton}
              contentStyle={styles.validationButtonContent}
              labelStyle={styles.validationButtonLabel}
            >
              Entendido
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Modal de conflicto de horarios */}
      <Portal>
        <Dialog
          visible={showScheduleConflictModal}
          onDismiss={() => setShowScheduleConflictModal(false)}
          style={styles.validationDialog}
        >
          <View style={styles.validationIconContainer}>
            <Surface style={styles.validationIconWrapper} elevation={0}>
              <MaterialCommunityIcons
                name="clock-alert"
                size={36}
                color={theme.colors.error}
              />
            </Surface>
          </View>
          <Dialog.Title style={styles.validationTitle}>
            Conflicto de horarios
          </Dialog.Title>
          <Dialog.Content>
            <Text style={styles.validationMessage}>
              Hay conflictos en los horarios de operación. Un día no puede abrir
              antes o al mismo tiempo que cierre el día anterior.
            </Text>
            <Text style={styles.validationHint}>
              Debe haber al menos 1 minuto de diferencia entre el cierre y la
              siguiente apertura. Revisa los horarios marcados con advertencia.
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={styles.validationActions}>
            <Button
              onPress={() => setShowScheduleConflictModal(false)}
              mode="contained"
              style={styles.validationButton}
              contentStyle={styles.validationButtonContent}
              labelStyle={styles.validationButtonLabel}
            >
              Revisar horarios
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const createStyles = (
  theme: AppTheme,
  responsive: any,
  width: number,
  height: number,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      paddingBottom: responsive.spacing(theme.spacing.xl),
    },
    deliveryContent: {
      flex: 1,
      paddingHorizontal: responsive.spacing(theme.spacing.m),
      paddingTop: responsive.spacing(theme.spacing.m),
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
      padding: responsive.spacing(theme.spacing.xl),
    },
    errorText: {
      fontSize: responsive.fontSize(16),
      color: theme.colors.error,
      textAlign: 'center',
    },
    // Header y Tabs
    header: {
      backgroundColor: theme.colors.elevation.level2,
      elevation: 0,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    tabsContainer: {
      flexDirection: 'row',
      height: responsive.scaleHeight(48),
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: responsive.spacing(theme.spacing.m),
      gap: responsive.spacing(theme.spacing.xs),
    },
    tabActive: {
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.primary,
    },
    tabText: {
      fontSize: responsive.fontSize(14),
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
    },
    tabTextActive: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    tabContent: {
      padding: responsive.spacing(theme.spacing.m),
      gap: responsive.spacing(theme.spacing.m),
    },
    // Section styles
    section: {
      borderRadius: 16,
      padding: responsive.spacing(theme.spacing.m),
      backgroundColor: theme.colors.surface,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: responsive.spacing(theme.spacing.m),
    },
    sectionTitle: {
      fontSize: responsive.fontSize(18),
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginLeft: responsive.spacing(theme.spacing.s),
    },
    sectionContent: {
      gap: responsive.spacing(theme.spacing.m),
    },
    deliveryInfo: {
      paddingHorizontal: responsive.spacing(theme.spacing.m),
      marginBottom: responsive.spacing(theme.spacing.s),
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
      gap: responsive.spacing(theme.spacing.s),
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
      marginRight: responsive.spacing(theme.spacing.m),
    },
    statusLabel: {
      fontSize: responsive.fontSize(16),
      fontWeight: '500',
      color: theme.colors.onSurface,
      marginBottom: responsive.spacing(theme.spacing.xs),
    },
    statusDescription: {
      fontSize: responsive.fontSize(14),
      color: theme.colors.onSurfaceVariant,
    },
    // Time input styles
    timeInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: responsive.spacing(theme.spacing.s),
    },
    timeIconWrapper: {
      width: responsive.scaleWidth(40),
      height: responsive.scaleWidth(40),
      borderRadius: responsive.scaleWidth(20),
      backgroundColor: theme.colors.surfaceVariant,
      justifyContent: 'center',
      alignItems: 'center',
    },
    timeInput: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    infoChip: {
      marginTop: responsive.spacing(theme.spacing.xs),
    },
    chip: {
      backgroundColor: theme.colors.secondaryContainer,
    },
    chipText: {
      fontSize: responsive.fontSize(12),
    },
    // Delivery styles
    deliveryInfo: {
      marginTop: responsive.spacing(theme.spacing.m),
      alignItems: 'center',
    },
    // Action styles
    actionContainer: {
      marginHorizontal: responsive.spacing(theme.spacing.m),
      marginTop: responsive.spacing(theme.spacing.l),
      alignItems: 'center',
    },
    editButton: {
      borderRadius: 12,
      elevation: 2,
      alignSelf: 'stretch',
    },
    editButtonContent: {
      paddingVertical: responsive.spacing(theme.spacing.xs),
    },
    editButtonLabel: {
      fontSize: responsive.fontSize(16),
      fontWeight: '600',
    },
    editActions: {
      flexDirection: 'row',
      gap: responsive.spacing(theme.spacing.l),
      width: '100%',
      justifyContent: 'center',
      paddingHorizontal: responsive.spacing(theme.spacing.m),
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
      paddingVertical: responsive.spacing(theme.spacing.xs),
    },
    // Info Card styles
    infoCard: {
      marginHorizontal: responsive.spacing(theme.spacing.m),
      marginTop: responsive.spacing(theme.spacing.m),
      borderRadius: 12,
      padding: responsive.spacing(theme.spacing.m),
      backgroundColor: theme.colors.surfaceVariant,
    },
    infoContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: responsive.spacing(theme.spacing.s),
    },
    infoTextContainer: {
      flex: 1,
    },
    infoTitle: {
      fontSize: responsive.fontSize(12),
      color: theme.colors.onSurfaceVariant,
      opacity: 0.7,
    },
    infoText: {
      fontSize: responsive.fontSize(14),
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
    },
    deliveryContainer: {
      flex: 1,
      paddingHorizontal: responsive.spacing(theme.spacing.m),
      paddingTop: responsive.spacing(theme.spacing.m),
    },
    deliveryActions: {
      position: 'absolute',
      bottom: 16,
      right: 16,
    },
    deliveryFab: {
      position: 'absolute',
      bottom: 0,
      right: 0,
    },
    deliveryFabSmall: {
      position: 'absolute',
      right: 0,
    },
    mapSection: {
      paddingHorizontal: responsive.spacing(theme.spacing.m),
      paddingBottom: responsive.spacing(theme.spacing.m),
    },
    // Estilos para el botón de área de cobertura
    deliveryButtonContainer: {
      marginTop: responsive.spacing(theme.spacing.l),
      alignItems: 'center',
    },
    deliveryButton: {
      borderRadius: 12,
      width: '100%',
    },
    deliveryButtonContent: {
      paddingVertical: responsive.spacing(theme.spacing.s),
    },
    deliveryButtonLabel: {
      fontSize: responsive.fontSize(16),
      fontWeight: '500',
    },
    deliveryStatusText: {
      fontSize: responsive.fontSize(12),
      color: theme.colors.onSurfaceVariant,
      marginTop: responsive.spacing(theme.spacing.xs),
      fontStyle: 'italic',
    },
    deliveryStatusWarning: {
      color: theme.colors.error,
    },
    // Estilos para el modal
    deliveryDialog: {
      maxWidth: width * 0.95,
      width: width * 0.95,
      maxHeight: height * 0.9,
      alignSelf: 'center',
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
    },
    deliveryDialogContent: {
      paddingHorizontal: responsive.spacing(theme.spacing.m),
      paddingTop: responsive.spacing(theme.spacing.m),
      paddingBottom: responsive.spacing(theme.spacing.m),
    },
    deliveryMapWrapper: {
      borderRadius: 12,
      padding: responsive.spacing(theme.spacing.xs),
      backgroundColor: theme.colors.surfaceVariant,
    },
    deliveryMapContainer: {
      height: height * 0.65,
      width: '100%',
      borderRadius: 8,
      overflow: 'hidden',
    },
    deliveryDialogActions: {
      paddingHorizontal: responsive.spacing(theme.spacing.m),
      paddingVertical: responsive.spacing(theme.spacing.m),
      paddingBottom: responsive.spacing(theme.spacing.l),
    },
    deliveryDialogButtonsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: responsive.spacing(theme.spacing.m),
    },
    deliveryDialogButton: {
      flex: 1,
      borderRadius: 12,
    },
    deliveryButtonContent: {
      paddingVertical: responsive.spacing(theme.spacing.s),
    },
    deliveryButtonLabel: {
      fontSize: responsive.fontSize(16),
      fontWeight: '600',
    },
    cancelButtonLabel: {
      fontSize: responsive.fontSize(16),
      fontWeight: '500',
      color: theme.colors.onSurface,
    },
    // Estilos para el modal de validación
    validationDialog: {
      borderRadius: 24,
      backgroundColor: theme.colors.surface,
      maxWidth: 340,
      width: '85%',
      alignSelf: 'center',
      paddingVertical: 0,
    },
    validationIconContainer: {
      alignItems: 'center',
      marginTop: responsive.spacing(theme.spacing.m),
      marginBottom: responsive.spacing(theme.spacing.s),
    },
    validationIconWrapper: {
      width: responsive.scaleWidth(64),
      height: responsive.scaleWidth(64),
      borderRadius: responsive.scaleWidth(32),
      backgroundColor: theme.colors.errorContainer,
      justifyContent: 'center',
      alignItems: 'center',
    },
    validationTitle: {
      textAlign: 'center',
      fontSize: responsive.fontSize(18),
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: responsive.spacing(theme.spacing.xs),
      paddingHorizontal: responsive.spacing(theme.spacing.m),
    },
    validationMessage: {
      textAlign: 'center',
      fontSize: responsive.fontSize(15),
      color: theme.colors.onSurface,
      marginBottom: responsive.spacing(theme.spacing.s),
      lineHeight: responsive.fontSize(21),
      paddingHorizontal: responsive.spacing(theme.spacing.s),
    },
    validationHint: {
      textAlign: 'center',
      fontSize: responsive.fontSize(13),
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
      lineHeight: responsive.fontSize(18),
      paddingHorizontal: responsive.spacing(theme.spacing.s),
    },
    validationActions: {
      paddingBottom: responsive.spacing(theme.spacing.m),
      paddingHorizontal: responsive.spacing(theme.spacing.m),
      paddingTop: responsive.spacing(theme.spacing.xs),
    },
    validationButton: {
      borderRadius: 12,
      minWidth: 120,
    },
    validationButtonContent: {
      paddingVertical: responsive.spacing(theme.spacing.s),
    },
    validationButtonLabel: {
      fontSize: responsive.fontSize(16),
      fontWeight: '600',
    },
  });

export default RestaurantConfigScreen;
