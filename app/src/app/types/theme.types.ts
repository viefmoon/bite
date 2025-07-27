import { z } from 'zod';
import { MD3Theme } from 'react-native-paper';

export const themePreferenceSchema = z.enum(['light', 'dark', 'system']);
export type ThemePreference = z.infer<typeof themePreferenceSchema>;


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
