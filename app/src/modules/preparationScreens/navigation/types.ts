import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { DrawerScreenProps } from '@react-navigation/drawer';
import { AppDrawerParamList } from '../../../app/navigation/types';

// Definir los parámetros para cada pantalla dentro de este Stack Navigator
export type PreparationScreensStackParamList = {
  PreparationScreensList: undefined; // La pantalla de lista no recibe parámetros
};

// Tipos específicos para las props de cada pantalla del Stack
export type PreparationScreensListScreenProps = NativeStackScreenProps<
  PreparationScreensStackParamList,
  'PreparationScreensList'
>;

// Tipo para las props de este Stack cuando se usa dentro del Drawer principal
export type PreparationScreensDrawerScreenProps = DrawerScreenProps<
  AppDrawerParamList,
  'PreparationScreensStack'
>;
