import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SyncStatusScreen } from '../screens/SyncStatusScreen';

export type SyncStackParamList = {
  SyncStatus: undefined;
};

const Stack = createNativeStackNavigator<SyncStackParamList>();

export const SyncStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="SyncStatus"
        component={SyncStatusScreen}
        options={{ title: 'Estado de Sincronización' }}
      />
    </Stack.Navigator>
  );
};
