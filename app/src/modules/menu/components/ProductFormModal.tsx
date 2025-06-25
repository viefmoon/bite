import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
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
  TouchableRipple,} from 'react-native-paper';
import {
  useForm,
  Controller,
  useFieldArray,
  SubmitHandler,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAppTheme, AppTheme } from '@/app/styles/theme';
import {
  ProductFormInputs,
  productSchema,
  updateProductSchema,
  ProductVariant,
  Product,
} from '../schema/products.schema';
import { ModifierGroup } from '../../modifiers/schema/modifierGroup.schema';
import { getApiErrorMessage } from '@/app/lib/errorMapping';
import { useSnackbarStore } from '@/app/store/snackbarStore';
import VariantFormModal from './VariantFormModal';
import CustomImagePicker, {
  FileObject,
} from '@/app/components/common/CustomImagePicker';
import { ImageUploadService } from '@/app/lib/imageUploadService';
import { getImageUrl } from '@/app/lib/imageUtils';
import { useModifierGroupsQuery } from '../../modifiers/hooks/useModifierGroupsQueries';
import { modifierService } from '../../modifiers/services/modifierService';

interface ProductFormModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (
    data: ProductFormInputs,
    photoId: string | null | undefined,
    file?: FileObject | null,
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
}: ProductFormModalProps): React.ReactElement {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);
  const isEditing = !!productId && !!initialData;

  const [isVariantModalVisible, setIsVariantModalVisible] = useState(false);
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(
    null,
  );
  const [localSelectedFile, setLocalSelectedFile] = useState<FileObject | null>(
    null,
  );
  const [isInternalImageUploading, setIsInternalImageUploading] =
    useState(false);
  const [groupModifiers, setGroupModifiers] = useState<Record<string, any[]>>(
    {},
  );
  const [priceInputValue, setPriceInputValue] = useState<string>('');

  const defaultValues = useMemo(
    (): ProductFormInputs => ({
      name: '',
      description: null,
      price: null,
      hasVariants: false,
      isActive: true,
      isPizza: false,
      subcategoryId: subcategoryId,
      photoId: null,
      estimatedPrepTime: 10,
      preparationScreenId: null,
      sortOrder: 0,
      variants: [],
      variantsToDelete: [],
      imageUri: null,
      modifierGroupIds: [],
    }),
    [subcategoryId],
  );

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormInputs>({
    resolver: zodResolver(initialData ? updateProductSchema : productSchema),
    defaultValues: defaultValues,
  });

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
    update: updateVariant,
  } = useFieldArray({
    control,
    name: 'variants',
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
          description: initialData.description || null,
          price: parsedPrice,
          hasVariants: initialData.hasVariants,
          isActive: initialData.isActive,
          isPizza: initialData.isPizza ?? false,
          subcategoryId: initialData.subcategoryId,
          photoId: initialData.photo?.id ?? null,
          estimatedPrepTime: initialData.estimatedPrepTime,
          preparationScreenId: initialData.preparationScreenId,
          sortOrder: initialData.sortOrder ?? 0,
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

  const hasVariants = watch('hasVariants');
  const currentImageUri = watch('imageUri');
  const priceValue = watch('price');

  // Sincronizar el valor del precio con el estado del input
  useEffect(() => {
    setPriceInputValue(
      priceValue !== null && priceValue !== undefined
        ? priceValue.toString()
        : '',
    );
  }, [priceValue]);

  const { data: modifierGroupsResponse, isLoading: isLoadingGroups } =
    useModifierGroupsQuery({ isActive: true }); // Solo grupos activos

  const allModifierGroups = modifierGroupsResponse?.data || [];

  // Cargar los modificadores de cada grupo
  useEffect(() => {
    const loadModifiers = async () => {
      const modifiersMap: Record<string, any[]> = {};

      for (const group of allModifierGroups) {
        try {
          const modifiers = await modifierService.findByGroupId(group.id);
          modifiersMap[group.id] = modifiers.filter((mod) => mod.isActive);
        } catch (error) {
          console.error(
            `Error loading modifiers for group ${group.id}:`,
            error,
          );
          modifiersMap[group.id] = [];
        }
      }

      setGroupModifiers(modifiersMap);
    };

    if (allModifierGroups.length > 0) {
      loadModifiers();
    }
  }, [allModifierGroups]);

  useEffect(() => {
    if (visible) {
      if (isEditing && initialData?.modifierGroups) {
        if (Array.isArray(initialData.modifierGroups)) {
          const assignedIds = initialData.modifierGroups.map(
            (group: ModifierGroup) => group.id,
          );
          setValue('modifierGroupIds', assignedIds);
        } else {
          setValue('modifierGroupIds', []);
        }
      } else if (!isEditing) {
        setValue('modifierGroupIds', []);
      } else if (isEditing && !initialData?.modifierGroups) {
        setValue('modifierGroupIds', []);
      }
    }
  }, [visible, isEditing, initialData, setValue, reset, defaultValues]);

  const handleImageSelected = useCallback(
    (uri: string, file: FileObject) => {
      setValue('imageUri', uri, { shouldValidate: true, shouldDirty: true });
      setLocalSelectedFile(file);
    },
    [setValue],
  );

  const handleImageRemoved = useCallback(() => {
    setValue('imageUri', null, { shouldValidate: true, shouldDirty: true });
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
            uploadResult.error || 'La subida de la imagen falló.',
          );
        }
      } catch (error) {
        showSnackbar({
          message: `Error al subir imagen: ${getApiErrorMessage(error)}`,
          type: 'error',
        });
        setIsInternalImageUploading(false);
        return;
      } finally {
        setIsInternalImageUploading(false);
      }
    } else {
      finalPhotoId = ImageUploadService.determinePhotoId(
        currentImageUri,
        initialData ?? undefined,
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
      const finalDataToUpdate =
        !originalVariantId && 'id' in dataToUpdate
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
      const currentToDelete = watch('variantsToDelete') || [];
      setValue('variantsToDelete', [...currentToDelete, variantToRemove.id]);
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
            {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
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

              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Descripción"
                    value={value || ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={!!errors.description}
                    style={styles.input}
                    disabled={isSubmitting}
                    multiline
                    numberOfLines={3}
                  />
                )}
              />
              {errors.description && (
                <HelperText type="error" visible={!!errors.description}>
                  {errors.description.message}
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
                          setValue('price', null, { shouldValidate: true });
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
                    render={({ field }) => (
                      <TextInput
                        mode="outlined"
                        label="Precio *"
                        keyboardType="decimal-pad"
                        value={priceInputValue}
                        onChangeText={(text) => {
                          const formattedText = text.replace(/,/g, '.');

                          if (/^(\d*\.?\d*)$/.test(formattedText)) {
                            setPriceInputValue(formattedText); // Actualizar estado local

                            // Actualizar valor del formulario (number | null)
                            if (formattedText === '') {
                              field.onChange(null);
                            } else if (formattedText !== '.') {
                              field.onChange(parseFloat(formattedText));
                            }
                          }
                        }}
                        error={!!errors.price}
                        disabled={isSubmitting || hasVariants}
                        style={styles.input}
                      />
                    )}
                  />
                  {errors.price && (
                    <HelperText type="error" visible={!!errors.price}>
                      {errors.price?.message || 'Precio inválido'}
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
                      style={[
                        styles.variantCard,
                        field.isActive === false && styles.variantCardInactive,
                      ]}
                    >
                      <View style={styles.variantContent}>
                        <View style={styles.variantInfo}>
                          <View style={styles.variantHeader}>
                            <Text
                              style={[
                                styles.variantName,
                                field.isActive === false &&
                                  styles.variantNameInactive,
                              ]}
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {field.name || 'Nueva Variante'}
                            </Text>
                            {field.isActive === false && (
                              <View style={styles.inactiveBadge}>
                                <Text style={styles.inactiveBadgeText}>
                                  Inactiva
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.variantPrice}>
                            $
                            {!isNaN(Number(field.price))
                              ? Number(field.price).toFixed(2)
                              : '0.00'}
                          </Text>
                        </View>
                        <View style={styles.variantActions}>
                          <IconButton
                            icon="pencil"
                            size={24}
                            onPress={() => showVariantModal(index)}
                            disabled={isSubmitting}
                            style={styles.variantActionButton}
                          />
                          <IconButton
                            icon="delete"
                            size={24}
                            onPress={() => handleRemoveVariant(index)}
                            iconColor={theme.colors.error}
                            disabled={isSubmitting}
                            style={styles.variantActionButton}
                          />
                        </View>
                      </View>
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
                      value !== null && value !== undefined ? String(value) : ''
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

              <Controller
                control={control}
                name="sortOrder"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Orden de visualización"
                    value={
                      value !== null && value !== undefined ? String(value) : ''
                    }
                    onChangeText={(text) =>
                      onChange(text ? parseInt(text, 10) : 0)
                    }
                    onBlur={onBlur}
                    error={!!errors.sortOrder}
                    style={styles.input}
                    keyboardType="numeric"
                    disabled={isSubmitting}
                  />
                )}
              />
              {errors.sortOrder && (
                <HelperText type="error" visible={!!errors.sortOrder}>
                  {errors.sortOrder.message}
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

              <View style={styles.switchContainer}>
                <Text style={styles.label}>Es Pizza</Text>
                <Controller
                  control={control}
                  name="isPizza"
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
                ) : allModifierGroups.length === 0 ? (
                  <Text style={styles.noItemsText}>
                    No hay grupos de modificadores disponibles.
                  </Text>
                ) : (
                  <Controller
                    control={control}
                    name="modifierGroupIds"
                    render={({ field: { onChange, value } }) => {
                      const currentIds = Array.isArray(value) ? value : []; // Asegurar que sea array
                      const availableGroups = allModifierGroups; // Ya es un array de ModifierGroup

                      return (
                        <>
                          {availableGroups.map((group: ModifierGroup) => {
                            const isSelected = currentIds.includes(group.id);
                            const modifiers = groupModifiers[group.id] || [];

                            return (
                              <TouchableRipple
                                key={group.id}
                                onPress={() => {
                                  const newIds = isSelected
                                    ? currentIds.filter((id) => id !== group.id)
                                    : [...currentIds, group.id];
                                  onChange(newIds);
                                }}
                                disabled={isSubmitting}
                                style={styles.modifierGroupTouchable}
                              >
                                <View style={styles.modifierGroupContent}>
                                  <Checkbox
                                    status={
                                      isSelected ? 'checked' : 'unchecked'
                                    }
                                    disabled={isSubmitting}
                                  />
                                  <View
                                    style={styles.modifierGroupTextContainer}
                                  >
                                    <Text style={styles.modifierGroupName}>
                                      {group.name}
                                    </Text>
                                    {modifiers.length > 0 && (
                                      <View
                                        style={styles.modifiersListContainer}
                                      >
                                        {modifiers.map((modifier, index) => (
                                          <Text
                                            key={modifier.id}
                                            style={styles.modifierItem}
                                          >
                                            {modifier.isDefault && '✓ '}
                                            {modifier.name}
                                            {index < modifiers.length - 1 &&
                                              ', '}
                                          </Text>
                                        ))}
                                      </View>
                                    )}
                                    {modifiers.length === 0 && (
                                      <Text style={styles.noModifiersText}>
                                        Sin modificadores activos
                                      </Text>
                                    )}
                                  </View>
                                </View>
                              </TouchableRipple>
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
            {isEditing ? 'Guardar' : 'Crear'}
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
      maxHeight: '90%',
      overflow: 'hidden',
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
      fontWeight: 'bold',
      textAlign: 'center',
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
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
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
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.s,
    },
    variantCard: {
      marginBottom: theme.spacing.s,
      backgroundColor: theme.colors.elevation.level1,
      paddingVertical: theme.spacing.xs,
      paddingLeft: theme.spacing.m,
      paddingRight: theme.spacing.xs,
    },
    variantCardInactive: {
      opacity: 0.7,
      backgroundColor: theme.colors.surfaceVariant,
    },
    variantContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    variantInfo: {
      flex: 1,
      marginRight: theme.spacing.s,
    },
    variantHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
    },
    variantName: {
      fontSize: 15,
      fontWeight: '500',
      color: theme.colors.onSurface,
      flex: 1,
    },
    variantNameInactive: {
      color: theme.colors.onSurfaceVariant,
    },
    variantPrice: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    inactiveBadge: {
      backgroundColor: theme.colors.errorContainer,
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: 2,
      borderRadius: 4,
      marginLeft: theme.spacing.xs,
    },
    inactiveBadgeText: {
      fontSize: 10,
      color: theme.colors.onErrorContainer,
      fontWeight: '600',
    },
    variantActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    variantActionButton: {
      margin: 0,
    },
    noVariantsText: {
      textAlign: 'center',
      color: theme.colors.onSurfaceVariant,
      marginVertical: theme.spacing.s,
      fontStyle: 'italic',
    },
    imagePickerContainer: {
      alignItems: 'center',
      marginBottom: theme.spacing.l,
    },
    modifierGroupSection: {
      marginTop: theme.spacing.m,
    },
    sectionTitle: {
      marginBottom: theme.spacing.s,
      marginLeft: theme.spacing.xs,
    },
    noItemsText: {
      textAlign: 'center',
      color: theme.colors.onSurfaceVariant,
      marginVertical: theme.spacing.s,
      fontStyle: 'italic',
    },
    modifierGroupTouchable: {
      paddingVertical: theme.spacing.s,
      paddingHorizontal: theme.spacing.m,
      marginHorizontal: -theme.spacing.m,
    },
    modifierGroupContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    modifierGroupTextContainer: {
      flex: 1,
      marginLeft: theme.spacing.m,
    },
    modifierGroupName: {
      fontSize: 15,
      color: theme.colors.onSurface,
    },
    modifiersList: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
      marginTop: 2,
    },
    modifiersListContainer: {
      marginTop: 4,
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    modifierItem: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 18,
    },
    noModifiersText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
      marginTop: 4,
      opacity: 0.7,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
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
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
      borderRadius: theme.roundness * 2,
    },
  });

export default ProductFormModal;
