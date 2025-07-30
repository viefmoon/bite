import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { NAVIGATION_PATHS } from '@/app/constants/navigationPaths';

// Definir los parámetros para cada pantalla dentro de este Stack Navigator
export type PreparationScreensStackParamList = {
  [NAVIGATION_PATHS.PREPARATION_SCREENS_LIST]: undefined; // La pantalla de lista no recibe parámetros
};

// Tipos específicos para las props de cada pantalla del Stack
export type PreparationScreensListScreenProps = NativeStackScreenProps<
  PreparationScreensStackParamList,
  typeof NAVIGATION_PATHS.PREPARATION_SCREENS_LIST
>;
