import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { DrawerNavigationOptions } from '@react-navigation/drawer';
import { AppTheme } from '../styles/theme';
import { ResponsiveInfo } from '../hooks/useResponsive';

export const getDrawerHeaderOptions = (
  theme: AppTheme,
  responsive?: ResponsiveInfo,
): DrawerNavigationOptions => ({
  headerStyle: {
    backgroundColor: theme.colors.primary,
  },
  headerTintColor: theme.colors.onPrimary,
  headerTitleStyle: {
    ...theme.fonts.titleLarge,
    color: theme.colors.onPrimary,
    fontWeight: 'bold',
    fontSize: responsive?.fontSizePreset.xl,
  },
  headerShadowVisible: false,
});

export const getStackHeaderOptions = (
  theme: AppTheme,
  responsive?: ResponsiveInfo,
): NativeStackNavigationOptions => ({
  headerStyle: {
    backgroundColor: theme.colors.elevation.level2,
  },
  headerTintColor: theme.colors.onSurface,
  headerTitleStyle: {
    ...theme.fonts.titleMedium,
    color: theme.colors.onSurface,
    fontWeight: 'bold',
    fontSize: responsive?.fontSizePreset.l,
  },
  headerTitleAlign: 'center',
  headerShadowVisible: false,
});
