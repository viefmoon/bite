import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import KitchenOrdersScreen from '../screens/KitchenOrdersScreen';

export type KitchenStackParamList = {
  KitchenOrders: undefined;
};

const Stack = createNativeStackNavigator<KitchenStackParamList>();

export default function KitchenNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="KitchenOrders" component={KitchenOrdersScreen} />
    </Stack.Navigator>
  );
}
