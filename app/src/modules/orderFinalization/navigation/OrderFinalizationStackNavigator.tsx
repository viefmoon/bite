import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OrderFinalizationScreen } from '../screens/OrderFinalizationScreen';
import { OrderFinalizationStackParamList } from './types';

const Stack = createNativeStackNavigator<OrderFinalizationStackParamList>();

export const OrderFinalizationStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="OrderFinalizationScreen"
        component={OrderFinalizationScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};
