import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AvailabilityScreen } from '../screens/AvailabilityScreen';
import { AvailabilityStackParamList } from './types';
import { defaultScreenOptions } from '@/app/navigation/options';

const Stack = createNativeStackNavigator<AvailabilityStackParamList>();

export const AvailabilityStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={defaultScreenOptions}>
      <Stack.Screen
        name="AvailabilityScreen"
        component={AvailabilityScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};