import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { AppTheme } from '../styles/theme';
import { ResponsiveInfo } from '../hooks/useResponsive';

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
