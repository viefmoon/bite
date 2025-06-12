import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppTheme } from '../../../app/styles/theme';
import { getStackHeaderOptions } from '../../../app/navigation/options';
import { PizzaIngredientsStackParamList } from './types';
import PizzaIngredientsScreen from '../screens/PizzaIngredientsScreen';

const Stack = createNativeStackNavigator<PizzaIngredientsStackParamList>();

export function PizzaIngredientsStackNavigator(): JSX.Element {
  const theme = useAppTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...getStackHeaderOptions(theme),
        headerShown: true,
      }}
    >
      <Stack.Screen
        name="PizzaIngredientsList"
        component={PizzaIngredientsScreen}
        options={{
          title: 'Ingredientes de Pizza',
        }}
      />
    </Stack.Navigator>
  );
}