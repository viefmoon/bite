import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper'; // useTheme no se usa directamente aquí ahora
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppTheme } from '@/app/styles/theme';
import type { OrdersStackParamList } from '@/app/navigation/types'; // Importar tipos de navegación

function OrdersScreen() {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const navigation =
    useNavigation<NativeStackNavigationProp<OrdersStackParamList>>(); // Hook de navegación

  const handleOpenOrders = () => {
    navigation.navigate('OpenOrders'); // Navegar a la pantalla de órdenes abiertas
  };

  const handleCreateOrder = () => {
    navigation.navigate('CreateOrder'); // Navegar a la pantalla de creación
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Botón Crear Orden - Ahora primero */}
        <Button
          mode="contained"
          onPress={handleCreateOrder}
          style={styles.button}
          contentStyle={styles.buttonContent} // Añadir padding interno
          icon="plus-circle-outline"
        >
          Crear Orden
        </Button>
        {/* Botón Órdenes Abiertas - Ahora segundo */}
        <Button
          mode="contained"
          onPress={handleOpenOrders}
          style={styles.button}
          contentStyle={styles.buttonContent} // Añadir padding interno
          icon="folder-open-outline"
        >
          Órdenes Abiertas
        </Button>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.l, // Usa el spacing del tema
    },
    title: {
      marginBottom: theme.spacing.l, // Usa el spacing del tema
      color: theme.colors.onBackground,
    },
    button: {
      width: '90%', // Mantener ancho
      marginVertical: theme.spacing.l, // Aumentar más el margen vertical
    },
    buttonContent: {
      paddingVertical: theme.spacing.m, // Aumentar más el padding vertical para mayor altura
    },
  });

export default OrdersScreen;
