import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  StyleProp,
  ViewStyle,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Switch,
  HelperText,
  ActivityIndicator,
} from 'react-native-paper';
import {
  useForm,
  Controller,
  SubmitHandler,
  FieldValues,
  Path,
  UseFormReturn,
  DeepPartial,
  DefaultValues,
  Control,
  FieldError, // Importar FieldError
} from 'react-hook-form';
import { zodResolver } from '@/app/lib/zodResolver';
import { z } from 'zod';
import { useAppTheme, AppTheme } from '../../styles/theme';
import CustomImagePicker, { FileObject } from '../common/CustomImagePicker';
import {
  ImageUploadService,
  EntityWithOptionalPhoto,
} from '../../lib/imageUploadService';
import { ResponsiveModal } from '../responsive/ResponsiveModal';
import { useResponsive } from '../../hooks/useResponsive';

type FieldType =
  | 'text'
  | 'textarea'
  | 'switch'
  | 'number'
  | 'email'
  | 'password';

export interface FormFieldConfig<TFormData extends FieldValues> {
  name: Path<TFormData>;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  defaultValue?: any;
  inputProps?: any;
  switchProps?: Partial<React.ComponentProps<typeof Switch>>;
  numberOfLines?: number;
  switchLabel?: string;
}

export interface ImagePickerConfig<TFormData extends FieldValues> {
  imageUriField: Path<TFormData>;
  onImageUpload: (file: FileObject) => Promise<{ id: string } | null>;
  determineFinalPhotoId?: (
    currentImageUri: string | null,
    editingItem: EntityWithOptionalPhoto | undefined,
  ) => string | null | undefined;
  imagePickerSize?: number;
  placeholderIcon?: string;
  placeholderText?: string;
}

interface GenericFormModalProps<
  TFormData extends FieldValues,
  TItem extends { id: string },
> {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (
    data: TFormData,
    photoId: string | null | undefined,
  ) => Promise<void>;
  formSchema: z.ZodType<TFormData>;
  formFields: FormFieldConfig<TFormData>[];
  imagePickerConfig?: ImagePickerConfig<TFormData>;
  initialValues?: DeepPartial<TFormData>;
  editingItem: (TItem & Partial<EntityWithOptionalPhoto>) | null;
  isSubmitting: boolean;
  modalTitle: (isEditing: boolean) => string;
  submitButtonLabel?: (isEditing: boolean) => string;
  cancelButtonLabel?: string;
  modalStyle?: StyleProp<ViewStyle>;
  formContainerStyle?: StyleProp<ViewStyle>;
  onFileSelected?: (file: FileObject | null) => void;
}

// Componente separado para manejar campos numéricos correctamente
interface NumericInputProps {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  onBlur: () => void;
  label: string;
  placeholder?: string;
  keyboardType?: any; // Permitir cualquier KeyboardTypeOptions
  error?: boolean;
  disabled?: boolean;
  inputProps?: any;
}

const NumericInput = ({
  value,
  onChange,
  onBlur,
  label,
  placeholder,
  keyboardType = 'decimal-pad',
  error,
  disabled,
  inputProps,
}: NumericInputProps) => {
  const [inputValue, setInputValue] = useState<string>(
    value === null || value === undefined ? '' : String(value),
  );

  useEffect(() => {
    const stringValue =
      value === null || value === undefined ? '' : String(value);
    if (stringValue !== inputValue) {
      const numericValueFromInput = parseFloat(inputValue);
      if (
        !(inputValue.endsWith('.') && numericValueFromInput === value) &&
        !(inputValue === '.' && value === null)
      ) {
        setInputValue(stringValue);
      }
    }
  }, [value, inputValue]);

  const theme = useAppTheme();
  const responsive = useResponsive();
  const styles = getStyles(theme, responsive);

  return (
    <TextInput
      label={label}
      value={inputValue}
      onChangeText={(text) => {
        const formattedText = text.replace(/,/g, '.');
        if (/^(\d*\.?\d*)$/.test(formattedText)) {
          setInputValue(formattedText);

          if (formattedText === '' || formattedText === '.') {
            if (value !== null) onChange(null);
          } else {
            const numericValue = parseFloat(formattedText);
            if (!isNaN(numericValue) && numericValue !== value) {
              onChange(numericValue);
            } else if (isNaN(numericValue) && value !== null) {
              onChange(null);
            }
          }
        }
      }}
      onBlur={onBlur}
      mode="outlined"
      style={styles.input}
      placeholder={placeholder}
      keyboardType={keyboardType}
      error={error}
      disabled={disabled}
      {...inputProps}
    />
  );
};

const getDefaultValueForType = (
  type: FieldType,
): string | number | boolean | null | undefined => {
  switch (type) {
    case 'text':
    case 'textarea':
    case 'email':
    case 'password':
      return '';
    case 'number':
      return null;
    case 'switch':
      return false;
    default:
      return undefined;
  }
};

const getStyles = (
  theme: AppTheme,
  responsive: ReturnType<typeof useResponsive>,
) =>
  StyleSheet.create({
    modalSurface: {
      padding: 0,
      margin: responsive.spacing(20),
      marginHorizontal: responsive.isTablet
        ? responsive.spacing(40)
        : responsive.spacing(20),
      borderRadius: theme.roundness * 2,
      elevation: 4,
      backgroundColor: theme.colors.background,
      maxHeight: responsive.isTablet ? '92%' : '90%',
      maxWidth: responsive.isTablet ? 600 : 500,
      alignSelf: 'center',
      width: responsive.isTablet ? '85%' : '90%',
      overflow: 'hidden',
    },
    modalHeader: {
      backgroundColor: theme.colors.primary,
      paddingVertical: responsive.isTablet
        ? responsive.spacing(theme.spacing.s)
        : responsive.spacing(theme.spacing.m),
      paddingHorizontal: responsive.isTablet
        ? responsive.spacing(theme.spacing.m)
        : responsive.spacing(theme.spacing.l),
    },
    formContainer: {
      maxHeight: '100%',
    },
    scrollViewContent: {
      padding: responsive.isTablet
        ? responsive.spacing(theme.spacing.m)
        : responsive.spacing(theme.spacing.l),
      paddingBottom: responsive.isTablet
        ? responsive.spacing(theme.spacing.l)
        : responsive.spacing(theme.spacing.xl),
    },
    modalTitle: {
      color: theme.colors.onPrimary,
      fontWeight: '700',
      textAlign: 'center',
    },
    input: {
      marginBottom: responsive.isTablet
        ? responsive.spacing(theme.spacing.s)
        : responsive.spacing(theme.spacing.m),
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.roundness,
    },
    switchLabel: {
      color: theme.colors.onSurfaceVariant,
      marginRight: responsive.spacing(theme.spacing.m),
      fontSize: responsive.isTablet ? 14 : 16,
      flexShrink: 1,
    },
    switchComponentContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      marginBottom: responsive.spacing(theme.spacing.m),
      paddingVertical: responsive.spacing(theme.spacing.s),
    },
    imagePickerContainer: {
      alignItems: 'center',
      marginBottom: responsive.spacing(theme.spacing.l),
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'center',
      paddingTop: responsive.isTablet
        ? responsive.spacing(theme.spacing.m)
        : responsive.spacing(theme.spacing.l),
      paddingBottom: responsive.isTablet
        ? responsive.spacing(theme.spacing.l)
        : responsive.spacing(theme.spacing.xl),
      paddingHorizontal: responsive.isTablet
        ? responsive.spacing(theme.spacing.m)
        : responsive.spacing(theme.spacing.l),
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      gap: responsive.isTablet
        ? responsive.spacing(theme.spacing.s)
        : responsive.spacing(theme.spacing.m),
      minHeight: responsive.isTablet ? 70 : 80,
    },
    formButton: {
      borderRadius: theme.roundness,
      paddingHorizontal: responsive.spacing(theme.spacing.m),
      flex: 1,
      maxWidth: 200,
      minWidth: responsive.isTablet ? 120 : 140,
    },
    cancelButton: {},
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: theme.roundness * 2,
      zIndex: 10,
    },
    helperText: {
      marginTop: -responsive.spacing(theme.spacing.s),
      marginBottom: responsive.spacing(theme.spacing.s),
    },
  });

const GenericFormModal = <
  TFormData extends FieldValues,
  TItem extends { id: string },
>({
  visible,
  onDismiss,
  onSubmit,
  formSchema,
  formFields,
  imagePickerConfig,
  initialValues,
  editingItem,
  isSubmitting: isParentSubmitting,
  modalTitle,
  submitButtonLabel = (isEditing: boolean) => (isEditing ? 'Guardar' : 'Crear'),
  cancelButtonLabel = 'Cancelar',
  modalStyle,
  formContainerStyle,
  onFileSelected,
}: GenericFormModalProps<TFormData, TItem>) => {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const styles = useMemo(
    () => getStyles(theme, responsive),
    [theme, responsive],
  );
  const [isInternalImageUploading, setIsInternalImageUploading] =
    useState(false);
  const [localSelectedFile, setLocalSelectedFile] = useState<FileObject | null>(
    null,
  );
  const prevVisibleRef = useRef(visible);
  const prevEditingItemIdRef = useRef(editingItem?.id);

  const isEditing = !!editingItem;
  const isActuallySubmitting = isParentSubmitting || isInternalImageUploading;

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    getValues: _getValues,
    formState: { errors },
  }: UseFormReturn<TFormData> = useForm<TFormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: useMemo((): DefaultValues<TFormData> => {
      const defaults = formFields.reduce(
        (acc: DefaultValues<TFormData>, field) => {
          acc[field.name] =
            field.defaultValue ?? getDefaultValueForType(field.type);
          return acc;
        },
        {} as DefaultValues<TFormData>,
      );
      return { ...defaults, ...(initialValues as DefaultValues<TFormData>) };
    }, [formFields, initialValues]),
  });

  const watchedImageUri = imagePickerConfig
    ? watch(imagePickerConfig.imageUriField)
    : undefined;
  const currentImageUri =
    typeof watchedImageUri === 'string' ? watchedImageUri : null;

  useEffect(() => {
    const loadInitialData = async () => {
      const justOpened = visible && !prevVisibleRef.current;
      const itemChanged =
        visible && editingItem?.id !== prevEditingItemIdRef.current;

      if (visible) {
        const defaultFormValues = formFields.reduce(
          (acc: DefaultValues<TFormData>, field) => {
            acc[field.name] =
              field.defaultValue ?? getDefaultValueForType(field.type);
            return acc;
          },
          {} as DefaultValues<TFormData>,
        );

        const resetValues = {
          ...defaultFormValues,
          ...(initialValues as DefaultValues<TFormData>),
        };

        reset(resetValues, { keepDirtyValues: !justOpened && !itemChanged });

        if (justOpened || itemChanged) {
          setLocalSelectedFile(null);
          onFileSelected?.(null);
          setIsInternalImageUploading(false);
        }
      }

      prevVisibleRef.current = visible;
      prevEditingItemIdRef.current = editingItem?.id;
    };

    loadInitialData();
  }, [
    visible,
    editingItem?.id,
    reset,
    formFields,
    initialValues,
    onFileSelected,
    imagePickerConfig,
  ]);

  const handleImageSelected = useCallback(
    (uri: string, file: FileObject) => {
      if (imagePickerConfig) {
        const fieldName = imagePickerConfig.imageUriField;
        setValue(fieldName, uri as any, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
        setLocalSelectedFile(file);
        onFileSelected?.(file);
      }
    },
    [setValue, imagePickerConfig, onFileSelected],
  );

  const handleImageRemoved = useCallback(() => {
    if (imagePickerConfig) {
      setValue(imagePickerConfig.imageUriField, null as any, {
        shouldValidate: true,
      });
      setLocalSelectedFile(null);
      onFileSelected?.(null);
    }
  }, [setValue, imagePickerConfig, onFileSelected]);

  const processSubmit: SubmitHandler<TFormData> = async (formData) => {
    if (isActuallySubmitting) return;

    let finalPhotoId: string | null | undefined = undefined;

    if (imagePickerConfig) {
      const formImageUri = imagePickerConfig.imageUriField
        ? formData[imagePickerConfig.imageUriField]
        : null;

      const isNewLocalImage =
        typeof formImageUri === 'string' && formImageUri.startsWith('file://');
      if (isNewLocalImage && localSelectedFile) {
        setIsInternalImageUploading(true);
        try {
          const uploadResult =
            await imagePickerConfig.onImageUpload(localSelectedFile);
          if (uploadResult?.id) {
            finalPhotoId = uploadResult.id;
          } else {
            throw new Error('La subida de la imagen no devolvió un ID.');
          }
        } catch (error) {
          Alert.alert(
            'Error',
            `No se pudo subir la imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          );
          setIsInternalImageUploading(false);
          return;
        } finally {
          setIsInternalImageUploading(false);
        }
      } else {
        const determineFn =
          imagePickerConfig.determineFinalPhotoId ??
          ImageUploadService.determinePhotoId;
        const entityForPhotoCheck = editingItem ?? undefined;
        finalPhotoId = await determineFn(formImageUri, entityForPhotoCheck);
      }
    }

    await onSubmit(formData, finalPhotoId);
  };

  const renderFormField = (fieldConfig: FormFieldConfig<TFormData>) => {
    const fieldName = fieldConfig.name;
    const fieldError = errors[fieldName] as FieldError | undefined;
    const errorMessage = fieldError?.message;

    switch (fieldConfig.type) {
      case 'textarea':
      case 'text':
      case 'number':
      case 'email':
      case 'password':
        return (
          <View key={String(fieldName)}>
            {/* Controller para campos numéricos con manejo de string local y decimales */}
            <Controller
              name={fieldName}
              control={control as Control<FieldValues>}
              render={({ field: { onChange, onBlur, value } }) => {
                if (fieldConfig.type === 'number') {
                  return (
                    <NumericInput
                      value={value}
                      onChange={onChange}
                      onBlur={onBlur}
                      label={fieldConfig.label}
                      placeholder={fieldConfig.placeholder}
                      keyboardType={
                        fieldConfig.inputProps?.keyboardType ?? 'decimal-pad'
                      }
                      error={!!errorMessage}
                      disabled={isActuallySubmitting}
                      inputProps={fieldConfig.inputProps}
                    />
                  );
                } else {
                  return (
                    <TextInput
                      label={fieldConfig.label}
                      value={value ?? ''}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      mode="outlined"
                      style={styles.input}
                      placeholder={fieldConfig.placeholder}
                      secureTextEntry={fieldConfig.type === 'password'}
                      keyboardType={
                        fieldConfig.type === 'email'
                          ? 'email-address'
                          : 'default'
                      }
                      multiline={fieldConfig.type === 'textarea'}
                      numberOfLines={
                        fieldConfig.numberOfLines ??
                        (fieldConfig.type === 'textarea' ? 3 : 1)
                      }
                      error={!!errorMessage}
                      disabled={isActuallySubmitting}
                      {...fieldConfig.inputProps}
                    />
                  );
                }
              }}
            />
            {errorMessage && (
              <HelperText
                type="error"
                visible={!!errorMessage}
                style={styles.helperText}
              >
                {errorMessage}
              </HelperText>
            )}
          </View>
        );
      case 'switch':
        return (
          <View key={String(fieldName)} style={styles.switchComponentContainer}>
            <Text variant="bodyLarge" style={styles.switchLabel}>
              {fieldConfig.switchLabel ?? fieldConfig.label}
            </Text>
            <Controller
              name={fieldName}
              control={control as Control<FieldValues>}
              render={({ field: { onChange, value } }) => (
                <Switch
                  value={value}
                  onValueChange={onChange}
                  disabled={isActuallySubmitting}
                  style={{ transform: [{ scaleX: 1.5 }, { scaleY: 1.5 }] }}
                  {...fieldConfig.switchProps}
                />
              )}
            />
            {errorMessage && (
              <HelperText
                type="error"
                visible={!!errorMessage}
                style={styles.helperText}
              >
                {errorMessage}
              </HelperText>
            )}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <ResponsiveModal
      visible={visible}
      onDismiss={onDismiss}
      title={modalTitle(isEditing)}
      dismissable={!isActuallySubmitting}
      scrollable={false}
      style={modalStyle}
      contentContainerStyle={styles.modalSurface}
      footer={
        <View style={styles.modalActions}>
          <Button
            mode="outlined"
            onPress={onDismiss}
            style={[styles.formButton, styles.cancelButton]}
            disabled={isActuallySubmitting}
          >
            {cancelButtonLabel}
          </Button>
          <Button
            mode="contained"
            onPress={() => {
              handleSubmit(processSubmit)();
            }}
            loading={isActuallySubmitting}
            disabled={isActuallySubmitting}
            style={styles.formButton}
          >
            {submitButtonLabel(isEditing)}
          </Button>
        </View>
      }
    >
      <View style={[styles.formContainer, formContainerStyle]}>
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          {imagePickerConfig && (
            <View style={styles.imagePickerContainer}>
              <CustomImagePicker
                value={currentImageUri}
                onImageSelected={handleImageSelected}
                onImageRemoved={handleImageRemoved}
                isLoading={isInternalImageUploading}
                disabled={isParentSubmitting}
                size={
                  imagePickerConfig.imagePickerSize ??
                  responsive.getResponsiveDimension(150, 200)
                }
                placeholderIcon={imagePickerConfig.placeholderIcon}
                placeholderText={imagePickerConfig.placeholderText}
              />
              {(
                errors[imagePickerConfig.imageUriField] as
                  | FieldError
                  | undefined
              )?.message && (
                <HelperText
                  type="error"
                  visible={!!errors[imagePickerConfig.imageUriField]}
                  style={styles.helperText}
                >
                  {
                    (
                      errors[imagePickerConfig.imageUriField] as
                        | FieldError
                        | undefined
                    )?.message
                  }
                </HelperText>
              )}
            </View>
          )}

          {formFields.map(renderFormField)}
        </ScrollView>

        {isActuallySubmitting && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator
              animating={true}
              size="large"
              color={theme.colors.primary}
            />
          </View>
        )}
      </View>
    </ResponsiveModal>
  );
};

export default GenericFormModal;
