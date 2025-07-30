import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PizzaManagementScreen } from '../screens/PizzaManagementScreen';
import type { PizzaCustomizationsStackParamList } from './types';
import { NAVIGATION_PATHS } from '@/app/constants/navigationPaths';

const Stack = createNativeStackNavigator<PizzaCustomizationsStackParamList>();

export function PizzaCustomizationsStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name={NAVIGATION_PATHS.PIZZA_CUSTOMIZATIONS_LIST}
        component={PizzaManagementScreen}
      />
    </Stack.Navigator>
  );
}
