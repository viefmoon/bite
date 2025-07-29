import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { DrawerScreenProps } from '@react-navigation/drawer';
import { AppDrawerParamList } from '../../../app/navigation/types';
import { NAVIGATION_PATHS } from '@/app/constants/navigationPaths';

export type AreasTablesStackParamList = {
  [NAVIGATION_PATHS.AREAS_LIST]: undefined;
  [NAVIGATION_PATHS.TABLES_LIST]: { areaId: string; areaName: string };
};

export type AreasListScreenProps = NativeStackScreenProps<
  AreasTablesStackParamList,
  typeof NAVIGATION_PATHS.AREAS_LIST
>;
export type TablesListScreenProps = NativeStackScreenProps<
  AreasTablesStackParamList,
  typeof NAVIGATION_PATHS.TABLES_LIST
>;

export type AreasTablesDrawerScreenProps = DrawerScreenProps<
  AppDrawerParamList,
  typeof NAVIGATION_PATHS.AREAS_TABLES_STACK
>;
