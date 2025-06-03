
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PrintersStackParamList } from './types';
import PrintersScreen from '../screens/PrintersScreen'; // Importar la pantalla creada
import { useAppTheme } from '@/app/styles/theme';
import { getStackHeaderOptions } from '@/app/navigation/options';

const Stack = createNativeStackNavigator<PrintersStackParamList>();

const PrintersStackNavigator = () => {
  const theme = useAppTheme();

  return (
    <Stack.Navigator
      initialRouteName="PrintersList"
      screenOptions={{
        ...getStackHeaderOptions(theme),
      }}
    >
      <Stack.Screen
        name="PrintersList"
        component={PrintersScreen}
        options={{
          title: 'Impresoras', // Título para la pantalla de lista
        }}
      />
    </Stack.Navigator>
  );
};

export default PrintersStackNavigator;