import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OrdersScreen from '../../modules/orders/screens/OrdersScreen';
import CreateOrderScreen from '../../modules/orders/screens/CreateOrderScreen';
import OpenOrdersScreen from '../../modules/orders/screens/OpenOrdersScreen';
import AddProductsToOrderScreen from '../../modules/orders/screens/AddProductsToOrderScreen';

import type { OrdersStackParamList } from '../../modules/orders/navigation/types';
import { useAppTheme } from '../styles/theme';
import { getStackHeaderOptions } from './options';
import { NAVIGATION_PATHS } from '@/app/constants/navigationPaths';

const Stack = createNativeStackNavigator<OrdersStackParamList>();

function OrdersStackNavigator() {
  const theme = useAppTheme();

  return (
    <Stack.Navigator
      initialRouteName={NAVIGATION_PATHS.ORDERS}
      screenOptions={{
        ...getStackHeaderOptions(theme),
      }}
    >
      <Stack.Screen
        name={NAVIGATION_PATHS.ORDERS}
        component={OrdersScreen}
        options={{ title: 'Órdenes' }}
      />
      <Stack.Screen
        name={NAVIGATION_PATHS.CREATE_ORDER}
        component={CreateOrderScreen}
        options={{ title: 'Crear Nueva Orden', headerShown: false }}
      />
      <Stack.Screen
        name={NAVIGATION_PATHS.OPEN_ORDERS}
        component={OpenOrdersScreen}
        options={{ title: 'Órdenes Abiertas' }}
      />
      <Stack.Screen
        name={NAVIGATION_PATHS.ADD_PRODUCTS_TO_ORDER}
        component={AddProductsToOrderScreen}
        options={{ title: 'Añadir Productos', headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default OrdersStackNavigator;
