import { memo } from 'react';
import SelectionGroup from './SelectionGroup';
import type { ProductVariant } from '../schema/orders.schema';

interface VariantSelectionGroupProps {
  variants: ProductVariant[];
  selectedVariantId?: string;
  onVariantSelect: (variantId: string) => void;
  errorMessage?: string;
}

const VariantSelectionGroup = memo<VariantSelectionGroupProps>(
  ({ variants, selectedVariantId, onVariantSelect, errorMessage }) => {
    return (
      <SelectionGroup
        title="Variantes"
        items={variants}
        selectedIds={selectedVariantId ? [selectedVariantId] : []}
        onSelect={onVariantSelect}
        isRequired={true}
        allowMultipleSelections={false}
        errorMessage={errorMessage}
      />
    );
  },
);

VariantSelectionGroup.displayName = 'VariantSelectionGroup';

export default VariantSelectionGroup;
