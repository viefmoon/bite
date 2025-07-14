import React from 'react';
import GenericDetailModal from '@/app/components/crud/GenericDetailModal';
import { useAppTheme } from '@/app/styles/theme';
import {
  CustomizationType,
  PizzaCustomization,
} from '../types/pizzaCustomization.types';

interface PizzaCustomizationDetailModalProps {
  visible: boolean;
  onDismiss: () => void;
  customization: PizzaCustomization | null;
  onEdit?: (customization: PizzaCustomization) => void;
  onDelete?: (customization: PizzaCustomization) => void;
  isDeleting?: boolean;
}

export function PizzaCustomizationDetailModal({
  visible,
  onDismiss,
  customization,
  onEdit,
  onDelete,
  isDeleting = false,
}: PizzaCustomizationDetailModalProps) {

  if (!customization) return null;

  const handleEdit = () => {
    if (onEdit) {
      onEdit(customization);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(customization);
    }
  };

  // Configurar campos dinámicamente según el tipo
  const fieldsToDisplay = [
    {
      field: 'type',
      label: 'Tipo',
      render: (type) =>
        type === CustomizationType.FLAVOR ? 'Sabor' : 'Ingrediente',
    },
    // Solo mostrar ingredientes si es tipo FLAVOR
    ...(customization.type === CustomizationType.FLAVOR
      ? [
          {
            field: 'ingredients',
            label: 'Ingredientes',
            render: (ingredients) => ingredients || 'Sin ingredientes',
          },
        ]
      : []),
    {
      field: 'toppingValue',
      label: 'Valor de topping',
      render: (value) => value?.toString() || '0',
    },
    {
      field: 'sortOrder',
      label: 'Orden de visualización',
      render: (value) => value?.toString() || '0',
    },
    {
      field: 'products',
      label: 'Asociado a productos',
      render: (products) => {
        if (!products || products.length === 0) {
          return 'No asociado a ningún producto';
        }
        const productNames = products.map((p) => p.name).join(', ');
        return `${products.length} producto${products.length > 1 ? 's' : ''}: ${productNames}`;
      },
    },
  ];

  return (
    <GenericDetailModal
      visible={visible}
      onDismiss={onDismiss}
      item={customization}
      titleField="name"
      statusConfig={{
        field: 'isActive',
        activeValue: true,
        activeLabel: 'Activo',
        inactiveLabel: 'Inactivo',
      }}
      fieldsToDisplay={fieldsToDisplay}
      onEdit={onEdit ? handleEdit : undefined}
      onDelete={onDelete ? handleDelete : undefined}
      isDeleting={isDeleting}
    />
  );
}
