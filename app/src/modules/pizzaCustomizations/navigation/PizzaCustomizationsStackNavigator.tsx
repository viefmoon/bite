import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PizzaManagementScreen } from '../screens/PizzaManagementScreen';
import type { PizzaCustomizationsStackParamList } from './types';

const Stack = createNativeStackNavigator<PizzaCustomizationsStackParamList>();

export function PizzaCustomizationsStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="PizzaCustomizationsList"
        component={PizzaManagementScreen}
      />
    </Stack.Navigator>
  );
}
