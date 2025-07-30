import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppTheme } from '../../../app/styles/theme';
import { getStackHeaderOptions } from '../../../app/navigation/options';
import type { MenuStackParamList } from './types';
import { NAVIGATION_PATHS } from '@/app/constants/navigationPaths';

import CategoriesScreen from '../screens/CategoriesScreen';
import SubcategoriesScreen from '../screens/SubcategoriesScreen';
import ProductsScreen from '../screens/ProductsScreen';

const Stack = createNativeStackNavigator<MenuStackParamList>();

export const MenuStackNavigator: React.FC = () => {
  const theme = useAppTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...getStackHeaderOptions(theme),
        headerShown: true,
      }}
    >
      <Stack.Screen
        name={NAVIGATION_PATHS.CATEGORIES}
        component={CategoriesScreen}
        options={{
          title: 'Categorías',
        }}
      />
      <Stack.Screen
        name={NAVIGATION_PATHS.SUBCATEGORIES}
        component={SubcategoriesScreen}
        options={({ route }) => ({
          title: route.params?.categoryName
            ? `Subcategorías de ${route.params.categoryName}`
            : 'Subcategorías',
        })}
      />
      <Stack.Screen
        name={NAVIGATION_PATHS.PRODUCTS}
        component={ProductsScreen}
        options={({ route }) => ({
          title: route.params?.subCategoryName
            ? `Productos de ${route.params.subCategoryName}`
            : 'Productos',
        })}
      />
    </Stack.Navigator>
  );
};
