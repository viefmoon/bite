import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { DrawerScreenProps } from '@react-navigation/drawer';
import type { DrawerNavigatorParamList } from '@/app/navigation/types';

export type ShiftAuditStackParamList = {
  ShiftsList: undefined;
};

export type ShiftAuditStackScreenProps<
  T extends keyof ShiftAuditStackParamList,
> = CompositeScreenProps<
  NativeStackScreenProps<ShiftAuditStackParamList, T>,
  DrawerScreenProps<DrawerNavigatorParamList>
>;

export type ShiftsListScreenNavigationProp =
  ShiftAuditStackScreenProps<'ShiftsList'>['navigation'];
export type ShiftsListScreenRouteProp =
  ShiftAuditStackScreenProps<'ShiftsList'>['route'];

export type ShiftAuditStackNavigationProp = ShiftsListScreenNavigationProp;
