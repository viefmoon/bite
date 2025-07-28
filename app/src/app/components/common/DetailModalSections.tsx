import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { useAppTheme } from '../../styles/theme';
import AutoImage from './AutoImage';

// Sección de imagen
interface ImageSectionProps {
  source: string | null | undefined;
  placeholderIcon?: string;
  style?: ViewStyle;
}

export const ImageSection: React.FC<ImageSectionProps> = ({
  source,
  placeholderIcon = 'image-outline',
  style,
}) => (
  <AutoImage
    source={source}
    placeholderIcon={placeholderIcon}
    style={[styles.image, style]}
    contentFit="contain"
  />
);

// Sección de estado
interface StatusSectionProps<T> {
  item: T;
  config: {
    field: keyof T;
    activeValue: T[keyof T];
    activeLabel: string;
    inactiveLabel: string;
  };
}

export function StatusSection<T>({ item, config }: StatusSectionProps<T>) {
  const theme = useAppTheme();
  const isActive = item[config.field] === config.activeValue;

  return (
    <View style={styles.statusContainer}>
      <Chip
        mode="flat"
        compact
        style={[
          styles.statusChip,
          {
            backgroundColor: isActive
              ? theme.colors.successContainer
              : theme.colors.surfaceVariant,
          },
        ]}
      >
        {isActive ? config.activeLabel : config.inactiveLabel}
      </Chip>
    </View>
  );
}

// Sección de descripción
interface DescriptionSectionProps {
  description: string;
}

export const DescriptionSection: React.FC<DescriptionSectionProps> = ({
  description,
}) => <Text style={styles.description}>{description}</Text>;

// Sección de campos adicionales
export interface FieldConfig<T> {
  field: keyof T;
  label: string;
  render?: (value: T[keyof T], item: T) => React.ReactNode;
}

interface FieldsSectionProps<T> {
  item: T;
  fields: FieldConfig<T>[];
}

export function FieldsSection<T>({ item, fields }: FieldsSectionProps<T>) {
  const theme = useAppTheme();

  if (fields.length === 0) return null;

  return (
    <View
      style={[
        styles.fieldsContainer,
        { backgroundColor: theme.colors.surfaceVariant },
      ]}
    >
      {fields.map(({ field, label, render }) => {
        const value = item[field];
        return (
          <View key={String(field)} style={styles.fieldRow}>
            <Text
              style={[
                styles.fieldLabel,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {label}:
            </Text>
            <Text
              style={[styles.fieldValue, { color: theme.colors.onSurface }]}
              numberOfLines={2}
            >
              {render
                ? render(value, item)
                : typeof value === 'boolean'
                  ? value
                    ? 'Sí'
                    : 'No'
                  : String(value ?? 'N/A')}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: 160,
    height: 160,
    alignSelf: 'center',
    borderRadius: 12,
    marginBottom: 10,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statusChip: {
    paddingHorizontal: 16,
  },
  description: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 22,
  },
  fieldsContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  fieldLabel: {
    fontWeight: '500',
    flex: 1,
    fontSize: 14,
  },
  fieldValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '600',
  },
});
