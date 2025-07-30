import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SyncStatusScreen } from '../screens/SyncStatusScreen';
import { NAVIGATION_PATHS } from '@/app/constants/navigationPaths';

export type SyncStackParamList = {
  [NAVIGATION_PATHS.SYNC_STATUS]: undefined;
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
        name={NAVIGATION_PATHS.SYNC_STATUS}
        component={SyncStatusScreen}
        options={{ title: 'Estado de Sincronización' }}
      />
    </Stack.Navigator>
  );
};
