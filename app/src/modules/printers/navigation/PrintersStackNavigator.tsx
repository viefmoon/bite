import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PrintersStackParamList } from './types';
import PrintersScreen from '../screens/PrintersScreen';
import { useAppTheme } from '@/app/styles/theme';
import { getStackHeaderOptions } from '@/app/navigation/options';
import { NAVIGATION_PATHS } from '@/app/constants/navigationPaths';

const Stack = createNativeStackNavigator<PrintersStackParamList>();

const PrintersStackNavigator = () => {
  const theme = useAppTheme();

  return (
    <Stack.Navigator
      initialRouteName={NAVIGATION_PATHS.PRINTERS_LIST}
      screenOptions={{
        ...getStackHeaderOptions(theme),
      }}
    >
      <Stack.Screen
        name={NAVIGATION_PATHS.PRINTERS_LIST}
        component={PrintersScreen}
        options={{
          title: 'Impresoras',
        }}
      />
    </Stack.Navigator>
  );
};

export default PrintersStackNavigator;
