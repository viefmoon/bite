import { useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import {
  Modal,
  Portal,
  Text,
  Button,
  TextInput,
  Switch,
  SegmentedButtons,
  HelperText,
  ActivityIndicator,
  IconButton,
  Surface,
} from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@/app/lib/zodResolver';
import { useAppTheme } from '@/app/styles/theme';
import { useResponsive } from '@/app/hooks/useResponsive';
import {
  pizzaCustomizationFormSchema,
  PizzaCustomizationFormInputs,
} from '../schema/pizzaCustomization.schema';
import {
  usePizzaCustomization,
  useCreatePizzaCustomization,
  useUpdatePizzaCustomization,
} from '../hooks/usePizzaCustomizationsQueries';
import { CustomizationTypeEnum } from '../schema/pizzaCustomization.schema';

interface PizzaCustomizationFormModalProps {
  visible: boolean;
  onDismiss: () => void;
  customizationId?: string;
  onSuccess?: () => void;
}

const createStyles = (theme: any, responsive: any) => {
  const isTablet = responsive.isTablet;

  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: responsive.spacing(theme.spacing.m),
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: 28,
      maxHeight: isTablet ? '90%' : '85%',
      minHeight: isTablet ? 600 : undefined,
      maxWidth: isTablet ? 650 : 500,
      width: '100%',
      alignSelf: 'center',
      overflow: 'hidden',
      elevation: 24,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 12,
      },
      shadowOpacity: 0.58,
      shadowRadius: 16.0,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: responsive.spacing(theme.spacing.m),
      paddingBottom: responsive.spacing(theme.spacing.m),
      paddingHorizontal: responsive.spacing(theme.spacing.l),
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    headerTitle: {
      fontSize: responsive.fontSize(18),
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    closeButton: {
      margin: -responsive.spacing(theme.spacing.xs),
    },
    scrollContent: {
      padding: responsive.spacing(theme.spacing.l),
      paddingTop: responsive.spacing(theme.spacing.m),
    },
    formGroup: {
      marginBottom: responsive.spacing(theme.spacing.l),
    },
    label: {
      fontSize: responsive.fontSize(12),
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
      marginBottom: responsive.spacing(theme.spacing.xs),
      marginLeft: responsive.spacing(theme.spacing.xs),
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    segmentedButtons: {
      marginBottom: responsive.spacing(theme.spacing.xs),
      borderRadius: 16,
    },
    row: {
      flexDirection: 'row',
      gap: responsive.spacing(theme.spacing.m),
      marginBottom: responsive.spacing(theme.spacing.l),
    },
    halfWidth: {
      flex: 1,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: responsive.spacing(theme.spacing.m),
      paddingHorizontal: responsive.spacing(theme.spacing.l),
      backgroundColor: theme.colors.secondaryContainer,
      borderRadius: 16,
      marginBottom: responsive.spacing(theme.spacing.l),
    },
    switchLabel: {
      fontSize: responsive.fontSize(16),
      fontWeight: '500',
      color: theme.colors.onSecondaryContainer,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      padding: responsive.spacing(theme.spacing.l),
      paddingTop: responsive.spacing(theme.spacing.m),
      gap: responsive.spacing(theme.spacing.m),
      backgroundColor: theme.colors.elevation.level1,
    },
    button: {
      borderRadius: 24,
      flex: 1,
      maxWidth: isTablet ? 180 : 160,
    },
    buttonContent: {
      paddingVertical: responsive.spacing(theme.spacing.xs),
    },
    loadingContainer: {
      padding: responsive.spacing(theme.spacing.xl * 2),
      alignItems: 'center',
    },
    inputStyle: {
      backgroundColor: theme.colors.elevation.level1,
    },
    keyboardView: {
      width: '100%',
    },
    inputOutline: {
      borderRadius: 12,
    },
    buttonLabel: {
      fontSize: responsive.fontSize(16),
      fontWeight: '600',
    },
  });
};

export function PizzaCustomizationFormModal({
  visible,
  onDismiss,
  customizationId,
  onSuccess,
}: PizzaCustomizationFormModalProps) {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const isEditMode = !!customizationId;
  const styles = createStyles(theme, responsive);

  const { data: customization, isLoading: isLoadingCustomization } =
    usePizzaCustomization(customizationId || '');

  const createMutation = useCreatePizzaCustomization();
  const updateMutation = useUpdatePizzaCustomization();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<PizzaCustomizationFormInputs>({
    resolver: zodResolver(pizzaCustomizationFormSchema),
    defaultValues: {
      name: '',
      type: CustomizationTypeEnum.INGREDIENT,
      ingredients: '',
      toppingValue: 1,
      isActive: true,
      sortOrder: 100,
    },
  });

  const watchType = watch('type');

  useEffect(() => {
    if (customization && isEditMode) {
      reset({
        name: customization.name,
        type: customization.type,
        ingredients: customization.ingredients || '',
        toppingValue: customization.toppingValue,
        isActive: customization.isActive,
        sortOrder: customization.sortOrder,
      });
    } else if (!visible) {
      reset({
        name: '',
        type: CustomizationTypeEnum.INGREDIENT,
        ingredients: '',
        toppingValue: 1,
        isActive: true,
        sortOrder: 100,
      });
    }
  }, [customization, isEditMode, reset, visible]);

  // Limpiar ingredientes cuando se cambie de FLAVOR a INGREDIENT
  useEffect(() => {
    if (watchType === CustomizationTypeEnum.INGREDIENT) {
      setValue('ingredients', '');
    }
  }, [watchType, setValue]);

  const onSubmit = async (data: PizzaCustomizationFormInputs) => {
    try {
      // Asegurar que los ingredientes estén vacíos para tipo INGREDIENT
      const submissionData = {
        ...data,
        ingredients:
          data.type === CustomizationTypeEnum.INGREDIENT
            ? ''
            : data.ingredients,
      };

      if (isEditMode && customizationId) {
        await updateMutation.mutateAsync({
          id: customizationId,
          data: submissionData,
        });
      } else {
        await createMutation.mutateAsync(submissionData);
      }
      onSuccess?.();
      onDismiss();
    } catch (error) {
      // El error ya se maneja en los hooks con snackbar
    }
  };

  if (isLoadingCustomization && isEditMode) {
    return (
      <Portal>
        <Modal
          visible={visible}
          onDismiss={onDismiss}
          contentContainerStyle={styles.container}
        >
          <Pressable style={styles.backdrop} onPress={onDismiss} />
          <Surface style={styles.modalContent} elevation={5}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text
                variant="bodyLarge"
                style={{
                  marginTop: responsive.spacing(theme.spacing.m),
                  color: theme.colors.onSurfaceVariant,
                }}
              >
                Cargando personalización...
              </Text>
            </View>
          </Surface>
        </Modal>
      </Portal>
    );
  }

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.container}
      >
        <Pressable style={styles.backdrop} onPress={onDismiss} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <Surface style={styles.modalContent} elevation={5}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>
                {isEditMode ? 'Editar' : 'Nueva'} personalización
              </Text>
              <IconButton
                icon="close"
                size={20}
                onPress={onDismiss}
                iconColor={theme.colors.onSurfaceVariant}
                style={styles.closeButton}
              />
            </View>

            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nombre del producto</Text>
                <Controller
                  control={control}
                  name="name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      placeholder="Ej: Pepperoni, Hawaiana"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={!!errors.name}
                      mode="outlined"
                      outlineColor={theme.colors.outline}
                      activeOutlineColor={theme.colors.primary}
                      style={styles.inputStyle}
                      outlineStyle={styles.inputOutline}
                    />
                  )}
                />
                {errors.name && (
                  <HelperText type="error" visible={!!errors.name}>
                    {errors.name.message}
                  </HelperText>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Tipo de personalización</Text>
                <Controller
                  control={control}
                  name="type"
                  render={({ field: { onChange, value } }) => (
                    <SegmentedButtons
                      value={value}
                      onValueChange={onChange}
                      buttons={[
                        {
                          value: CustomizationTypeEnum.FLAVOR,
                          label: 'Sabor',
                          icon: 'pizza',
                          style: {
                            backgroundColor:
                              value === CustomizationTypeEnum.FLAVOR
                                ? theme.colors.primaryContainer
                                : 'transparent',
                          },
                        },
                        {
                          value: CustomizationTypeEnum.INGREDIENT,
                          label: 'Ingrediente',
                          icon: 'cheese',
                          style: {
                            backgroundColor:
                              value === CustomizationTypeEnum.INGREDIENT
                                ? theme.colors.primaryContainer
                                : 'transparent',
                          },
                        },
                      ]}
                      style={styles.segmentedButtons}
                    />
                  )}
                />
              </View>

              {watchType === CustomizationTypeEnum.FLAVOR && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Ingredientes del sabor</Text>
                  <Controller
                    control={control}
                    name="ingredients"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        placeholder="Ej: Jamón, Piña, Queso"
                        value={value || ''}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={!!errors.ingredients}
                        mode="outlined"
                        multiline
                        numberOfLines={2}
                        outlineColor={theme.colors.outline}
                        activeOutlineColor={theme.colors.primary}
                        style={styles.inputStyle}
                        outlineStyle={styles.inputOutline}
                      />
                    )}
                  />
                  {errors.ingredients && (
                    <HelperText type="error" visible={!!errors.ingredients}>
                      {errors.ingredients.message}
                    </HelperText>
                  )}
                </View>
              )}

              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>Valor del topping</Text>
                  <Controller
                    control={control}
                    name="toppingValue"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        placeholder="0"
                        value={value?.toString() || ''}
                        onChangeText={(text) => {
                          const num = parseInt(text, 10);
                          onChange(isNaN(num) ? 0 : num);
                        }}
                        onBlur={onBlur}
                        error={!!errors.toppingValue}
                        mode="outlined"
                        keyboardType="numeric"
                        outlineColor={theme.colors.outline}
                        activeOutlineColor={theme.colors.primary}
                        style={styles.inputStyle}
                        outlineStyle={styles.inputOutline}
                      />
                    )}
                  />
                  {errors.toppingValue && (
                    <HelperText type="error" visible={!!errors.toppingValue}>
                      {errors.toppingValue.message}
                    </HelperText>
                  )}
                </View>

                <View style={styles.halfWidth}>
                  <Text style={styles.label}>Orden de aparición</Text>
                  <Controller
                    control={control}
                    name="sortOrder"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        placeholder="100"
                        value={value?.toString() || ''}
                        onChangeText={(text) => {
                          const num = parseInt(text, 10);
                          onChange(isNaN(num) ? 0 : num);
                        }}
                        onBlur={onBlur}
                        error={!!errors.sortOrder}
                        mode="outlined"
                        keyboardType="numeric"
                        outlineColor={theme.colors.outline}
                        activeOutlineColor={theme.colors.primary}
                        style={styles.inputStyle}
                        outlineStyle={styles.inputOutline}
                      />
                    )}
                  />
                  {errors.sortOrder && (
                    <HelperText type="error" visible={!!errors.sortOrder}>
                      {errors.sortOrder.message}
                    </HelperText>
                  )}
                </View>
              </View>

              <Controller
                control={control}
                name="isActive"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Activo</Text>
                    <Switch
                      value={value}
                      onValueChange={onChange}
                      color={theme.colors.primary}
                    />
                  </View>
                )}
              />
            </ScrollView>

            <View style={styles.footer}>
              <Button
                mode="contained-tonal"
                onPress={onDismiss}
                disabled={
                  isSubmitting ||
                  createMutation.isPending ||
                  updateMutation.isPending
                }
                style={styles.button}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
              >
                Cancelar
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmit(onSubmit)}
                loading={
                  isSubmitting ||
                  createMutation.isPending ||
                  updateMutation.isPending
                }
                disabled={
                  isSubmitting ||
                  createMutation.isPending ||
                  updateMutation.isPending
                }
                style={[
                  styles.button,
                  { backgroundColor: theme.colors.primary },
                ]}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
                icon={isEditMode ? 'check' : 'plus'}
              >
                {isEditMode ? 'Guardar' : 'Crear'}
              </Button>
            </View>
          </Surface>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
}
