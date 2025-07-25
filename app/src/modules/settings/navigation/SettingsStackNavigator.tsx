import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ServerSettingsScreen } from '../screens/ServerSettingsScreen';
import { getDefaultScreenOptions } from '@/app/navigation/options';
import { useAppTheme } from '@/app/styles/theme';
import type { SettingsStackParamList } from './types';

const Stack = createStackNavigator<SettingsStackParamList>();

export function SettingsStackNavigator() {
  const theme = useAppTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...getDefaultScreenOptions(theme),
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="ServerSettings"
        component={ServerSettingsScreen}
        options={{
          title: 'Configuración del Servidor',
        }}
      />
    </Stack.Navigator>
  );
}
