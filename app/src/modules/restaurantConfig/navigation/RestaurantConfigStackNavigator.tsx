import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppTheme } from '@/app/styles/theme';
import { getStackHeaderOptions } from '@/app/navigation/options';
import RestaurantConfigScreen from '../screens/RestaurantConfigScreen';
import { RestaurantConfigStackParamList } from './types';
import { NAVIGATION_PATHS } from '@/app/constants/navigationPaths';

const Stack = createNativeStackNavigator<RestaurantConfigStackParamList>();

export const RestaurantConfigStackNavigator = () => {
  const theme = useAppTheme();

  return (
    <Stack.Navigator screenOptions={getStackHeaderOptions(theme)}>
      <Stack.Screen
        name={NAVIGATION_PATHS.RESTAURANT_CONFIG}
        component={RestaurantConfigScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};
