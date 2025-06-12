import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppTheme } from '@/app/styles/theme';
import { getStackHeaderOptions } from '@/app/navigation/options';
import RestaurantConfigScreen from '../screens/RestaurantConfigScreen';
import { RestaurantConfigStackParamList } from './types';

const Stack = createNativeStackNavigator<RestaurantConfigStackParamList>();

export const RestaurantConfigStackNavigator = () => {
  const theme = useAppTheme();

  return (
    <Stack.Navigator screenOptions={getStackHeaderOptions(theme)}>
      <Stack.Screen
        name="RestaurantConfig"
        component={RestaurantConfigScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};