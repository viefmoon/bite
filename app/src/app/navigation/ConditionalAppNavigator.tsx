import { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Portal, Dialog, Button, Text } from 'react-native-paper';
import { useAuthStore } from '../stores/authStore';
import { AppDrawerNavigator } from './AppDrawerNavigator';
import { KitchenOnlyNavigator } from './KitchenOnlyNavigator';
import { useAppTheme } from '../styles/theme';
import { RoleEnum } from '@/modules/users/schema/user.schema';

export function ConditionalAppNavigator() {
  const theme = useAppTheme();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [loading, setLoading] = useState(true);
  const [showNoScreenAlert, setShowNoScreenAlert] = useState(false);
  const [isKitchenUser, setIsKitchenUser] = useState(false);

  const styles = {
    loadingContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      backgroundColor: theme.colors.background,
    },
    dialogSurface: {
      backgroundColor: theme.colors.surface,
    },
    dialogTitleCenter: {
      textAlign: 'center' as const,
    },
    dialogContentCenter: {
      textAlign: 'center' as const,
    },
    dialogContentSpaced: {
      textAlign: 'center' as const,
      marginTop: 8,
    },
  };

  const checkUserAccess = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Obtener el ID del rol
      const roleId = typeof user.role === 'object' ? user.role?.id : null;

      // Solo verificar pantalla para usuarios con rol kitchen
      if (roleId === RoleEnum.KITCHEN) {
        setIsKitchenUser(true);
        // La información de la pantalla ya viene en el objeto user
        const hasScreen = !!user.preparationScreen;

        if (!hasScreen) {
          // Usuario de cocina sin pantalla asignada
          setShowNoScreenAlert(true);
        }
      } else {
        setIsKitchenUser(false);
      }
    } catch (error) {
      setIsKitchenUser(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkUserAccess();
  }, [checkUserAccess]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Usuarios de cocina usan un navegador especial, otros usan el drawer normal
  return (
    <>
      {isKitchenUser ? <KitchenOnlyNavigator /> : <AppDrawerNavigator />}
      <Portal>
        <Dialog
          visible={showNoScreenAlert}
          onDismiss={() => setShowNoScreenAlert(false)}
          style={styles.dialogSurface}
        >
          <Dialog.Icon
            icon="alert-circle"
            size={64}
            color={theme.colors.error}
          />
          <Dialog.Title style={styles.dialogTitleCenter}>
            Sin Pantalla Asignada
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyLarge" style={styles.dialogContentCenter}>
              Tu usuario de cocina no tiene una pantalla de preparación
              asignada.
            </Text>
            <Text variant="bodyMedium" style={styles.dialogContentSpaced}>
              Por favor, contacta a tu administrador para que te asigne una
              pantalla de preparación.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowNoScreenAlert(false)}>
              Entendido
            </Button>
            <Button
              mode="contained"
              onPress={async () => {
                setShowNoScreenAlert(false);
                await logout();
              }}
            >
              Cerrar Sesión
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}
