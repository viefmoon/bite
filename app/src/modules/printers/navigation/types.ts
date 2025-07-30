import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { DrawerScreenProps } from '@react-navigation/drawer';
import { AppDrawerParamList } from '@/app/navigation/types';
import { NAVIGATION_PATHS } from '@/app/constants/navigationPaths';

export type PrintersStackParamList = {
  [NAVIGATION_PATHS.PRINTERS_LIST]: undefined;
};

export type PrintersListScreenProps = NativeStackScreenProps<
  PrintersStackParamList,
  typeof NAVIGATION_PATHS.PRINTERS_LIST
>;

export type PrintersDrawerScreenProps = DrawerScreenProps<
  AppDrawerParamList,
  typeof NAVIGATION_PATHS.PRINTERS_STACK
>;
