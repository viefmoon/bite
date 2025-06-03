import React, { useMemo, useCallback } from "react";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useSnackbarStore } from "@/app/store/snackbarStore";
import { getApiErrorMessage } from "@/app/lib/errorMapping";
import GenericFormModal, {
  FormFieldConfig,
} from "@/app/components/crud/GenericFormModal";
import { modifierService } from "../services/modifierService";
import { ModifierFormInputs } from "../types/modifier.types";
import {
  Modifier,
  modifierFormValidationSchema, // Cambiado de modifierSchema
  CreateModifierInput,
  UpdateModifierInput,
} from "../schema/modifier.schema";

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onSaveSuccess: () => void;
  initialData?: Modifier | null;
  groupId: string;
}

const formFields: FormFieldConfig<ModifierFormInputs>[] = [
  { name: "name", label: "Nombre *", type: "text", required: true },
  {
    name: "description",
    label: "Descripción (Opcional)",
    type: "textarea",
    numberOfLines: 3,
  },
  {
    name: "price",
    label: "Precio Adicional (Opcional)",
    type: "number",
    inputProps: { keyboardType: "numeric" },
  },
  {
    name: "sortOrder",
    label: "Orden de Visualización",
    type: "number",
    defaultValue: 0,
    inputProps: { keyboardType: "numeric" },
  },
  {
    name: "isDefault",
    label: "Seleccionado por Defecto",
    type: "switch",
    defaultValue: false,
  },
  { name: "isActive", label: "Activo", type: "switch", defaultValue: true },
];

const formSchema = modifierFormValidationSchema;

const ModifierFormModal: React.FC<Props> = ({
  visible,
  onDismiss,
  onSaveSuccess,
  initialData,
  groupId,
}) => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  const isEditing = !!initialData;
  const QUERY_KEY_TO_INVALIDATE = ["modifiers", groupId];

  const mutation = useMutation<
    Modifier,
    Error,
    CreateModifierInput | UpdateModifierInput
  >({
    mutationFn: (data) => {
      if (isEditing && initialData) {
        return modifierService.update(
          initialData.id,
          data as UpdateModifierInput
        );
      } else {
        return modifierService.create(data as CreateModifierInput);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_TO_INVALIDATE });
      showSnackbar({
        message: `Modificador "${data.name}" ${isEditing ? "actualizado" : "creado"} correctamente`,
        type: "success",
      });
      onSaveSuccess();
    },
    onError: (error) => {
      const message = getApiErrorMessage(error);
      showSnackbar({ message, type: "error" });
      console.error("Error saving modifier:", error);
    },
  });

  const handleFormSubmit = useCallback(
    async (formData: ModifierFormInputs) => {
      const dataToSend: CreateModifierInput | UpdateModifierInput = {
        ...formData,
        price:
          formData.price === undefined || isNaN(Number(formData.price))
            ? null
            : Number(formData.price),
        description:
          formData.description === undefined ? null : formData.description,
        sortOrder: formData.sortOrder ?? 0,
        isDefault: formData.isDefault ?? false,
        isActive: formData.isActive ?? true,
        groupId: groupId,
      };

      try {
        await mutation.mutateAsync(dataToSend);
      } catch (error) {
        console.error("Mutation failed in submit handler:", error);
      }
    },
    [
      mutation,
      groupId,
      isEditing,
      initialData?.id,
      onSaveSuccess,
      queryClient,
      showSnackbar,
    ]
  );

  return (
    <GenericFormModal<ModifierFormInputs, Modifier>
      visible={visible}
      onDismiss={onDismiss}
      onSubmit={handleFormSubmit}
      formSchema={formSchema as z.ZodSchema<ModifierFormInputs>}
      formFields={formFields}
      editingItem={initialData ?? null}
      isSubmitting={mutation.isPending}
      modalTitle={(isEditing) =>
        isEditing ? "Editar Modificador" : "Crear Nuevo Modificador"
      }
      initialValues={useMemo(
        () =>
          initialData
            ? {
                name: initialData.name,
                description: initialData.description,
                price: initialData.price,
                sortOrder: initialData.sortOrder,
                isDefault: initialData.isDefault,
                isActive: initialData.isActive,
              }
            : {
                name: "",
                description: null,
                price: null,
                sortOrder: 0,
                isDefault: false,
                isActive: true,
              },
        [initialData]
      )}
    />
  );
};

export default ModifierFormModal;
