import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OrderFinalizationScreen } from '../screens/OrderFinalizationScreen';
import { OrderFinalizationStackParamList } from './types';
import { NAVIGATION_PATHS } from '@/app/constants/navigationPaths';

const Stack = createNativeStackNavigator<OrderFinalizationStackParamList>();

export const OrderFinalizationStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name={NAVIGATION_PATHS.ORDER_FINALIZATION}
        component={OrderFinalizationScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};
