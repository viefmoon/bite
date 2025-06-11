import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AreasTablesStackParamList } from './types';
import AreasScreen from '../screens/AreasScreen';
import TablesScreen from '../screens/TablesScreen';
import { useAppTheme } from '../../../app/styles/theme';
import { getStackHeaderOptions } from '../../../app/navigation/options';

const Stack = createNativeStackNavigator<AreasTablesStackParamList>();

const AreasTablesStackNavigator = () => {
  const theme = useAppTheme();

  return (
    <Stack.Navigator
      initialRouteName="AreasList"
      screenOptions={{
        ...getStackHeaderOptions(theme),
      }}
    >
      <Stack.Screen
        name="AreasList"
        component={AreasScreen}
        options={{
          title: 'Áreas',
        }}
      />
      <Stack.Screen
        name="TablesList"
        component={TablesScreen}
        options={({ route }) => ({
          title: `Mesas de ${route.params.areaName || 'Área'}`,
        })}
      />
    </Stack.Navigator>
  );
};

export default AreasTablesStackNavigator;
