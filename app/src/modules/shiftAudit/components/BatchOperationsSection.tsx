import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import { BatchOperation } from '../types/orderHistory';
import { 
  isBatchOperation, 
  getOperationLabel,
  formatFieldName 
} from '../utils/orderHistoryUtils';
import { ChangeDetailRenderer } from './ChangeDetailRenderer';

interface BatchOperationsSectionProps {
  batchOperations: BatchOperation[];
  styles: Record<string, any>;
}

export const BatchOperationsSection: React.FC<BatchOperationsSectionProps> = ({
  batchOperations,
  styles,
}) => {
  const theme = useAppTheme();

  return (
    <View style={styles.changesContainer}>
      <Text
        variant="bodySmall"
        style={[styles.batchTitle, { color: theme.colors.primary }]}
      >
        Cambios realizados en una sola edición:
      </Text>

      {batchOperations
        .filter(isBatchOperation)
        .map((op, idx) => (
          <View
            key={idx}
            style={[
              styles.batchOperationContainer,
              idx < batchOperations.length - 1
                ? styles.batchOperationMarginBottom
                : styles.batchOperationNoMargin,
              {
                borderLeftColor: theme.colors.primary + '30',
              },
            ]}
          >
            <View style={styles.batchOperationRow}>
              <Text
                style={[
                  styles.batchBulletText,
                  { color: theme.colors.primary },
                ]}
              >
                •
              </Text>
              <View style={styles.batchOperationContent}>
                <Text
                  variant="labelSmall"
                  style={[
                    styles.batchOperationLabel,
                    { color: theme.colors.primary },
                  ]}
                >
                  {getOperationLabel(op.operation)}
                </Text>

                {/* Mostrar descripción del item */}
                {(op.itemDescription || op.snapshot?.itemDescription) && (
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.batchOperationDescription,
                      {
                        color: theme.colors.onSurface,
                        backgroundColor: theme.colors.surface,
                      },
                    ]}
                  >
                    {op.itemDescription || op.snapshot?.itemDescription}
                  </Text>
                )}

                {/* Para UPDATE, mostrar el cambio */}
                {op.operation === 'UPDATE' && op.formattedChanges && (
                  <View style={styles.batchUpdateMargin}>
                    {Object.entries(op.formattedChanges)
                      .filter(([fieldName]) => {
                        // Solo mostrar campos relevantes (no precios)
                        const allowedFields = [
                          'quantity',
                          'notes',
                          'specialInstructions',
                          'preparationNotes',
                          'status',
                        ];
                        return allowedFields.some((allowed) =>
                          fieldName.includes(allowed),
                        );
                      })
                      .map(([field, change]) => (
                        <View
                          key={field}
                          style={styles.batchFieldContainer}
                        >
                          <Text
                            variant="labelSmall"
                            style={[
                              styles.batchFieldLabel,
                              { color: theme.colors.onSurfaceVariant },
                            ]}
                          >
                            {formatFieldName(field)}:
                          </Text>
                          <ChangeDetailRenderer
                            change={change}
                            fieldName={field}
                            styles={styles}
                          />
                        </View>
                      ))}
                  </View>
                )}
              </View>
            </View>
          </View>
        ))}
    </View>
  );
};