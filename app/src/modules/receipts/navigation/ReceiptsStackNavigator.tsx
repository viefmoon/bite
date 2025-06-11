import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ReceiptsScreen } from '../screens/ReceiptsScreen';
import { getStackHeaderOptions } from '@/app/navigation/options';
import { useAppTheme } from '@/app/styles/theme';

export type ReceiptsStackParamList = {
  ReceiptsList: undefined;
};

const Stack = createNativeStackNavigator<ReceiptsStackParamList>();

export const ReceiptsStackNavigator = () => {
  const theme = useAppTheme();
  
  return (
    <Stack.Navigator screenOptions={getStackHeaderOptions(theme)}>
      <Stack.Screen
        name="ReceiptsList"
        component={ReceiptsScreen}
        options={{
          title: 'Recibos',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};