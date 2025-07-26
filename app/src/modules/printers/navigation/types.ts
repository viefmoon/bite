import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { DrawerScreenProps } from '@react-navigation/drawer';
import { AppDrawerParamList } from '@/app/navigation/types';

export type PrintersStackParamList = {
  PrintersList: undefined;
};

export type PrintersListScreenProps = NativeStackScreenProps<
  PrintersStackParamList,
  'PrintersList'
>;

export type PrintersDrawerScreenProps = DrawerScreenProps<
  AppDrawerParamList,
  'PrintersStack'
>;
