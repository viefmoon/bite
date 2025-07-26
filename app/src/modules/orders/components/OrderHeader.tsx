import { StyleSheet, View } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import CartButton from './CartButton';
import { useAppTheme } from '@/app/styles/theme';

interface OrderHeaderProps {
  title: string;
  itemCount: number;
  onBackPress?: () => void;
  onCartPress: () => void;
  isCartVisible: boolean;
}

const OrderHeader = ({
  title,
  itemCount,
  onBackPress,
  onCartPress,
  isCartVisible,
}: OrderHeaderProps) => {
  const theme = useAppTheme();

  const styles = StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 4,
      paddingVertical: 8,
      backgroundColor: theme.colors.elevation.level2,
      elevation: 0,
      shadowOpacity: 0,
    },
    headerTitle: {
      ...theme.fonts.titleMedium,
      color: theme.colors.onSurface,
      fontWeight: 'bold',
      textAlign: 'center',
      flex: 1,
    },
    headerSpacer: {
      width: 48,
    },
  });

  return (
    <View style={styles.header}>
      {onBackPress ? (
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={onBackPress}
          iconColor={theme.colors.onSurface}
        />
      ) : (
        <View style={styles.headerSpacer} />
      )}

      <Text style={styles.headerTitle}>{title}</Text>

      {!isCartVisible ? (
        <CartButton itemCount={itemCount} onPress={onCartPress} />
      ) : (
        <View style={styles.headerSpacer} />
      )}
    </View>
  );
};

export default OrderHeader;
