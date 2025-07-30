import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack';
import { ModifiersStackParamList } from './types';
import ModifierGroupsScreen from '../screens/ModifierGroupsScreen';
import ModifiersScreen from '../screens/ModifiersScreen';
import { useAppTheme } from '@/app/styles/theme';
import { getStackHeaderOptions } from '@/app/navigation/options';
import { NAVIGATION_PATHS } from '@/app/constants/navigationPaths';

const Stack = createNativeStackNavigator<ModifiersStackParamList>();

const ModifiersStackNavigator = () => {
  const theme = useAppTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...getStackHeaderOptions(theme),
      }}
    >
      <Stack.Screen
        name={NAVIGATION_PATHS.MODIFIER_GROUPS}
        component={ModifierGroupsScreen}
        options={(): NativeStackNavigationOptions => ({
          title: 'Grupos de Modificadores',
        })}
      />
      <Stack.Screen
        name={NAVIGATION_PATHS.MODIFIERS}
        component={ModifiersScreen}
        options={{ title: 'Modificadores' }}
      />
    </Stack.Navigator>
  );
};

export default ModifiersStackNavigator;
