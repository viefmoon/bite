import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

export type ReceiptsStackParamList = {
  ReceiptsList: undefined;
};

export type ReceiptsListScreenNavigationProp = NativeStackNavigationProp<
  ReceiptsStackParamList,
  'ReceiptsList'
>;

export type ReceiptsListScreenRouteProp = RouteProp<
  ReceiptsStackParamList,
  'ReceiptsList'
>;