import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { DrawerScreenProps } from '@react-navigation/drawer';
import { AppDrawerParamList } from '../../../app/navigation/types';

export type AreasTablesStackParamList = {
  AreasList: undefined;
  TablesList: { areaId: string; areaName: string };
};

export type AreasListScreenProps = NativeStackScreenProps<
  AreasTablesStackParamList,
  'AreasList'
>;
export type TablesListScreenProps = NativeStackScreenProps<
  AreasTablesStackParamList,
  'TablesList'
>;

export type AreasTablesDrawerScreenProps = DrawerScreenProps<
  AppDrawerParamList,
  'AreasTablesStack'
>;
