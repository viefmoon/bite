import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PizzaCustomizationsListScreen } from '../screens/PizzaCustomizationsListScreen';
import { PizzaCustomizationDetailScreen } from '../screens/PizzaCustomizationDetailScreen';
import { PizzaConfigurationsScreen } from '../screens/PizzaConfigurationsScreen';
import { AssociatePizzaCustomizationsScreen } from '../screens/AssociatePizzaCustomizationsScreen';
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
        component={PizzaCustomizationsListScreen}
      />
      <Stack.Screen
        name="PizzaCustomizationDetail"
        component={PizzaCustomizationDetailScreen}
      />
      <Stack.Screen
        name="PizzaConfigurations"
        component={PizzaConfigurationsScreen}
      />
      <Stack.Screen
        name="AssociatePizzaCustomizations"
        component={AssociatePizzaCustomizationsScreen}
      />
    </Stack.Navigator>
  );
}
