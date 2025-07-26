import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CustomersScreen from '../screens/CustomersScreen';

export type CustomersStackParamList = {
  Customers: undefined;
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
        name="Customers"
        component={CustomersScreen}
        options={{
          title: 'Clientes',
        }}
      />
    </Stack.Navigator>
  );
}
