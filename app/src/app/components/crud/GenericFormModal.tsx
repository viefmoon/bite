import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  StyleProp,
  ViewStyle,
} from "react-native";
import {
  Modal,
  Portal,
  Text,
  TextInput,
  Button,
  Switch,
  HelperText,
  ActivityIndicator,
} from "react-native-paper";
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
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ZodSchema } from "zod";
import { useAppTheme, AppTheme } from "../../styles/theme";
import CustomImagePicker, { FileObject } from "../common/CustomImagePicker";
import {
  ImageUploadService,
  EntityWithOptionalPhoto,
} from "../../lib/imageUploadService";

type FieldType =
  | "text"
  | "textarea"
  | "switch"
  | "number"
  | "email"
  | "password";

export interface FormFieldConfig<TFormData extends FieldValues> {
  name: Path<TFormData>;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  defaultValue?: any;
  inputProps?: Partial<React.ComponentProps<typeof TextInput>>;
  switchProps?: Partial<React.ComponentProps<typeof Switch>>;
  numberOfLines?: number;
  switchLabel?: string;
}

export interface ImagePickerConfig<TFormData extends FieldValues> {
  imageUriField: Path<TFormData>;
  onImageUpload: (file: FileObject) => Promise<{ id: string } | null>;
  determineFinalPhotoId?: (
    currentImageUri: string | null,
    editingItem: EntityWithOptionalPhoto | undefined
  ) => string | null | undefined;
  imagePickerSize?: number;
}

interface GenericFormModalProps<
  TFormData extends FieldValues,
  TItem extends { id: string },
> {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (
    data: TFormData,
    photoId: string | null | undefined
  ) => Promise<void>;
  formSchema: ZodSchema<TFormData>;
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

const getDefaultValueForType = (
  type: FieldType
): string | number | boolean | null | undefined => {
  switch (type) {
    case "text":
    case "textarea":
    case "email":
    case "password":
      return "";
    case "number":
      return null;
    case "switch":
      return false;
    default:
      return undefined;
  }
};

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    modalSurface: {
      padding: 0,
      margin: theme.spacing.l,
      borderRadius: theme.roundness * 2,
      elevation: 4,
      backgroundColor: theme.colors.background,
      maxHeight: "90%",
      overflow: "hidden",
    },
    modalHeader: {
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.m,
      paddingHorizontal: theme.spacing.l,
    },
    formContainer: {
      maxHeight: "100%",
    },
    scrollViewContent: {
      padding: theme.spacing.l,
      paddingBottom: theme.spacing.xl,
    },
    modalTitle: {
      color: theme.colors.onPrimary,
      fontWeight: "700",
      textAlign: "center",
    },
    input: {
      marginBottom: theme.spacing.m,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.roundness,
    },
    switchLabel: {
      color: theme.colors.onSurfaceVariant,
      marginRight: theme.spacing.m,
      fontSize: 16,
      flexShrink: 1,
    },
    switchComponentContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      marginBottom: theme.spacing.m,
      paddingVertical: theme.spacing.s,
    },
    imagePickerContainer: {
      alignItems: "center",
      marginBottom: theme.spacing.l,
    },
    modalActions: {
      flexDirection: "row",
      justifyContent: "center",
      paddingVertical: theme.spacing.m,
      paddingHorizontal: theme.spacing.l,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      gap: theme.spacing.m,
      minHeight: 60,
    },
    formButton: {
      borderRadius: theme.roundness,
      paddingHorizontal: theme.spacing.xs,
      flex: 1,
      maxWidth: 200,
      minWidth: 140,
    },
    cancelButton: {},
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0, 0, 0, 0.3)",
      justifyContent: "center",
      alignItems: "center",
      borderRadius: theme.roundness * 2,
      zIndex: 10,
    },
    helperText: {
      marginTop: -theme.spacing.s,
      marginBottom: theme.spacing.s,
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
  submitButtonLabel = (isEditing: boolean) => (isEditing ? "Guardar" : "Crear"),
  cancelButtonLabel = "Cancelar",
  modalStyle,
  formContainerStyle,
  onFileSelected,
}: GenericFormModalProps<TFormData, TItem>) => {
  const theme = useAppTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const [isInternalImageUploading, setIsInternalImageUploading] =
    useState(false);
  const [localSelectedFile, setLocalSelectedFile] = useState<FileObject | null>(
    null
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
    getValues,
    formState: { errors },
  }: UseFormReturn<TFormData> = useForm<TFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: useMemo((): DefaultValues<TFormData> => {
      const defaults = formFields.reduce(
        (acc: DefaultValues<TFormData>, field) => {
          acc[field.name] =
            field.defaultValue ?? getDefaultValueForType(field.type);
          return acc;
        },
        {} as DefaultValues<TFormData>
      );
      return { ...defaults, ...(initialValues as DefaultValues<TFormData>) };
    }, [formFields, initialValues]),
  });

  const watchedImageUri = imagePickerConfig
    ? watch(imagePickerConfig.imageUriField)
    : undefined;
  const currentImageUri =
    typeof watchedImageUri === "string" ? watchedImageUri : null;

  useEffect(() => {
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
        {} as DefaultValues<TFormData>
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
  }, [
    visible,
    editingItem?.id,
    reset,
    formFields,
    initialValues,
    onFileSelected,
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
    [setValue, getValues, imagePickerConfig, onFileSelected]
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
        typeof formImageUri === "string" && formImageUri.startsWith("file://");
      if (isNewLocalImage && localSelectedFile) {
        setIsInternalImageUploading(true);
        try {
          const uploadResult =
            await imagePickerConfig.onImageUpload(localSelectedFile);
          if (uploadResult?.id) {
            finalPhotoId = uploadResult.id;
          } else {
            throw new Error("La subida de la imagen no devolvió un ID.");
          }
        } catch (error) {
          console.error("Error subiendo imagen:", error);
          console.error("[GenericFormModal] Error subiendo imagen:", error);
          Alert.alert(
            "Error",
            `No se pudo subir la imagen: ${error instanceof Error ? error.message : "Error desconocido"}`
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
        finalPhotoId = determineFn(formImageUri, entityForPhotoCheck);
      }
    }

    await onSubmit(formData, finalPhotoId);
  };

  const renderFormField = (fieldConfig: FormFieldConfig<TFormData>) => {
    const fieldName = fieldConfig.name;
    const fieldError = errors[fieldName] as FieldError | undefined;
    const errorMessage = fieldError?.message;

    switch (fieldConfig.type) {
      case "textarea":
      case "text":
      case "number":
      case "email":
      case "password":
        return (
          <View key={String(fieldName)}>
            {/* Controller para campos numéricos con manejo de string local y decimales */}
            <Controller
              name={fieldName}
              control={control as Control<FieldValues>}
              render={({ field: { onChange, onBlur, value } }) => {
                if (fieldConfig.type === "number") {
                  const [inputValue, setInputValue] = useState<string>(
                    value === null || value === undefined ? "" : String(value)
                  );

                  useEffect(() => {
                    const stringValue =
                      value === null || value === undefined
                        ? ""
                        : String(value);
                    if (stringValue !== inputValue) {
                      const numericValueFromInput = parseFloat(inputValue);
                      if (
                        !(
                          inputValue.endsWith(".") &&
                          numericValueFromInput === value
                        ) &&
                        !(inputValue === "." && value === null)
                      ) {
                        setInputValue(stringValue);
                      }
                    }
                  }, [value, inputValue]);

                  return (
                    <TextInput
                      label={fieldConfig.label}
                      value={inputValue}
                      onChangeText={(text) => {
                        const formattedText = text.replace(/,/g, ".");
                        if (/^(\d*\.?\d*)$/.test(formattedText)) {
                          setInputValue(formattedText);

                          if (formattedText === "" || formattedText === ".") {
                            if (value !== null) onChange(null);
                          } else {
                            const numericValue = parseFloat(formattedText);
                            if (
                              !isNaN(numericValue) &&
                              numericValue !== value
                            ) {
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
                      placeholder={fieldConfig.placeholder}
                      keyboardType={
                        fieldConfig.inputProps?.keyboardType ?? "decimal-pad"
                      }
                      error={!!errorMessage}
                      disabled={isActuallySubmitting}
                      {...fieldConfig.inputProps}
                    />
                  );
                } else {
                  return (
                    <TextInput
                      label={fieldConfig.label}
                      value={value ?? ""}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      mode="outlined"
                      style={styles.input}
                      placeholder={fieldConfig.placeholder}
                      secureTextEntry={fieldConfig.type === "password"}
                      keyboardType={
                        fieldConfig.type === "email"
                          ? "email-address"
                          : "default"
                      }
                      multiline={fieldConfig.type === "textarea"}
                      numberOfLines={
                        fieldConfig.numberOfLines ??
                        (fieldConfig.type === "textarea" ? 3 : 1)
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
      case "switch":
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
        console.warn(`Tipo de campo no soportado: ${fieldConfig.type}`);
        return null;
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.modalSurface, modalStyle]}
        dismissable={!isActuallySubmitting}
      >
        <View style={styles.formContainer}>
          <View style={styles.modalHeader}>
            <Text variant="titleLarge" style={styles.modalTitle}>
              {modalTitle(isEditing)}
            </Text>
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.scrollViewContent,
              formContainerStyle,
            ]}
          >
            {imagePickerConfig && (
              <View style={styles.imagePickerContainer}>
                <CustomImagePicker
                  value={currentImageUri}
                  onImageSelected={handleImageSelected}
                  onImageRemoved={handleImageRemoved}
                  isLoading={isInternalImageUploading}
                  disabled={isParentSubmitting}
                  size={imagePickerConfig.imagePickerSize ?? 180}
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
        </View>
      </Modal>
    </Portal>
  );
};

export default GenericFormModal;
