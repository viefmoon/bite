import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CustomersScreen from '../screens/CustomersScreen';
import { NAVIGATION_PATHS } from '@/app/constants/navigationPaths';

export type CustomersStackParamList = {
  [NAVIGATION_PATHS.CUSTOMERS]: undefined;
  CustomerDetail?: { customerId: string };
  CustomerAddresses?: { customerId: string };
  CustomerChatHistory?: { customerId: string };
};

const Stack = createNativeStackNavigator<CustomersStackParamList>();

export function CustomersStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name={NAVIGATION_PATHS.CUSTOMERS}
        component={CustomersScreen}
        options={{
          title: 'Clientes',
        }}
      />
    </Stack.Navigator>
  );
}
