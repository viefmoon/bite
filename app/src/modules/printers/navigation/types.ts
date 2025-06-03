
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { DrawerScreenProps } from '@react-navigation/drawer';
import { AppDrawerParamList } from '@/app/navigation/types'; // Importar tipos del Drawer principal

export type PrintersStackParamList = {
  PrintersList: undefined; // La pantalla de lista no recibe parámetros

};

export type PrintersListScreenProps = NativeStackScreenProps<
  PrintersStackParamList,
  'PrintersList'
>;

export type PrintersDrawerScreenProps = DrawerScreenProps<
  AppDrawerParamList,
  'PrintersStack' // El nombre que le daremos en el Drawer Navigator
>;