import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ServerSettingsScreen } from '../screens/ServerSettingsScreen';
import { getStackHeaderOptions } from '@/app/navigation/options';
import { useAppTheme } from '@/app/styles/theme';
import { useResponsive } from '@/app/hooks/useResponsive';
import type { SettingsStackParamList } from './types';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsStackNavigator() {
  const theme = useAppTheme();
  const responsive = useResponsive();

  return (
    <Stack.Navigator
      screenOptions={{
        ...getStackHeaderOptions(theme, responsive),
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
