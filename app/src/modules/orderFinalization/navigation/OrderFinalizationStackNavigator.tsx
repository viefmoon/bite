import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OrderFinalizationScreen } from '../screens/OrderFinalizationScreen';
import { OrderFinalizationStackParamList } from './types';
import { defaultScreenOptions } from '@/app/navigation/options';

const Stack = createNativeStackNavigator<OrderFinalizationStackParamList>();

export const OrderFinalizationStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={defaultScreenOptions}>
      <Stack.Screen
        name="OrderFinalizationScreen"
        component={OrderFinalizationScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};