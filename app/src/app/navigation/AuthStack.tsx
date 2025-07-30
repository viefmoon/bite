import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppTheme } from '../styles/theme';

import LoginScreen from '../../modules/auth/screens/LoginScreen';
import type { AuthStackParamList } from './types';
import { NAVIGATION_PATHS } from '@/app/constants/navigationPaths';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  const theme = useAppTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.onPrimary,
        headerTitleStyle: {
          ...theme.fonts.titleLarge,
        },
      }}
    >
      <Stack.Screen
        name={NAVIGATION_PATHS.LOGIN}
        component={LoginScreen}
        options={{
          title: 'Iniciar Sesión',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
