import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ShiftsListScreen } from '../screens/ShiftsListScreen';
import type { ShiftAuditStackParamList } from './types';

const Stack = createNativeStackNavigator<ShiftAuditStackParamList>();

export function ShiftAuditStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="ShiftsList"
        component={ShiftsListScreen}
        options={{
          title: 'Historial de Turnos',
        }}
      />
    </Stack.Navigator>
  );
}
