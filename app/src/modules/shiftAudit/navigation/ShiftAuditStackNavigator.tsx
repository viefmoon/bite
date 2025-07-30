import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ShiftsListScreen } from '../screens/ShiftsListScreen';
import type { ShiftAuditStackParamList } from './types';
import { NAVIGATION_PATHS } from '@/app/constants/navigationPaths';

const Stack = createNativeStackNavigator<ShiftAuditStackParamList>();

export function ShiftAuditStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name={NAVIGATION_PATHS.SHIFTS_LIST}
        component={ShiftsListScreen}
        options={{
          title: 'Historial de Turnos',
        }}
      />
    </Stack.Navigator>
  );
}
