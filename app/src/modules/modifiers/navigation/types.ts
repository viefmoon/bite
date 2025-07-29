import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { NAVIGATION_PATHS } from '@/app/constants/navigationPaths';

export type ModifiersStackParamList = {
  [NAVIGATION_PATHS.MODIFIER_GROUPS]: undefined;
  [NAVIGATION_PATHS.MODIFIERS]: { groupId: string; groupName: string };
};

export type ModifiersStackScreenProps<T extends keyof ModifiersStackParamList> =
  NativeStackScreenProps<ModifiersStackParamList, T>;
