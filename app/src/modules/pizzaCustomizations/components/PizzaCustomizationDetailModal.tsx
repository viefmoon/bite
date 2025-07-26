import React from 'react';
import GenericDetailModal from '@/app/components/crud/GenericDetailModal';
import {
  CustomizationTypeEnum,
  PizzaCustomization,
} from '../schema/pizzaCustomization.schema';

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
  const fieldsToDisplay: Array<{
    field: keyof PizzaCustomization;
    label: string;
    render?: (value: any, item: PizzaCustomization) => React.ReactNode;
  }> = [
    {
      field: 'type' as keyof PizzaCustomization,
      label: 'Tipo',
      render: (type: string) =>
        type === CustomizationTypeEnum.FLAVOR ? 'Sabor' : 'Ingrediente',
    },
    // Solo mostrar ingredientes si es tipo FLAVOR
    ...(customization.type === CustomizationTypeEnum.FLAVOR
      ? [
          {
            field: 'ingredients' as keyof PizzaCustomization,
            label: 'Ingredientes',
            render: (ingredients: string | null) => ingredients || 'Sin ingredientes',
          },
        ]
      : []),
    {
      field: 'toppingValue' as keyof PizzaCustomization,
      label: 'Valor de topping',
      render: (value: number) => value?.toString() || '0',
    },
    {
      field: 'sortOrder' as keyof PizzaCustomization,
      label: 'Orden de visualización',
      render: (value: number) => value?.toString() || '0',
    },
    {
      field: 'products' as keyof PizzaCustomization,
      label: 'Asociado a productos',
      render: (products: Array<{ id: string; name: string }> | undefined) => {
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
