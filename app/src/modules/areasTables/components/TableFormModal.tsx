import React from "react";
import GenericFormModal, {
  FormFieldConfig,
} from "../../../app/components/crud/GenericFormModal";
import {
  Table,
  CreateTableDto,
  UpdateTableDto,
  CreateTableSchema,
  UpdateTableSchema,
} from "../schema/table.schema";
import { z } from "zod";

const tableFormFields: FormFieldConfig<CreateTableDto | UpdateTableDto>[] = [
  {
    name: "name",
    label: "Nombre de la Mesa",
    type: "text",
    placeholder: "Ej: Mesa 1, Barra 2",
    required: true,
  },
  {
    name: "capacity",
    label: "Capacidad (Opcional)",
    type: "number",
    placeholder: "Ej: 4",
    inputProps: { keyboardType: "numeric" },
  },
  {
    name: "isActive",
    label: "¿Está activa?",
    type: "switch",
    switchLabel: "Activa",
    defaultValue: true,
  },
];

interface TableFormModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (
    data: CreateTableDto | UpdateTableDto,
    photoId: string | null | undefined
  ) => Promise<void>;
  editingItem: Table | null;
  isSubmitting: boolean;
}

const TableFormModal: React.FC<TableFormModalProps> = ({
  visible,
  onDismiss,
  onSubmit,
  editingItem,
  isSubmitting,
}) => {
  const isEditing = !!editingItem;

  const formSchema = isEditing ? UpdateTableSchema : CreateTableSchema;
  const initialValues = isEditing
    ? {
        name: editingItem?.name,
        capacity: editingItem?.capacity ?? undefined,
        isActive: editingItem?.isActive,
      }
    : {
        name: "",
        capacity: undefined,
        isActive: true,
      };

  return (
    <GenericFormModal<CreateTableDto | UpdateTableDto, Table>
      visible={visible}
      onDismiss={onDismiss}
      onSubmit={onSubmit}
      formSchema={formSchema as z.ZodSchema<CreateTableDto | UpdateTableDto>}
      formFields={tableFormFields}
      initialValues={initialValues}
      editingItem={editingItem}
      isSubmitting={isSubmitting}
      modalTitle={(isEditing) =>
        isEditing ? "Editar Mesa" : "Crear Nueva Mesa"
      }
    />
  );
};

export default TableFormModal;
