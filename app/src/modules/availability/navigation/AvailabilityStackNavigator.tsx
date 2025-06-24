import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AvailabilityScreen } from '../screens/AvailabilityScreen';
import { AvailabilityStackParamList } from './types';
import { getStackHeaderOptions } from '@/app/navigation/options';
import { useAppTheme } from '@/app/styles/theme';

const Stack = createNativeStackNavigator<AvailabilityStackParamList>();

export const AvailabilityStackNavigator = () => {
  const theme = useAppTheme();

  return (
    <Stack.Navigator screenOptions={getStackHeaderOptions(theme)}>
      <Stack.Screen
        name="AvailabilityScreen"
        component={AvailabilityScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};
