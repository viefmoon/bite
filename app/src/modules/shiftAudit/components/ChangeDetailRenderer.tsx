import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import { 
  isChangeDetail, 
  safeStringify,
} from '../utils/orderHistoryUtils';

interface ChangeDetailRendererProps {
  change: unknown;
  fieldName?: string;
  styles: any;
}

export const ChangeDetailRenderer: React.FC<ChangeDetailRendererProps> = ({
  change,
  fieldName,
  styles,
}) => {
  const theme = useAppTheme();

  if (!isChangeDetail(change)) {
    // Para arrays de cambios simples
    if (Array.isArray(change) && change.length === 2) {
      return (
        <View style={styles.changeContainer}>
          <View
            style={[
              styles.errorContainer,
              { backgroundColor: theme.colors.errorContainer },
            ]}
          >
            <Text
              variant="labelSmall"
              style={[
                styles.labelSmallMedium,
                { color: theme.colors.onErrorContainer },
              ]}
            >
              {safeStringify(change[0])}
            </Text>
          </View>
          <Text
            style={[
              styles.marginHorizontal4,
              { color: theme.colors.onSurface },
            ]}
          >
            →
          </Text>
          <View
            style={[
              styles.primaryContainer,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
          >
            <Text
              variant="labelSmall"
              style={[
                styles.labelSmallMedium,
                { color: theme.colors.onPrimaryContainer },
              ]}
            >
              {safeStringify(change[1])}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <Text variant="bodySmall" style={{ color: theme.colors.onSurface }}>
        {safeStringify(change)}
      </Text>
    );
  }

  // Para descripción del item, mostrar en formato vertical si es muy largo
  if (
    (fieldName === 'Descripción del Item' || fieldName === 'Descripción') &&
    (String(change.anterior).length > 30 || String(change.nuevo).length > 30)
  ) {
    return (
      <View style={styles.marginTop4}>
        <View
          style={[
            styles.errorContainer,
            { backgroundColor: theme.colors.errorContainer },
          ]}
        >
          <Text
            variant="labelSmall"
            style={[
              styles.labelSmallMedium,
              { color: theme.colors.onErrorContainer },
            ]}
          >
            Antes:
          </Text>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onErrorContainer }}
          >
            {String(change.anterior)}
          </Text>
        </View>
        <View
          style={[
            styles.primaryContainer,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          <Text
            variant="labelSmall"
            style={[
              styles.labelSmallMedium,
              { color: theme.colors.onPrimaryContainer },
            ]}
          >
            Después:
          </Text>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onPrimaryContainer }}
          >
            {String(change.nuevo)}
          </Text>
        </View>
      </View>
    );
  }

  // Formato horizontal normal
  return (
    <View style={styles.changeContainer}>
      <View
        style={[
          styles.errorContainer,
          { backgroundColor: theme.colors.errorContainer },
        ]}
      >
        <Text
          variant="labelSmall"
          style={[
            styles.labelSmallMedium,
            { color: theme.colors.onErrorContainer },
          ]}
        >
          {String(change.anterior)}
        </Text>
      </View>
      <Text
        style={[
          styles.marginHorizontal4,
          { color: theme.colors.onSurface },
        ]}
      >
        →
      </Text>
      <View
        style={[
          styles.primaryContainer,
          { backgroundColor: theme.colors.primaryContainer },
        ]}
      >
        <Text
          variant="labelSmall"
          style={[
            styles.labelSmallMedium,
            { color: theme.colors.onPrimaryContainer },
          ]}
        >
          {String(change.nuevo)}
        </Text>
      </View>
    </View>
  );
};