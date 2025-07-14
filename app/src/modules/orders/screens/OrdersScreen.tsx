import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppTheme } from '@/app/styles/theme';
import type { OrdersStackParamList } from '@/app/navigation/types';
import { useGlobalShift } from '@/app/hooks/useGlobalShift';

function OrdersScreen() {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const navigation =
    useNavigation<NativeStackNavigationProp<OrdersStackParamList>>();

  const { data: shift, isLoading: loading } = useGlobalShift();

  const handleOpenOrders = () => {
    if (shift && shift.status === 'OPEN') {
      navigation.navigate('OpenOrders');
    }
  };

  const handleCreateOrder = () => {
    if (shift && shift.status === 'OPEN') {
      navigation.navigate('CreateOrder');
    }
  };

  const isShiftOpen = shift && shift.status === 'OPEN';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Botón Crear Orden */}
          <Button
            mode="contained"
            onPress={handleCreateOrder}
            style={[styles.button, !isShiftOpen && styles.buttonDisabled]}
            contentStyle={styles.buttonContent}
            icon="plus-circle-outline"
            disabled={!isShiftOpen}
          >
            Crear Orden
          </Button>

          {/* Botón Órdenes Abiertas */}
          <Button
            mode="contained"
            onPress={handleOpenOrders}
            style={[styles.button, !isShiftOpen && styles.buttonDisabled]}
            contentStyle={styles.buttonContent}
            icon="folder-open-outline"
            disabled={!isShiftOpen}
          >
            Órdenes Abiertas
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.l,
    },
    title: {
      marginBottom: theme.spacing.l,
      color: theme.colors.onBackground,
    },
    button: {
      width: '90%',
      marginVertical: theme.spacing.l,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonContent: {
      paddingVertical: theme.spacing.m,
    },
  });

export default OrdersScreen;
