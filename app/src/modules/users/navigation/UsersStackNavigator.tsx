import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { UsersListScreen } from '../screens';

export type UsersStackParamList = {
  UsersList: undefined;
};

const Stack = createNativeStackNavigator<UsersStackParamList>();

export function UsersStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="UsersList"
        component={UsersListScreen}
        options={{
          title: 'Usuarios',
        }}
      />
    </Stack.Navigator>
  );
}
