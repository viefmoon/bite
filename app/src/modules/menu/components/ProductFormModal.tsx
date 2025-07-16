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
  TouchableRipple,
} from 'react-native-paper';
import {
  useForm,
  Controller,
  useFieldArray,
  SubmitHandler,
} from 'react-hook-form';
import { zodResolver } from '@/app/lib/zodResolver';

import { useAppTheme, AppTheme } from '@/app/styles/theme';
import { useResponsive } from '@/app/hooks/useResponsive';
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
import { useModifierGroupsQuery } from '../../modifiers/hooks/useModifierGroupsQuery';
import { modifierService } from '../../modifiers/services/modifierService';
import { useGetPreparationScreens } from '../../preparationScreens/hooks/usePreparationScreensQueries';
import { Menu } from 'react-native-paper';

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
  const responsive = useResponsive();
  const styles = useMemo(
    () => createStyles(theme, responsive),
    [theme, responsive],
  );
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
  const [preparationScreenMenuVisible, setPreparationScreenMenuVisible] =
    useState(false);

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
    const loadInitialData = async () => {
      if (visible) {
        if (isEditing && initialData) {
          const initialPrice = initialData.price;
          const parsedPrice =
            initialPrice !== null &&
            initialPrice !== undefined &&
            !isNaN(parseFloat(String(initialPrice)))
              ? parseFloat(String(initialPrice))
              : null;

          // Procesar la URL de la imagen si existe
          let imageUrl = null;
          if (initialData.photo?.path) {
            try {
              imageUrl = await getImageUrl(initialData.photo.path);
            } catch (error) {
              imageUrl = initialData.photo.path; // Fallback al path original
            }
          }

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
            preparationScreenId: initialData.preparationScreenId || null,
            sortOrder: initialData.sortOrder ?? 0,
            variants: initialData.variants || [],
            variantsToDelete: [],
            imageUri: imageUrl,
            modifierGroupIds: [],
          });
          setLocalSelectedFile(null);
        } else {
          reset(defaultValues);
          setLocalSelectedFile(null);
        }
      }
    };

    loadInitialData();
  }, [visible, isEditing, initialData, reset, defaultValues, subcategoryId]);

  const hasVariants = watch('hasVariants');
  const currentImageUri = watch('imageUri');
  const priceValue = watch('price');

  useEffect(() => {
    setPriceInputValue(
      priceValue !== null && priceValue !== undefined
        ? priceValue.toString()
        : '',
    );
  }, [priceValue]);

  const { data: modifierGroupsResponse, isLoading: isLoadingGroups } =
    useModifierGroupsQuery({ isActive: true });

  const { data: preparationScreensResponse } = useGetPreparationScreens(
    {},
    { page: 1, limit: 50 },
  );
  const preparationScreens = preparationScreensResponse?.data || [];

  const allModifierGroups = modifierGroupsResponse?.data || [];

  useEffect(() => {
    const loadModifiers = async () => {
      const modifiersMap: Record<string, any[]> = {};

      for (const group of allModifierGroups) {
        try {
          const modifiers = await modifierService.findByGroupId(group.id);
          modifiersMap[group.id] = modifiers.filter((mod) => mod.isActive);
        } catch (error) {
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
      finalPhotoId = await ImageUploadService.determinePhotoId(
        currentImageUri,
        initialData ?? undefined,
      );
    }

    const finalData = {
      ...formData,
      price: hasVariants ? null : formData.price,
      variants: hasVariants ? formData.variants : [],
    };

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
        price: isNaN(priceAsNumber) ? 0 : priceAsNumber,
        ...(originalVariantId && { id: originalVariantId }),
      };

      const finalDataToUpdate =
        !originalVariantId && 'id' in dataToUpdate
          ? (({ id, ...rest }) => rest)(dataToUpdate)
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
                  placeholderIcon="food-outline"
                  placeholderText="Imagen del producto"
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
                            setPriceInputValue(formattedText);
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

              {/* Campo de Pantalla de Preparación */}
              <Controller
                control={control}
                name="preparationScreenId"
                render={({ field: { onChange, value } }) => (
                  <View>
                    <Menu
                      visible={preparationScreenMenuVisible}
                      onDismiss={() => setPreparationScreenMenuVisible(false)}
                      anchor={
                        <TextInput
                          label="Pantalla de Preparación"
                          value={
                            preparationScreens.find(
                              (screen) => screen.id === value,
                            )?.name || ''
                          }
                          onPress={() => setPreparationScreenMenuVisible(true)}
                          right={
                            value ? (
                              <TextInput.Icon
                                icon="close"
                                onPress={() => {
                                  onChange(null);
                                }}
                              />
                            ) : (
                              <TextInput.Icon
                                icon="chevron-down"
                                onPress={() =>
                                  setPreparationScreenMenuVisible(true)
                                }
                              />
                            )
                          }
                          editable={false}
                          error={!!errors.preparationScreenId}
                          style={styles.input}
                          disabled={isSubmitting}
                        />
                      }
                    >
                      {preparationScreens.map((screen) => (
                        <Menu.Item
                          key={screen.id}
                          onPress={() => {
                            onChange(screen.id);
                            setPreparationScreenMenuVisible(false);
                          }}
                          title={screen.name}
                        />
                      ))}
                    </Menu>
                  </View>
                )}
              />
              {errors.preparationScreenId && (
                <HelperText type="error" visible={!!errors.preparationScreenId}>
                  {errors.preparationScreenId.message}
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
                    style={{
                      marginVertical: responsive.spacing(theme.spacing.m),
                    }}
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

const createStyles = (
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
      minHeight: responsive.isTablet ? 650 : undefined,
      maxWidth: responsive.isTablet ? 700 : 500,
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
      borderTopLeftRadius: theme.roundness * 2,
      borderTopRightRadius: theme.roundness * 2,
    },
    modalTitle: {
      color: theme.colors.onPrimary,
      fontWeight: 'bold',
      textAlign: 'center',
      fontSize: responsive.isTablet ? 20 : 22,
    },
    scrollContent: {
      padding: responsive.isTablet
        ? responsive.spacing(theme.spacing.m)
        : responsive.spacing(theme.spacing.l),
      paddingBottom: responsive.isTablet
        ? responsive.spacing(theme.spacing.l)
        : responsive.spacing(theme.spacing.xl),
    },
    card: {
      backgroundColor: theme.colors.surface,
      elevation: 1,
    },
    input: {
      marginBottom: responsive.isTablet
        ? responsive.spacing(theme.spacing.s)
        : responsive.spacing(theme.spacing.m),
      backgroundColor: theme.colors.surfaceVariant,
    },
    switchContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: responsive.isTablet
        ? responsive.spacing(theme.spacing.s)
        : responsive.spacing(theme.spacing.m),
    },
    label: {
      color: theme.colors.onSurfaceVariant,
      fontSize: responsive.isTablet ? 14 : 16,
      marginRight: responsive.isTablet
        ? responsive.spacing(theme.spacing.s)
        : responsive.spacing(theme.spacing.m),
    },
    divider: {
      marginVertical: responsive.isTablet
        ? responsive.spacing(theme.spacing.xs)
        : responsive.spacing(theme.spacing.s),
    },
    variantsSection: {
      marginTop: responsive.isTablet
        ? responsive.spacing(theme.spacing.xs)
        : responsive.spacing(theme.spacing.s),
    },
    variantsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: responsive.isTablet
        ? responsive.spacing(theme.spacing.xs)
        : responsive.spacing(theme.spacing.s),
    },
    variantCard: {
      marginBottom: responsive.isTablet
        ? responsive.spacing(theme.spacing.xs)
        : responsive.spacing(theme.spacing.s),
      backgroundColor: theme.colors.elevation.level1,
      paddingVertical: responsive.isTablet
        ? 6
        : responsive.spacing(theme.spacing.xs),
      paddingLeft: responsive.isTablet
        ? responsive.spacing(theme.spacing.s)
        : responsive.spacing(theme.spacing.m),
      paddingRight: responsive.isTablet
        ? 4
        : responsive.spacing(theme.spacing.xs),
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
      marginRight: responsive.isTablet
        ? responsive.spacing(theme.spacing.xs)
        : responsive.spacing(theme.spacing.s),
    },
    variantHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: responsive.isTablet ? 1 : 2,
    },
    variantName: {
      fontSize: responsive.isTablet ? 13 : 15,
      fontWeight: '500',
      color: theme.colors.onSurface,
      flex: 1,
    },
    variantNameInactive: {
      color: theme.colors.onSurfaceVariant,
    },
    variantPrice: {
      fontSize: responsive.isTablet ? 12 : 14,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    inactiveBadge: {
      backgroundColor: theme.colors.errorContainer,
      paddingHorizontal: responsive.isTablet
        ? 6
        : responsive.spacing(theme.spacing.xs),
      paddingVertical: responsive.isTablet ? 1 : 2,
      borderRadius: 4,
      marginLeft: responsive.isTablet
        ? responsive.spacing(theme.spacing.xs)
        : responsive.spacing(theme.spacing.xs),
    },
    inactiveBadgeText: {
      fontSize: responsive.isTablet ? 9 : 10,
      color: theme.colors.onErrorContainer,
      fontWeight: '600',
    },
    variantActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: responsive.isTablet ? 4 : 8,
    },
    variantActionButton: {
      margin: 0,
    },
    noVariantsText: {
      textAlign: 'center',
      color: theme.colors.onSurfaceVariant,
      marginVertical: responsive.isTablet
        ? responsive.spacing(theme.spacing.xs)
        : responsive.spacing(theme.spacing.s),
      fontStyle: 'italic',
      fontSize: responsive.isTablet ? 13 : 14,
    },
    imagePickerContainer: {
      alignItems: 'center',
      marginBottom: responsive.isTablet
        ? responsive.spacing(theme.spacing.m)
        : responsive.spacing(theme.spacing.l),
    },
    modifierGroupSection: {
      marginTop: responsive.isTablet
        ? responsive.spacing(theme.spacing.s)
        : responsive.spacing(theme.spacing.m),
    },
    sectionTitle: {
      marginBottom: responsive.isTablet
        ? responsive.spacing(theme.spacing.xs)
        : responsive.spacing(theme.spacing.s),
      marginLeft: responsive.isTablet
        ? 4
        : responsive.spacing(theme.spacing.xs),
      fontSize: responsive.isTablet ? 16 : 18,
    },
    noItemsText: {
      textAlign: 'center',
      color: theme.colors.onSurfaceVariant,
      marginVertical: responsive.isTablet
        ? responsive.spacing(theme.spacing.xs)
        : responsive.spacing(theme.spacing.s),
      fontStyle: 'italic',
      fontSize: responsive.isTablet ? 13 : 14,
    },
    modifierGroupTouchable: {
      paddingVertical: responsive.isTablet
        ? responsive.spacing(theme.spacing.xs)
        : responsive.spacing(theme.spacing.s),
      paddingHorizontal: responsive.isTablet
        ? responsive.spacing(theme.spacing.s)
        : responsive.spacing(theme.spacing.m),
      marginHorizontal: responsive.isTablet
        ? -responsive.spacing(theme.spacing.s)
        : -responsive.spacing(theme.spacing.m),
    },
    modifierGroupContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    modifierGroupTextContainer: {
      flex: 1,
      marginLeft: responsive.isTablet
        ? responsive.spacing(theme.spacing.s)
        : responsive.spacing(theme.spacing.m),
    },
    modifierGroupName: {
      fontSize: responsive.isTablet ? 13 : 15,
      color: theme.colors.onSurface,
    },
    modifiersList: {
      fontSize: responsive.isTablet ? 11 : 12,
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
      marginTop: responsive.isTablet ? 1 : 2,
    },
    modifiersListContainer: {
      marginTop: responsive.isTablet ? 2 : 4,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: responsive.isTablet ? 2 : 4,
    },
    modifierItem: {
      fontSize: responsive.isTablet ? 11 : 13,
      color: theme.colors.onSurfaceVariant,
      lineHeight: responsive.isTablet ? 15 : 18,
    },
    noModifiersText: {
      fontSize: responsive.isTablet ? 11 : 12,
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
      marginTop: responsive.isTablet ? 2 : 4,
      opacity: 0.7,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'center',
      paddingVertical: responsive.isTablet
        ? responsive.spacing(theme.spacing.s)
        : responsive.spacing(theme.spacing.m),
      paddingHorizontal: responsive.isTablet
        ? responsive.spacing(theme.spacing.m)
        : responsive.spacing(theme.spacing.l),
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      gap: responsive.isTablet
        ? responsive.spacing(theme.spacing.s)
        : responsive.spacing(theme.spacing.m),
    },
    formButton: {
      borderRadius: theme.roundness * 2,
      paddingHorizontal: responsive.isTablet
        ? responsive.spacing(theme.spacing.m)
        : responsive.spacing(theme.spacing.l),
      minWidth: responsive.isTablet ? 100 : 120,
    },
    cancelButton: {
      marginRight: 0,
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
