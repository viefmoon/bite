// Pure TypeScript types remain here
export type ModifierFormInputs = {
  name: string;
  description?: string | null;
  price?: number | null;
  sortOrder?: number;
  isDefault?: boolean;
  isActive?: boolean;
};

// Zod schemas (Modifier, CreateModifierInput, UpdateModifierInput, etc.)
// are defined in ../schema/modifier.schema.ts
