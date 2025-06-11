import React from 'react';
import GenericFormModal, {
  FormFieldConfig,
} from '../../../app/components/crud/GenericFormModal';
import {
  PreparationScreen,
  CreatePreparationScreenDto,
  UpdatePreparationScreenDto,
  CreatePreparationScreenSchema,
  UpdatePreparationScreenSchema,
} from '../schema/preparationScreen.schema';
import {
  useCreatePreparationScreen,
  useUpdatePreparationScreen,
} from '../hooks/usePreparationScreensQueries';
import { z } from 'zod';

// Definición de los campos del formulario para Pantallas de Preparación
const preparationScreenFormFields: FormFieldConfig<
  CreatePreparationScreenDto | UpdatePreparationScreenDto
>[] = [
  {
    name: 'name',
    label: 'Nombre de la Pantalla',
    type: 'text',
    placeholder: 'Ej: Cocina Principal, Barra Fría',
    required: true,
    // maxLength: 100, // Eliminado: La validación está en el schema Zod
  },
  {
    name: 'description',
    label: 'Descripción (Opcional)',
    type: 'textarea',
    placeholder: 'Ej: Pantalla para órdenes de cocina caliente',
    numberOfLines: 3,
    // maxLength: 255, // Eliminado: La validación está en el schema Zod
  },
  {
    name: 'isActive',
    label: '¿Está activa?',
    type: 'switch',
    switchLabel: 'Activa',
    defaultValue: true,
  },
  // Nota: El campo 'productIds' no se incluye aquí por simplicidad.
  // Su manejo requeriría un componente de selección múltiple más complejo.
  // Podría añadirse en una iteración futura si es necesario.
];

interface PreparationScreenFormModalProps {
  visible: boolean;
  onDismiss: () => void;
  editingItem: PreparationScreen | null;
  onSubmitSuccess?: () => void; // Callback opcional para éxito
}

const PreparationScreenFormModal: React.FC<PreparationScreenFormModalProps> = ({
  visible,
  onDismiss,
  editingItem,
  onSubmitSuccess,
}) => {
  const isEditing = !!editingItem;

  // Hooks de mutación
  const createScreen = useCreatePreparationScreen();
  const updateScreen = useUpdatePreparationScreen();

  // Determinar el esquema y los valores iniciales según si se está editando o creando
  const formSchema = isEditing
    ? UpdatePreparationScreenSchema
    : CreatePreparationScreenSchema;
  const initialValues = isEditing
    ? {
        name: editingItem?.name,
        description: editingItem?.description ?? undefined,
        isActive: editingItem?.isActive,
        // productIds: editingItem?.productIds ?? undefined, // Omitido del form
      }
    : {
        name: '',
        description: undefined,
        isActive: true,
        // productIds: undefined, // Omitido del form
      };

  // Determinar si el formulario está en proceso de envío
  const isSubmitting = createScreen.isPending || updateScreen.isPending;

  // Función para manejar el envío del formulario
  const handleSubmit = async (
    data: CreatePreparationScreenDto | UpdatePreparationScreenDto,
  ) => {
    try {
      if (isEditing && editingItem) {
        await updateScreen.mutateAsync({
          id: editingItem.id,
          data: data as UpdatePreparationScreenDto,
        });
      } else {
        await createScreen.mutateAsync(data as CreatePreparationScreenDto);
      }
      onSubmitSuccess?.(); // Llamar al callback de éxito si existe
      onDismiss(); // Cerrar el modal después del éxito
    } catch (error) {
      // El manejo de errores (snackbar) ya está en los hooks de mutación
      console.error('Error submitting preparation screen form:', error);
    }
  };

  return (
    <GenericFormModal<
      CreatePreparationScreenDto | UpdatePreparationScreenDto,
      PreparationScreen
    >
      visible={visible}
      onDismiss={onDismiss}
      // Pasamos una función wrapper para handleSubmit que no espera el segundo argumento (photoId)
      onSubmit={(data) => handleSubmit(data)}
      formSchema={
        formSchema as z.ZodSchema<
          CreatePreparationScreenDto | UpdatePreparationScreenDto
        >
      }
      formFields={preparationScreenFormFields}
      initialValues={initialValues}
      editingItem={editingItem}
      isSubmitting={isSubmitting}
      modalTitle={(isEditing) =>
        isEditing ? 'Editar Pantalla de Preparación' : 'Crear Nueva Pantalla'
      }
      // No necesitamos pasar 'photoField' si no manejamos imágenes
    />
  );
};

export default PreparationScreenFormModal;
