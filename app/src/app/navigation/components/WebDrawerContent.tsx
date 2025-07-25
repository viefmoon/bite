import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native';
import {
  Drawer as PaperDrawer,
  Text,
  Divider,
  Switch,
  TouchableRipple,
  Icon,
  Surface,
  Portal,
  Dialog,
  Button,
} from 'react-native-paper';
import { useThemeStore } from '../../store/themeStore';
import { THEME_MODE } from '../../types/theme.types';
import { useAuthStore } from '../../store/authStore';
import { useAppTheme, AppTheme } from '../../styles/theme';
import { useResponsive } from '../../hooks/useResponsive';
import { clearImageCache } from '../../lib/imageCache';
import { useSnackbarStore } from '../../store/snackbarStore';
import { RoleEnum } from '@/modules/users/types/user.types';

interface WebDrawerContentProps {
  onClose: () => void;
}

// Traducciones de roles
const ROLE_TRANSLATIONS: Record<number, string> = {
  [RoleEnum.ADMIN]: 'Administrador',
  [RoleEnum.MANAGER]: 'Gerente',
  [RoleEnum.CASHIER]: 'Cajero',
  [RoleEnum.WAITER]: 'Mesero',
  [RoleEnum.KITCHEN]: 'Cocina',
  [RoleEnum.DELIVERY]: 'Repartidor',
};

const getRoleTranslation = (roleId?: number): string => {
  if (!roleId) return 'Desconocido';
  return ROLE_TRANSLATIONS[roleId] || 'Desconocido';
};

const createStyles = (
  theme: AppTheme,
  responsive: ReturnType<typeof useResponsive>,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    userInfoSection: {
      padding: responsive.spacing(theme.spacing.m),
    },
    title: {
      ...theme.fonts.titleMedium,
      fontSize: responsive.fontSize(theme.fonts.titleMedium.fontSize),
      color: theme.colors.onSurface,
      marginBottom: responsive.spacing(4),
    },
    caption: {
      ...theme.fonts.bodySmall,
      fontSize: responsive.fontSize(theme.fonts.bodySmall.fontSize),
      color: theme.colors.onSurfaceVariant,
      marginBottom: responsive.spacing(2),
    },
    drawerSection: {
      marginTop: responsive.spacing(theme.spacing.s),
    },
    bottomDrawerSection: {
      marginBottom: responsive.spacing(theme.spacing.m),
      marginTop: 'auto',
      borderTopColor: theme.colors.outlineVariant,
      borderTopWidth: StyleSheet.hairlineWidth,
      paddingTop: responsive.spacing(theme.spacing.s),
    },
    preference: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: responsive.spacing(theme.spacing.s),
      paddingHorizontal: responsive.spacing(theme.spacing.m),
      alignItems: 'center',
      marginHorizontal: responsive.spacing(theme.spacing.xs),
      borderRadius: theme.roundness * 2,
    },
    drawerItemLabel: {
      ...theme.fonts.labelLarge,
      fontSize: responsive.fontSize(theme.fonts.labelLarge.fontSize),
    },
    drawerItemContainer: {
      paddingHorizontal: responsive.spacing(theme.spacing.m),
      paddingVertical: responsive.spacing(theme.spacing.m),
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: theme.roundness * 2,
      marginHorizontal: responsive.spacing(theme.spacing.xs),
      marginVertical: responsive.spacing(theme.spacing.xxs),
    },
    drawerItemIconContainer: {
      marginRight: responsive.spacing(theme.spacing.l),
      width: responsive.isTablet ? 20 : theme.spacing.l,
      alignItems: 'center',
    },
    divider: {
      marginVertical: responsive.spacing(theme.spacing.s),
      marginHorizontal: responsive.spacing(theme.spacing.m),
    },
    configSubheader: {
      ...theme.fonts.labelLarge,
      fontSize: responsive.fontSize(theme.fonts.labelLarge.fontSize),
      color: theme.colors.onSurfaceVariant,
      paddingLeft: responsive.spacing(theme.spacing.l),
      paddingRight: responsive.spacing(theme.spacing.m),
      paddingTop: responsive.spacing(theme.spacing.s),
      paddingBottom: responsive.spacing(theme.spacing.xxs),
    },
  });

export function WebDrawerContent({ onClose }: WebDrawerContentProps) {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const logout = useAuthStore((state) => state.logout);
  const setThemePreference = useThemeStore((state) => state.setThemePreference);
  const user = useAuthStore((state) => state.user);
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);
  const [showServerSettings, setShowServerSettings] = React.useState(false);

  // Efecto para cerrar con ESC
  React.useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onClose]);

  const styles = React.useMemo(
    () => createStyles(theme, responsive),
    [theme, responsive],
  );

  const handleClearCache = async () => {
    try {
      await clearImageCache();
      showSnackbar({
        message: 'Caché de imágenes limpiado exitosamente',
        type: 'success',
      });
    } catch (error) {
      showSnackbar({
        message: 'Error al limpiar el caché',
        type: 'error',
      });
    }
  };

  return (
    <Surface style={styles.container} elevation={0}>
      <ScrollView
        contentContainerStyle={{ paddingTop: 0 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flex: 1 }}>
          <Surface style={styles.userInfoSection} elevation={0}>
            {user ? (
              <>
                <Text style={styles.title} numberOfLines={1}>
                  {`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() ||
                    user.username ||
                    'Usuario'}
                </Text>
                <Text style={styles.caption} numberOfLines={1}>
                  Rol: {getRoleTranslation(user.role?.id)}
                </Text>
                <Text style={styles.caption} numberOfLines={1}>
                  {user.email ?? ''}
                </Text>
                <Text style={styles.caption} numberOfLines={1}>
                  @{user.username ?? 'username'}
                </Text>
              </>
            ) : (
              <Text style={styles.title}>Invitado</Text>
            )}
          </Surface>
          <Divider style={styles.divider} />

          {/* Sección de Cocina */}
          {user?.role?.id === 5 && (
            <PaperDrawer.Section style={styles.drawerSection}>
              <Text style={styles.configSubheader}>Cocina</Text>
              <TouchableRipple
                onPress={() => {
                  // No need to navigate for kitchen users
                  onClose();
                }}
                style={styles.drawerItemContainer}
                rippleColor={`${theme.colors.primary}20`}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={styles.drawerItemIconContainer}>
                    <Icon
                      source="chef-hat"
                      size={responsive.isTablet ? 20 : 24}
                      color={theme.colors.primary}
                    />
                  </View>
                  <Text
                    style={[
                      styles.drawerItemLabel,
                      { color: theme.colors.primary },
                    ]}
                  >
                    Pantalla de Preparación
                  </Text>
                </View>
              </TouchableRipple>
            </PaperDrawer.Section>
          )}
        </View>
      </ScrollView>

      <PaperDrawer.Section style={styles.bottomDrawerSection}>
        <TouchableRipple
          onPress={() => {
            const newPreference = theme.dark
              ? THEME_MODE.LIGHT
              : THEME_MODE.DARK;
            setThemePreference(newPreference);
          }}
          style={styles.preference}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.drawerItemIconContainer}>
                <Icon
                  source={theme.dark ? 'weather-night' : 'white-balance-sunny'}
                  size={responsive.isTablet ? 20 : 24}
                  color={theme.colors.onSurfaceVariant}
                />
              </View>
              <Text
                style={[
                  styles.drawerItemLabel,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Modo Oscuro
              </Text>
            </View>
            <View style={{ pointerEvents: 'none' }}>
              <Switch value={theme.dark} color={theme.colors.primary} />
            </View>
          </View>
        </TouchableRipple>

        <TouchableRipple
          onPress={handleClearCache}
          style={styles.drawerItemContainer}
          rippleColor={`${theme.colors.primary}20`}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.drawerItemIconContainer}>
              <Icon
                source="broom"
                size={responsive.isTablet ? 20 : 24}
                color={theme.colors.onSurfaceVariant}
              />
            </View>
            <Text
              style={[
                styles.drawerItemLabel,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Limpiar Caché
            </Text>
          </View>
        </TouchableRipple>

        <TouchableRipple
          onPress={() => {
            setShowServerSettings(true);
            onClose();
          }}
          style={styles.drawerItemContainer}
          rippleColor={`${theme.colors.primary}20`}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.drawerItemIconContainer}>
              <Icon
                source="server-network"
                size={responsive.isTablet ? 20 : 24}
                color={theme.colors.onSurfaceVariant}
              />
            </View>
            <Text
              style={[
                styles.drawerItemLabel,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Configuración del Servidor
            </Text>
          </View>
        </TouchableRipple>

        <TouchableRipple
          onPress={() => {
            logout();
          }}
          style={styles.drawerItemContainer}
          rippleColor={`${theme.colors.error}20`}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.drawerItemIconContainer}>
              <Icon
                source="logout"
                size={responsive.isTablet ? 20 : 24}
                color={theme.colors.error}
              />
            </View>
            <Text
              style={[styles.drawerItemLabel, { color: theme.colors.error }]}
            >
              Cerrar Sesión
            </Text>
          </View>
        </TouchableRipple>
      </PaperDrawer.Section>

      {/* Modal de configuración del servidor */}
      {showServerSettings && (
        <Portal>
          <Dialog
            visible={showServerSettings}
            onDismiss={() => setShowServerSettings(false)}
            style={{ maxWidth: 600, alignSelf: 'center' }}
          >
            <Dialog.Title>Configuración del Servidor</Dialog.Title>
            <Dialog.ScrollArea style={{ maxHeight: 400 }}>
              <Text style={{ marginBottom: 16 }}>
                Para configurar el servidor en la versión web, utiliza la
                aplicación móvil.
              </Text>
              <Text style={{ marginBottom: 8 }}>
                La configuración del servidor incluye:
              </Text>
              <Text style={{ marginLeft: 16 }}>
                • Modo de conexión (Auto/Manual)
              </Text>
              <Text style={{ marginLeft: 16 }}>• URL del servidor</Text>
              <Text style={{ marginLeft: 16 }}>• Prueba de conexión</Text>
            </Dialog.ScrollArea>
            <Dialog.Actions>
              <Button onPress={() => setShowServerSettings(false)}>
                Cerrar
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      )}
    </Surface>
  );
}
