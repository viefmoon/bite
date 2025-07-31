import { memo, useMemo } from 'react';
import SelectionGroup from './SelectionGroup';
import type { FullMenuModifierGroup, Modifier } from '../schema/orders.schema';
import type { CartItemModifier } from '../utils/cartUtils';

interface ModifierGroupProps {
  group: FullMenuModifierGroup;
  selectedModifiers: CartItemModifier[];
  onModifierToggle: (modifier: Modifier, group: FullMenuModifierGroup) => void;
  errorMessage?: string;
}

const ModifierGroup = memo<ModifierGroupProps>(
  ({ group, selectedModifiers, onModifierToggle, errorMessage }) => {
    const getSelectionRulesText = useMemo(() => {
      if (
        group.minSelections !== undefined &&
        group.maxSelections !== undefined
      ) {
        if ((group.minSelections || 0) === 0 && group.maxSelections === 1) {
          return 'Hasta 1 opción';
        }
        if ((group.minSelections || 0) === group.maxSelections) {
          return `Elegir ${group.maxSelections}`;
        }
        return `${group.minSelections || 0}-${group.maxSelections} opciones`;
      }
      return undefined;
    }, [group.minSelections, group.maxSelections]);

    const handleModifierSelect = (modifierId: string) => {
      const modifier = group.productModifiers?.find(
        (m: Modifier) => m.id === modifierId,
      );
      if (modifier) {
        onModifierToggle(modifier, group);
      }
    };

    if (!group.productModifiers || group.productModifiers.length === 0) {
      return null;
    }

    return (
      <SelectionGroup
        title={group.name}
        items={group.productModifiers}
        selectedIds={selectedModifiers.map((mod) => mod.id)}
        onSelect={handleModifierSelect}
        isRequired={group.isRequired}
        allowMultipleSelections={group.allowMultipleSelections}
        errorMessage={errorMessage}
        selectionRules={getSelectionRulesText}
      />
    );
  },
);

ModifierGroup.displayName = 'ModifierGroup';

export default ModifierGroup;
