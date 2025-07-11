import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PreparationScreensStackParamList } from './types';
import PreparationScreensScreen from '../screens/PreparationScreensScreen';
import { useAppTheme } from '../../../app/styles/theme';
import { getStackHeaderOptions } from '../../../app/navigation/options';

const Stack = createNativeStackNavigator<PreparationScreensStackParamList>();

const PreparationScreensStackNavigator = () => {
  const theme = useAppTheme();

  return (
    <Stack.Navigator
      initialRouteName="PreparationScreensList"
      screenOptions={{
        ...getStackHeaderOptions(theme),
      }}
    >
      <Stack.Screen
        name="PreparationScreensList"
        component={PreparationScreensScreen}
        options={{
          title: 'Pantallas de Preparación',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default PreparationScreensStackNavigator;
