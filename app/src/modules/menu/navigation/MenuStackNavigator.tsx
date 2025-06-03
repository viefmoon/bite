import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAppTheme } from "../../../app/styles/theme";
import { getStackHeaderOptions } from "../../../app/navigation/options";
import type { MenuStackParamList } from "./types.ts";

import CategoriesScreen from "../screens/CategoriesScreen";
import SubcategoriesScreen from "../screens/SubcategoriesScreen";
import ProductsScreen from "../screens/ProductsScreen";

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
        name="CategoriesScreen"
        component={CategoriesScreen}
        options={{
          title: "Categorías",
        }}
      />
      <Stack.Screen
        name="SubcategoriesScreen"
        component={SubcategoriesScreen}
        options={({ route }) => ({
          title: route.params?.categoryName
            ? `Subcategorías de ${route.params.categoryName}`
            : "Subcategorías",
        })}
      />
      <Stack.Screen
        name="Products"
        component={ProductsScreen}
        options={({ route }) => ({
          title: route.params?.subCategoryName
            ? `Productos de ${route.params.subCategoryName}`
            : "Productos",
        })}
      />
    </Stack.Navigator>
  );
};
