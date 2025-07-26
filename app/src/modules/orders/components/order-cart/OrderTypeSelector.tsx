import React from 'react';
import { View, StyleSheet } from 'react-native';
import { RadioButton } from 'react-native-paper';
import { OrderTypeEnum, type OrderType } from '../../types/orders.types';
import { useAppTheme } from '@/app/styles/theme';

interface OrderTypeSelectorProps {
  value: OrderType;
  onValueChange: (type: OrderType) => void;
  disabled?: boolean;
}

export const OrderTypeSelector: React.FC<OrderTypeSelectorProps> = ({
  value,
  onValueChange,
  disabled = false,
}) => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <RadioButton.Group
        onValueChange={(newValue) => onValueChange(newValue as OrderType)}
        value={value}
      >
        <View style={styles.radioGroup}>
          <RadioButton.Item
            label="COMER AQUÍ"
            value={OrderTypeEnum.DINE_IN}
            style={styles.radioButtonItem}
            labelStyle={styles.radioLabel}
            position="leading"
            disabled={disabled}
          />
          <RadioButton.Item
            label="PARA LLEVAR"
            value={OrderTypeEnum.TAKE_AWAY}
            style={styles.radioButtonItem}
            labelStyle={styles.radioLabel}
            position="leading"
            disabled={disabled}
          />
          <RadioButton.Item
            label="DOMICILIO"
            value={OrderTypeEnum.DELIVERY}
            style={styles.radioButtonItem}
            labelStyle={styles.radioLabel}
            position="leading"
            disabled={disabled}
          />
        </View>
      </RadioButton.Group>
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.xs,
      marginBottom: theme.spacing.xs,
    },
    radioGroup: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    radioButtonItem: {
      flex: 1,
      paddingVertical: 0,
      paddingHorizontal: 0,
      marginHorizontal: theme.spacing.xxs,
    },
    radioLabel: {
      fontSize: 13,
      fontWeight: '600',
      textAlign: 'center',
      marginLeft: 4,
    },
  });