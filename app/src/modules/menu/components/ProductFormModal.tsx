import React, { useEffect, useMemo, useState, useCallback } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Modal,
  Portal,
  Button,
  TextInput,
  Text,
  ActivityIndicator,
  Switch,
  HelperText,
  Divider,
  IconButton,
  Card,
  Checkbox,
} from "react-native-paper";
import {
  useForm,
  Controller,
  useFieldArray,
  SubmitHandler,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useAppTheme, AppTheme } from "@/app/styles/theme";
import {
  ProductFormInputs,
  productSchema,
  ProductVariant,
  Product,
} from "../schema/products.schema";
import { ModifierGroup } from "../../modifiers/schema/modifierGroup.schema";
import { getApiErrorMessage } from "@/app/lib/errorMapping";
import { useSnackbarStore } from "@/app/store/snackbarStore";
import VariantFormModal from "./VariantFormModal";
import CustomImagePicker, {
  FileObject,
} from "@/app/components/common/CustomImagePicker";
import { ImageUploadService } from "@/app/lib/imageUploadService";
import { getImageUrl } from "@/app/lib/imageUtils";
import { useModifierGroupsQuery } from "../../modifiers/hooks/useModifierGroupsQueries";

interface ProductFormModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (
    data: ProductFormInputs,
    photoId: string | null | undefined,
    file?: FileObject | null
  ) => Promise<void>;
  initialData?: Product | null;
  isSubmitting: boolean;
  productId?: string | null;
  subcategoryId: string;
}

function ProductFormModal({
  visible,
  onDismiss,
  onSubmit,
  initialData,
  isSubmitting,
  productId,
  subcategoryId,
}: ProductFormModalProps): JSX.Element {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);
  const isEditing = !!productId && !!initialData;

  const [isVariantModalVisible, setIsVariantModalVisible] = useState(false);
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(
    null
  );
  const [localSelectedFile, setLocalSelectedFile] = useState<FileObject | null>(
    null
  );
  const [isInternalImageUploading, setIsInternalImageUploading] =
    useState(false);

  const defaultValues = useMemo(
    (): ProductFormInputs => ({
      name: "",
      price: null,
      hasVariants: false,
      isActive: true,
      subcategoryId: subcategoryId,
      photoId: null,
      estimatedPrepTime: 10,
      preparationScreenId: null,
      variants: [],
      variantsToDelete: [],
      imageUri: null,
      modifierGroupIds: [],
    }),
    [subcategoryId]
  );

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormInputs>({
    resolver: zodResolver(productSchema),
    defaultValues: defaultValues,
  });

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
    update: updateVariant,
  } = useFieldArray({
    control,
    name: "variants",
  });

  useEffect(() => {
    if (visible) {
      if (isEditing && initialData) {
        const initialPrice = initialData.price;
        const parsedPrice =
          initialPrice !== null &&
          initialPrice !== undefined &&
          !isNaN(parseFloat(String(initialPrice)))
            ? parseFloat(String(initialPrice))
            : null;

        reset({
          name: initialData.name,
          price: parsedPrice,
          hasVariants: initialData.hasVariants,
          isActive: initialData.isActive,
          subcategoryId: initialData.subcategoryId,
          photoId: initialData.photo?.id ?? null,
          estimatedPrepTime: initialData.estimatedPrepTime,
          preparationScreenId: initialData.preparationScreenId,
          variants: initialData.variants || [],
          variantsToDelete: [],
          imageUri: getImageUrl(initialData.photo?.path) ?? null,
          modifierGroupIds: [],
        });
        setLocalSelectedFile(null);
      } else {
        reset(defaultValues);
        setLocalSelectedFile(null);
      }
    }
  }, [visible, isEditing, initialData, reset, defaultValues, subcategoryId]);

  const hasVariants = watch("hasVariants");
  const currentImageUri = watch("imageUri");

  const { data: allModifierGroups, isLoading: isLoadingGroups } =
    useModifierGroupsQuery({}); // Ajustar filtros si es necesario

  useEffect(() => {
    if (visible) {
      if (isEditing && initialData?.modifierGroups) {
        if (Array.isArray(initialData.modifierGroups)) {
          const assignedIds = initialData.modifierGroups.map(
            (group: ModifierGroup) => group.id
          );
          setValue("modifierGroupIds", assignedIds);
        } else {
          setValue("modifierGroupIds", []);
        }
      } else if (!isEditing) {
        setValue("modifierGroupIds", []);
      } else if (isEditing && !initialData?.modifierGroups) {
        setValue("modifierGroupIds", []);
      }
    }
  }, [visible, isEditing, initialData, setValue, reset, defaultValues]);

  const handleImageSelected = useCallback(
    (uri: string, file: FileObject) => {
      setValue("imageUri", uri, { shouldValidate: true, shouldDirty: true });
      setLocalSelectedFile(file);
    },
    [setValue]
  );

  const handleImageRemoved = useCallback(() => {
    setValue("imageUri", null, { shouldValidate: true, shouldDirty: true });
    setLocalSelectedFile(null);
  }, [setValue]);

  const processSubmit: SubmitHandler<ProductFormInputs> = async (formData) => {
    if (isSubmitting || isInternalImageUploading) return;

    let finalPhotoId: string | null | undefined = undefined;

    // 1. Determinar el photoId final
    if (localSelectedFile) {
      setIsInternalImageUploading(true);
      try {
        const uploadResult =
          await ImageUploadService.uploadImage(localSelectedFile);
        if (uploadResult.success && uploadResult.photoId) {
          finalPhotoId = uploadResult.photoId;
        } else {
          throw new Error(
            uploadResult.error || "La subida de la imagen falló."
          );
        }
      } catch (error) {
        showSnackbar({
          message: `Error al subir imagen: ${getApiErrorMessage(error)}`,
          type: "error",
        });
        setIsInternalImageUploading(false);
        return;
      } finally {
        setIsInternalImageUploading(false);
      }
    } else {
      finalPhotoId = ImageUploadService.determinePhotoId(
        currentImageUri,
        initialData ?? undefined
      );
    }
    // 2. Preparar los datos finales
    const finalData = {
      ...formData,
      price: hasVariants ? null : formData.price,
      variants: hasVariants ? formData.variants : [],
    };
    // imageUri se maneja en ProductsScreen antes de la mutación

    // 3. Llamar al onSubmit del padre
    await onSubmit(finalData, finalPhotoId, localSelectedFile);
    setLocalSelectedFile(null);
  };

  const showVariantModal = (index: number | null = null) => {
    setEditingVariantIndex(index);
    setIsVariantModalVisible(true);
  };

  const handleVariantSubmit = (variantData: ProductVariant) => {
    if (editingVariantIndex !== null) {
      const originalVariantId =
        initialData?.variants?.[editingVariantIndex]?.id;

      const priceAsNumber = Number(variantData.price);

      const dataToUpdate = {
        ...variantData,
        price: isNaN(priceAsNumber) ? 0 : priceAsNumber, // Asegurar que el precio sea un número
        ...(originalVariantId && { id: originalVariantId }),
      };

      // Crear un nuevo objeto sin 'id' si no había uno original, usando desestructuración
      const finalDataToUpdate = !originalVariantId && "id" in dataToUpdate
        ? (({ id, ...rest }) => rest)(dataToUpdate) // Correcto: crea un nuevo objeto sin 'id'
        : dataToUpdate;

      updateVariant(editingVariantIndex, finalDataToUpdate as ProductVariant);
    } else {
      const { id, price, ...restNewVariantData } = variantData;
      const newPriceAsNumber = Number(price);
      const newVariantData = {
        ...restNewVariantData,
        price: isNaN(newPriceAsNumber) ? 0 : newPriceAsNumber,
      };
      appendVariant(newVariantData as ProductVariant);
    }
    setIsVariantModalVisible(false);
    setEditingVariantIndex(null);
  };

  const handleRemoveVariant = (index: number) => {
    const variantToRemove = variantFields[index];
    if (variantToRemove.id) {
      const currentToDelete = watch("variantsToDelete") || [];
      setValue("variantsToDelete", [...currentToDelete, variantToRemove.id]);
    }
    removeVariant(index);
  };

  const variantInitialData =
    editingVariantIndex !== null
      ? (variantFields[editingVariantIndex] as ProductVariant)
      : undefined;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalSurface}
        dismissable={!isSubmitting && !isInternalImageUploading}
      >
        <View style={styles.modalHeader}>
          <Text variant="titleLarge" style={styles.modalTitle}>
            {isEditing ? "Editar Producto" : "Nuevo Producto"}
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.imagePickerContainer}>
                <CustomImagePicker
                  value={currentImageUri}
                  onImageSelected={handleImageSelected}
                  onImageRemoved={handleImageRemoved}
                  isLoading={isInternalImageUploading}
                  disabled={isSubmitting}
                  size={150}
                />
                {errors.imageUri && (
                  <HelperText type="error">
                    {errors.imageUri.message}
                  </HelperText>
                )}
              </View>

              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Nombre del Producto *"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={!!errors.name}
                    style={styles.input}
                    disabled={isSubmitting}
                  />
                )}
              />
              {errors.name && (
                <HelperText type="error" visible={!!errors.name}>
                  {errors.name.message}
                </HelperText>
              )}

              <View style={styles.switchContainer}>
                <Text style={styles.label}>¿Tiene Variantes?</Text>
                <Controller
                  control={control}
                  name="hasVariants"
                  render={({ field: { onChange, value } }) => (
                    <Switch
                      value={value}
                      onValueChange={(newValue) => {
                        onChange(newValue);
                        if (newValue) {
                          setValue("price", null, { shouldValidate: true });
                        }
                      }}
                      disabled={isSubmitting}
                    />
                  )}
                />
              </View>

              {hasVariants && errors.price && (
                <HelperText type="error" visible={!!errors.price}>
                  {errors.price.message}
                </HelperText>
              )}

              {!hasVariants && (
                <>
                  <Controller
                    control={control}
                    name="price"
                    render={({ field }) => {
                      const [inputValue, setInputValue] =
                        React.useState<string>(
                          field.value !== null && field.value !== undefined
                            ? field.value.toString()
                            : ""
                        );

                      React.useEffect(() => {
                        setInputValue(
                          field.value !== null && field.value !== undefined
                            ? field.value.toString()
                            : ""
                        );
                      }, [field.value]);

                      return (
                        <TextInput
                          mode="outlined"
                          label="Precio *"
                          keyboardType="decimal-pad"
                          value={inputValue}
                          onChangeText={(text) => {
                            const formattedText = text.replace(/,/g, ".");

                            if (/^(\d*\.?\d*)$/.test(formattedText)) {
                              setInputValue(formattedText); // Actualizar estado local

                              // Actualizar valor del formulario (number | null)
                              if (formattedText === "") {
                                field.onChange(null);
                              } else if (formattedText !== ".") {
                                field.onChange(parseFloat(formattedText));
                              }
                            }
                          }}
                          error={!!errors.price}
                          disabled={isSubmitting || hasVariants}
                          style={styles.input}
                        />
                      );
                    }}
                  />
                  {errors.price && (
                    <HelperText type="error" visible={!!errors.price}>
                      {errors.price?.message || "Precio inválido"}
                    </HelperText>
                  )}
                </>
              )}

              {hasVariants && (
                <View style={styles.variantsSection}>
                  <Divider style={styles.divider} />
                  <View style={styles.variantsHeader}>
                    <Text variant="titleMedium">Variantes</Text>
                    <Button
                      mode="contained-tonal"
                      icon="plus"
                      onPress={() => showVariantModal()}
                      disabled={isSubmitting}
                    >
                      Añadir
                    </Button>
                  </View>
                  {variantFields.length === 0 && (
                    <Text style={styles.noVariantsText}>
                      Aún no hay variantes añadidas.
                    </Text>
                  )}
                  {variantFields.map((field, index) => (
                    <Card
                      key={field.id || `new-${index}`}
                      style={styles.variantCard}
                    >
                      <Card.Title
                        title={field.name || "Nueva Variante"}
                        subtitle={`$${!isNaN(Number(field.price)) ? Number(field.price).toFixed(2) : "0.00"}${field.isActive === false ? " (Inactiva)" : ""}`}
                        right={() => (
                          <View style={styles.variantActions}>
                            <IconButton
                              icon="pencil"
                              size={20}
                              onPress={() => showVariantModal(index)}
                              disabled={isSubmitting}
                            />
                            <IconButton
                              icon="delete"
                              size={20}
                              onPress={() => handleRemoveVariant(index)}
                              iconColor={theme.colors.error}
                              disabled={isSubmitting}
                            />
                          </View>
                        )}
                      />
                    </Card>
                  ))}
                  {/* Mostrar error si hasVariants es true pero no hay variantes */}
                  {errors.variants?.message && (
                    <HelperText
                      type="error"
                      visible={!!errors.variants.message}
                    >
                      {errors.variants.message as string}
                    </HelperText>
                  )}
                  {/* También podría estar en root para errores de array */}
                  {errors.variants?.root?.message && (
                    <HelperText
                      type="error"
                      visible={!!errors.variants.root.message}
                    >
                      {errors.variants.root.message as string}
                    </HelperText>
                  )}
                </View>
              )}

              <Divider style={styles.divider} />

              <Controller
                control={control}
                name="estimatedPrepTime"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Tiempo Prep. Estimado (min)"
                    value={
                      value !== null && value !== undefined ? String(value) : ""
                    }
                    onChangeText={(text) =>
                      onChange(text ? parseInt(text, 10) : 0)
                    }
                    onBlur={onBlur}
                    error={!!errors.estimatedPrepTime}
                    style={styles.input}
                    keyboardType="numeric"
                    disabled={isSubmitting}
                  />
                )}
              />
              {errors.estimatedPrepTime && (
                <HelperText type="error" visible={!!errors.estimatedPrepTime}>
                  {errors.estimatedPrepTime.message}
                </HelperText>
              )}

              <View style={styles.switchContainer}>
                <Text style={styles.label}>Activo</Text>
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field: { onChange, value } }) => (
                    <Switch
                      value={value}
                      onValueChange={onChange}
                      disabled={isSubmitting}
                    />
                  )}
                />
              </View>

              <Divider style={styles.divider} />

              <View style={styles.modifierGroupSection}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Grupos de Modificadores
                </Text>
                {isLoadingGroups ? (
                  <ActivityIndicator
                    animating={true}
                    style={{ marginVertical: theme.spacing.m }}
                  />
                ) : !allModifierGroups ||
                  !Array.isArray(allModifierGroups) ||
                  allModifierGroups.length === 0 ? (
                  <Text style={styles.noItemsText}>
                    No hay grupos de modificadores disponibles.
                  </Text>
                ) : (
                  <Controller
                    control={control}
                    name="modifierGroupIds"
                    render={({ field: { onChange, value } }) => {
                      const currentIds = Array.isArray(value) ? value : []; // Asegurar que sea array
                      const availableGroups = allModifierGroups; // El hook devuelve ModifierGroup[]

                      return (
                        <>
                          {availableGroups.map((group: ModifierGroup) => {
                            // Renderizar Checkbox.Item
                            const isSelected = currentIds.includes(group.id);
                            return (
                              <Checkbox.Item
                                key={group.id}
                                label={group.name}
                                status={isSelected ? "checked" : "unchecked"}
                                onPress={() => {
                                  const newIds = isSelected
                                    ? currentIds.filter((id) => id !== group.id)
                                    : [...currentIds, group.id];
                                  onChange(newIds);
                                }}
                                disabled={isSubmitting}
                                style={styles.checkboxItem}
                                labelStyle={styles.checkboxLabel}
                              />
                            );
                          })}
                        </>
                      );
                    }}
                  />
                )}
                {errors.modifierGroupIds && (
                  <HelperText type="error" visible={!!errors.modifierGroupIds}>
                    {errors.modifierGroupIds.message as string}
                  </HelperText>
                )}
              </View>
            </Card.Content>
          </Card>
        </ScrollView>

        {(isSubmitting || isInternalImageUploading) && (
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
            disabled={isSubmitting || isInternalImageUploading}
          >
            Cancelar
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit(processSubmit)}
            loading={isSubmitting || isInternalImageUploading}
            disabled={isSubmitting || isInternalImageUploading}
            style={styles.formButton}
          >
            {isEditing ? "Guardar" : "Crear"}
          </Button>
        </View>
      </Modal>

      <VariantFormModal
        visible={isVariantModalVisible}
        onDismiss={() => setIsVariantModalVisible(false)}
        onSubmit={handleVariantSubmit}
        initialData={variantInitialData}
      />
    </Portal>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    modalSurface: {
      padding: 0,
      margin: theme.spacing.m,
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
      borderTopLeftRadius: theme.roundness * 2,
      borderTopRightRadius: theme.roundness * 2,
    },
    modalTitle: {
      color: theme.colors.onPrimary,
      fontWeight: "bold",
      textAlign: "center",
    },
    scrollContent: {
      padding: theme.spacing.l,
      paddingBottom: theme.spacing.xl,
    },
    card: {
      backgroundColor: theme.colors.surface,
      elevation: 1,
    },
    input: {
      marginBottom: theme.spacing.m,
      backgroundColor: theme.colors.surfaceVariant,
    },
    switchContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: theme.spacing.m,
    },
    label: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 16,
      marginRight: theme.spacing.m,
    },
    divider: {
      marginVertical: theme.spacing.s,
    },
    variantsSection: {
      marginTop: theme.spacing.s,
    },
    variantsHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: theme.spacing.s,
    },
    variantCard: {
      marginBottom: theme.spacing.s,
      backgroundColor: theme.colors.elevation.level1,
    },
    variantActions: {
      flexDirection: "row",
    },
    noVariantsText: {
      textAlign: "center",
      color: theme.colors.onSurfaceVariant,
      marginVertical: theme.spacing.s,
      fontStyle: "italic",
    },
    imagePickerContainer: {
      alignItems: "center",
      marginBottom: theme.spacing.l,
    },
    modifierGroupSection: {
      marginTop: theme.spacing.m,
    },
    sectionTitle: {
      marginBottom: theme.spacing.s,
      marginLeft: theme.spacing.xs,
    },
    checkboxItem: {
      paddingVertical: 0,
      paddingLeft: 0,
    },
    checkboxLabel: {
      fontSize: 15,
    },
    noItemsText: {
      textAlign: "center",
      color: theme.colors.onSurfaceVariant,
      marginVertical: theme.spacing.s,
      fontStyle: "italic",
    },
    modalActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      paddingVertical: theme.spacing.m,
      paddingHorizontal: theme.spacing.l,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
    },
    formButton: {
      borderRadius: theme.roundness * 2,
      paddingHorizontal: theme.spacing.m,
    },
    cancelButton: {
      marginRight: theme.spacing.m,
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0, 0, 0, 0.3)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10,
      borderRadius: theme.roundness * 2,
    },
  });

export default ProductFormModal;
