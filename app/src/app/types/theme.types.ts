import { MD3Theme } from 'react-native-paper';

export type ThemePreference = 'light' | 'dark' | 'system';

export const THEME_MODE = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

export interface AppTheme extends MD3Theme {}

export interface ThemeState {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}
