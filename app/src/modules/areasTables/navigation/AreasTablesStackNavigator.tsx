import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AreasTablesStackParamList } from './types';
import AreasScreen from '../screens/AreasScreen';
import TablesScreen from '../screens/TablesScreen';
import { useAppTheme } from '../../../app/styles/theme';
import { getStackHeaderOptions } from '../../../app/navigation/options';
import { NAVIGATION_PATHS } from '@/app/constants/navigationPaths';

const Stack = createNativeStackNavigator<AreasTablesStackParamList>();

const AreasTablesStackNavigator = () => {
  const theme = useAppTheme();

  return (
    <Stack.Navigator
      initialRouteName={NAVIGATION_PATHS.AREAS_LIST}
      screenOptions={{
        ...getStackHeaderOptions(theme),
      }}
    >
      <Stack.Screen
        name={NAVIGATION_PATHS.AREAS_LIST}
        component={AreasScreen}
        options={{
          title: 'Áreas',
        }}
      />
      <Stack.Screen
        name={NAVIGATION_PATHS.TABLES_LIST}
        component={TablesScreen}
        options={({ route }) => ({
          title: `Mesas de ${route.params.areaName || 'Área'}`,
        })}
      />
    </Stack.Navigator>
  );
};

export default AreasTablesStackNavigator;
