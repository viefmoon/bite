import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OrdersScreen from '../../modules/orders/screens/OrdersScreen';
import CreateOrderScreen from '../../modules/orders/screens/CreateOrderScreen';
import OpenOrdersScreen from '../../modules/orders/screens/OpenOrdersScreen';
import AddProductsToOrderScreen from '../../modules/orders/screens/AddProductsToOrderScreen';

import type { OrdersStackParamList } from './types';
import { useAppTheme } from '../styles/theme';
import { getStackHeaderOptions } from './options';

const Stack = createNativeStackNavigator<OrdersStackParamList>();

function OrdersStackNavigator() {
  const theme = useAppTheme();

  return (
    <Stack.Navigator
      initialRouteName="Orders"
      screenOptions={{
        ...getStackHeaderOptions(theme),
      }}
    >
      <Stack.Screen
        name="Orders"
        component={OrdersScreen}
        options={{ title: 'Órdenes' }}
      />
      <Stack.Screen
        name="CreateOrder"
        component={CreateOrderScreen}
        options={{ title: 'Crear Nueva Orden', headerShown: false }}
      />
      <Stack.Screen
        name="OpenOrders"
        component={OpenOrdersScreen}
        options={{ title: 'Órdenes Abiertas' }}
      />
      <Stack.Screen
        name="AddProductsToOrder"
        component={AddProductsToOrderScreen}
        options={{ title: 'Añadir Productos', headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default OrdersStackNavigator;
