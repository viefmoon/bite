import React from 'react';
import GenericFormModal, {
  FormFieldConfig,
} from '../../../app/components/crud/GenericFormModal';
import type { Area } from '@/app/schemas/domain/area.schema';
import {
  CreateAreaDto,
  UpdateAreaDto,
  CreateAreaSchema,
  UpdateAreaSchema,
} from '../schema/area.schema';
import { z } from 'zod';

const areaFormFields: FormFieldConfig<CreateAreaDto | UpdateAreaDto>[] = [
  {
    name: 'name',
    label: 'Nombre del Área',
    type: 'text',
    placeholder: 'Ej: Terraza, Salón Principal',
    required: true,
  },
  {
    name: 'description',
    label: 'Descripción (Opcional)',
    type: 'textarea',
    placeholder: 'Ej: Área al aire libre con vista',
    numberOfLines: 3,
  },
  {
    name: 'isActive',
    label: '¿Está activa?',
    type: 'switch',
    switchLabel: 'Activa',
    defaultValue: true,
  },
];

interface AreaFormModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (
    data: CreateAreaDto | UpdateAreaDto,
    photoId: string | null | undefined,
  ) => Promise<void>;
  editingItem: Area | null;
  isSubmitting: boolean;
}

const AreaFormModal: React.FC<AreaFormModalProps> = ({
  visible,
  onDismiss,
  onSubmit,
  editingItem,
  isSubmitting,
}) => {
  const isEditing = !!editingItem;

  const formSchema = isEditing ? UpdateAreaSchema : CreateAreaSchema;
  const initialValues = isEditing
    ? {
        name: editingItem?.name,
        description: editingItem?.description ?? undefined,
        isActive: editingItem?.isActive,
      }
    : {
        name: '',
        description: undefined,
        isActive: true,
      };

  return (
    <GenericFormModal<CreateAreaDto | UpdateAreaDto, Area>
      visible={visible}
      onDismiss={onDismiss}
      onSubmit={onSubmit}
      formSchema={formSchema as z.ZodSchema<CreateAreaDto | UpdateAreaDto>}
      formFields={areaFormFields}
      initialValues={initialValues}
      editingItem={editingItem}
      isSubmitting={isSubmitting}
      modalTitle={(isEditing) =>
        isEditing ? 'Editar Área' : 'Crear Nueva Área'
      }
    />
  );
};

export default AreaFormModal;
