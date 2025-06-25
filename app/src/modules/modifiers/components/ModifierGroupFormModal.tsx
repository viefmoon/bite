import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Modal,
  Portal,
  Text,
  Button,
  TextInput,
  Switch,
  HelperText,
  ActivityIndicator,
} from 'react-native-paper';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAppTheme, AppTheme } from '@/app/styles/theme';
import { useSnackbarStore } from '@/app/store/snackbarStore';
import { getApiErrorMessage } from '@/app/lib/errorMapping';
import { modifierGroupService } from '../services/modifierGroupService';
import {
  ModifierGroup,
  ModifierGroupFormInputs,
  modifierGroupSchema,
  createModifierGroupSchema,
  CreateModifierGroupInput,
  UpdateModifierGroupInput,
} from '../schema/modifierGroup.schema';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onSaveSuccess: () => void;
  initialData?: ModifierGroup | null;
}

const QUERY_KEY_TO_INVALIDATE = ['modifierGroups'];

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    modalSurface: {
      padding: 0,
      margin: theme.spacing.l,
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
    },
    modalTitle: {
      color: theme.colors.onPrimary,
      fontWeight: '700',
      textAlign: 'center',
      fontSize: 20,
    },
    formContainer: {
      maxHeight: '100%',
    },
    scrollViewContent: {
      padding: theme.spacing.l,
      paddingBottom: theme.spacing.xl,
    },
    input: {
      marginBottom: theme.spacing.m,
      backgroundColor: theme.colors.surfaceVariant,
    },
    row: {
      flexDirection: 'row',
      marginHorizontal: -theme.spacing.xs,
      marginBottom: theme.spacing.m,
    },
    column: {
      flex: 1,
      paddingHorizontal: theme.spacing.xs,
    },
    switchComponentContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.m,
      paddingVertical: theme.spacing.s,
    },
    switchLabel: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 16,
      flexShrink: 1,
      marginRight: theme.spacing.m,
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
      borderRadius: theme.roundness,
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
    helperText: {
      marginTop: -theme.spacing.s,
      marginBottom: theme.spacing.s,
    },
    divider: {
      marginVertical: theme.spacing.m,
      backgroundColor: theme.colors.outlineVariant,
    },
  });

const ModifierGroupFormModal: React.FC<Props> = ({
  visible,
  onDismiss,
  onSaveSuccess,
  initialData,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  const isEditing = !!initialData;

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
    // setValue, // No se usa actualmente
  } = useForm<ModifierGroupFormInputs>({
    resolver: zodResolver(modifierGroupSchema),
    defaultValues: {
      name: '',
      description: null,
      minSelections: 0,
      maxSelections: 2,
      isRequired: false,
      allowMultipleSelections: false,
      isActive: true,
      sortOrder: 0,
    },
  });

  const watchedAllowMultipleSelections = watch('allowMultipleSelections');

  useEffect(() => {
    if (visible) {
      if (initialData) {
        reset({
          name: initialData.name,
          description: initialData.description,
          minSelections: initialData.minSelections ?? 0,
          maxSelections: initialData.maxSelections ?? 1,
          isRequired: initialData.isRequired ?? false,
          allowMultipleSelections: initialData.allowMultipleSelections ?? false,
          isActive: initialData.isActive ?? true,
          sortOrder: initialData.sortOrder ?? 0,
        });
      } else {
        reset({
          name: '',
          description: null,
          minSelections: 0,
          maxSelections: 2,
          isRequired: false,
          allowMultipleSelections: false,
          isActive: true,
          sortOrder: 0,
        });
      }
    }
  }, [initialData, visible, reset]);

  const mutation = useMutation<
    ModifierGroup,
    Error,
    CreateModifierGroupInput | UpdateModifierGroupInput
  >({
    mutationFn: (data) => {
      if (isEditing && initialData) {
        return modifierGroupService.update(
          initialData.id,
          data as UpdateModifierGroupInput,
        );
      } else {
        const createData = createModifierGroupSchema.parse(
          data as ModifierGroupFormInputs,
        );
        return modifierGroupService.create(createData);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_TO_INVALIDATE });
      showSnackbar({
        message: `Grupo "${data.name}" ${
          isEditing ? 'actualizado' : 'creado'
        } correctamente`,
        type: 'success',
      });
      onSaveSuccess();
    },
    onError: (error) => {
      const message = getApiErrorMessage(error);
      showSnackbar({ message, type: 'error' });
      console.error('Error saving modifier group:', error);
    },
  });

  const onSubmit: SubmitHandler<ModifierGroupFormInputs> = (formData) => {
    mutation.mutate(formData);
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalSurface}
        dismissable={!isSubmitting}
      >
        <View style={styles.formContainer}>
          <View style={styles.modalHeader}>
            <Text variant="titleLarge" style={styles.modalTitle}>
              {isEditing
                ? 'Editar Grupo de Modificadores'
                : 'Crear Nuevo Grupo'}
            </Text>
          </View>

          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <Controller
              name="name"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Nombre *"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={!!errors.name}
                  style={styles.input}
                  disabled={isSubmitting}
                  mode="outlined"
                />
              )}
            />
            {errors.name && (
              <HelperText
                type="error"
                visible={!!errors.name}
                style={styles.helperText}
              >
                {errors.name.message}
              </HelperText>
            )}

            <Controller
              name="description"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Descripción (Opcional)"
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={!!errors.description}
                  style={styles.input}
                  multiline
                  numberOfLines={3}
                  disabled={isSubmitting}
                  mode="outlined"
                />
              )}
            />
            {errors.description && (
              <HelperText
                type="error"
                visible={!!errors.description}
                style={styles.helperText}
              >
                {errors.description.message}
              </HelperText>
            )}

            <View style={styles.switchComponentContainer}>
              <Text style={styles.switchLabel}>
                Permitir Múltiples Selecciones
              </Text>
              <Controller
                name="allowMultipleSelections"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <Switch
                    value={value}
                    onValueChange={onChange}
                    disabled={isSubmitting}
                  />
                )}
              />
            </View>
            {errors.allowMultipleSelections && (
              <HelperText
                type="error"
                visible={!!errors.allowMultipleSelections}
                style={styles.helperText}
              >
                {errors.allowMultipleSelections.message}
              </HelperText>
            )}

            <View
              style={[
                styles.row,
                !watchedAllowMultipleSelections ? { opacity: 0.5 } : {},
              ]}
            >
              <View style={styles.column}>
                <Controller
                  name="minSelections"
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      label="Mín. Selecciones"
                      value={String(value ?? 0)}
                      onChangeText={(text) => onChange(parseInt(text, 10) || 0)}
                      onBlur={onBlur}
                      error={!!errors.minSelections}
                      style={styles.input}
                      keyboardType="numeric"
                      disabled={!watchedAllowMultipleSelections || isSubmitting}
                      mode="outlined"
                    />
                  )}
                />
                {errors.minSelections && (
                  <HelperText
                    type="error"
                    visible={!!errors.minSelections}
                    style={styles.helperText}
                  >
                    {errors.minSelections.message}
                  </HelperText>
                )}
              </View>
              <View style={styles.column}>
                <Controller
                  name="maxSelections"
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      label="Máx. Selecciones *"
                      value={String(value ?? 1)}
                      onChangeText={(text) => onChange(parseInt(text, 10) || 1)}
                      onBlur={onBlur}
                      error={!!errors.maxSelections}
                      style={styles.input}
                      keyboardType="numeric"
                      disabled={!watchedAllowMultipleSelections || isSubmitting}
                      mode="outlined"
                    />
                  )}
                />
                {errors.maxSelections && (
                  <HelperText
                    type="error"
                    visible={!!errors.maxSelections}
                    style={styles.helperText}
                  >
                    {errors.maxSelections.message}
                  </HelperText>
                )}
              </View>
            </View>

            <View style={styles.switchComponentContainer}>
              <Text style={styles.switchLabel}>Es Requerido</Text>
              <Controller
                name="isRequired"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <Switch
                    value={value}
                    onValueChange={onChange}
                    disabled={isSubmitting}
                  />
                )}
              />
            </View>
            {errors.isRequired && (
              <HelperText
                type="error"
                visible={!!errors.isRequired}
                style={styles.helperText}
              >
                {errors.isRequired.message}
              </HelperText>
            )}

            <Controller
              name="sortOrder"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Orden de visualización"
                  value={String(value ?? 0)}
                  onChangeText={(text) => onChange(parseInt(text, 10) || 0)}
                  onBlur={onBlur}
                  error={!!errors.sortOrder}
                  style={styles.input}
                  keyboardType="numeric"
                  disabled={isSubmitting}
                  mode="outlined"
                />
              )}
            />
            {errors.sortOrder && (
              <HelperText
                type="error"
                visible={!!errors.sortOrder}
                style={styles.helperText}
              >
                {errors.sortOrder.message}
              </HelperText>
            )}

            <View style={styles.switchComponentContainer}>
              <Text style={styles.switchLabel}>Está Activo</Text>
              <Controller
                name="isActive"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <Switch
                    value={value}
                    onValueChange={onChange}
                    disabled={isSubmitting}
                  />
                )}
              />
            </View>
            {errors.isActive && (
              <HelperText
                type="error"
                visible={!!errors.isActive}
                style={styles.helperText}
              >
                {errors.isActive.message}
              </HelperText>
            )}
          </ScrollView>

          {isSubmitting && (
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
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              style={styles.formButton}
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              {isEditing ? 'Actualizar' : 'Crear'}
            </Button>
          </View>
        </View>
      </Modal>
    </Portal>
  );
};

export default ModifierGroupFormModal;
