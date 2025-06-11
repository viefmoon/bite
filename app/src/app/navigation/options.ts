import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { DrawerNavigationOptions } from '@react-navigation/drawer';
import { AppTheme } from '../styles/theme';

export const getDrawerHeaderOptions = (
  theme: AppTheme,
): DrawerNavigationOptions => ({
  headerStyle: {
    backgroundColor: theme.colors.primary,
  },
  headerTintColor: theme.colors.onPrimary,
  headerTitleStyle: {
    ...theme.fonts.titleLarge,
    color: theme.colors.onPrimary,
    fontWeight: 'bold',
  },
  headerShadowVisible: false,
});

export const getStackHeaderOptions = (
  theme: AppTheme,
): NativeStackNavigationOptions => ({
  headerStyle: {
    backgroundColor: theme.colors.elevation.level2,
  },
  headerTintColor: theme.colors.onSurface,
  headerTitleStyle: {
    ...theme.fonts.titleMedium,
    color: theme.colors.onSurface,
    fontWeight: 'bold',
  },
  headerTitleAlign: 'center',
  headerShadowVisible: false,
});
