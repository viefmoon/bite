import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import {
  Drawer as PaperDrawer,
  Text,
  Divider,
  Switch,
  TouchableRipple,
  Icon,
  Surface,
} from 'react-native-paper';
import { useThemeStore } from '../../store/themeStore';
import { THEME_MODE } from '../../types/theme.types';
import { useAuthStore } from '../../store/authStore';
import { useAppTheme } from '../../styles/theme';
import { clearImageCache } from '../../lib/imageCache';
import { useSnackbarStore } from '../../store/snackbarStore';
import {
  hasPermission,
  DRAWER_SECTIONS,
  DrawerSection,
} from '../../constants/rolePermissions';
import { generateNavigationAction } from '../helpers/navigationHelpers';
import { RoleEnum } from '@/modules/users/types/user.types';

import type { DrawerContentComponentProps } from '@react-navigation/drawer';

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

export function CustomDrawerContent(props: DrawerContentComponentProps) {
  const theme = useAppTheme();
  const logout = useAuthStore((state) => state.logout);
  const setThemePreference = useThemeStore((state) => state.setThemePreference);
  const user = useAuthStore((state) => state.user);
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
        },
        userInfoSection: {
          padding: theme.spacing.l,
        },
        title: {
          ...theme.fonts.titleMedium,
          color: theme.colors.onSurface,
          marginBottom: 4,
        },
        caption: {
          ...theme.fonts.bodySmall,
          color: theme.colors.onSurfaceVariant,
          marginBottom: 2,
        },
        drawerSection: {
          marginTop: theme.spacing.s,
        },
        bottomDrawerSection: {
          marginBottom: theme.spacing.m,
          marginTop: 'auto',
          borderTopColor: theme.colors.outlineVariant,
          borderTopWidth: StyleSheet.hairlineWidth,
          paddingTop: theme.spacing.s,
        },
        preference: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: 12,
          paddingHorizontal: 16,
          alignItems: 'center',
          marginHorizontal: theme.spacing.s,
          borderRadius: theme.roundness * 2,
        },
        drawerItemLabel: {
          ...theme.fonts.labelLarge,
        },
        drawerItemContainer: {
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: theme.roundness * 2,
          marginHorizontal: theme.spacing.s,
          marginVertical: 2,
        },
        drawerItemActive: {
          backgroundColor: theme.colors.primaryContainer,
        },
        drawerItemIconContainer: {
          marginRight: 32,
          width: 24,
          alignItems: 'center',
        },
        divider: {
          marginVertical: theme.spacing.s,
          marginHorizontal: theme.spacing.m,
        },

        configSubheader: {
          ...theme.fonts.labelLarge,
          color: theme.colors.onSurfaceVariant,
          paddingLeft: 25,
          paddingRight: 16,
          paddingTop: theme.spacing.m,
          paddingBottom: theme.spacing.xs,
        },
      }),
    [theme],
  );

  const getItemActive = (routeName: string) => {
    const currentRoute = props.state.routes[props.state.index];
    return currentRoute?.name === routeName;
  };

  const getItemColor = (routeName: string) => {
    return getItemActive(routeName)
      ? theme.colors.primary
      : theme.colors.onSurfaceVariant;
  };

  const renderDrawerItem = (
    routeName: string,
    label: string,
    iconName: string,
    navigateToScreen: () => void,
  ) => {
    // Verificar permisos antes de renderizar
    if (!hasPermission(user?.role?.id, routeName as DrawerSection)) {
      return null;
    }

    const isActive = getItemActive(routeName);

    return (
      <TouchableRipple
        key={routeName}
        onPress={navigateToScreen}
        style={[
          styles.drawerItemContainer,
          isActive && styles.drawerItemActive,
        ]}
        rippleColor={`${theme.colors.primary}20`}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.drawerItemIconContainer}>
            <Icon source={iconName} size={24} color={getItemColor(routeName)} />
          </View>
          <Text
            style={[styles.drawerItemLabel, { color: getItemColor(routeName) }]}
          >
            {label}
          </Text>
        </View>
      </TouchableRipple>
    );
  };

  // Helper simplificado para renderizar items del drawer
  const renderDrawerItemSimple = (
    route: DrawerSection,
    label: string,
    icon: string,
  ) => {
    return renderDrawerItem(route, label, icon, () => {
      // For kitchen users in KitchenOnlyNavigator, handle navigation differently
      const isKitchenUser = user?.role?.id === 5;
      if (isKitchenUser && route === 'KitchenStack') {
        // Simply navigate to the Kitchen screen without reset
        props.navigation.navigate('Kitchen');
      } else {
        const action = generateNavigationAction(route, user?.role?.id);
        if (action) {
          props.navigation.dispatch(action);
        }
      }
    });
  };

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
    <Surface
      style={{
        flex: 1,
        backgroundColor: theme.colors.surface,
      }}
      elevation={0}
    >
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ paddingTop: 0 }}
      >
        <View style={styles.container}>
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

          {/* Sección de Ventas - Solo visible si tiene permisos */}
          {DRAWER_SECTIONS.sales.items.some((item) =>
            hasPermission(user?.role?.id, item.route as DrawerSection),
          ) && (
            <PaperDrawer.Section style={styles.drawerSection}>
              <Text style={styles.configSubheader}>
                {DRAWER_SECTIONS.sales.title}
              </Text>
              {DRAWER_SECTIONS.sales.items.map((item) =>
                renderDrawerItemSimple(
                  item.route as DrawerSection,
                  item.label,
                  item.icon,
                ),
              )}
            </PaperDrawer.Section>
          )}

          {/* Sección de Cocina - Solo para usuarios con rol kitchen */}
          {hasPermission(user?.role?.id, 'KitchenStack') && (
            <PaperDrawer.Section style={styles.drawerSection}>
              <Text style={styles.configSubheader}>Cocina</Text>
              {renderDrawerItemSimple(
                'KitchenStack',
                'Pantalla de Preparación',
                'chef-hat',
              )}
            </PaperDrawer.Section>
          )}

          {/* Sección de Configuración - Solo visible si tiene permisos */}
          {DRAWER_SECTIONS.configuration.items.some((item) =>
            hasPermission(user?.role?.id, item.route as DrawerSection),
          ) && (
            <>
              <Divider style={styles.divider} />
              <PaperDrawer.Section style={styles.drawerSection}>
                <Text style={styles.configSubheader}>
                  {DRAWER_SECTIONS.configuration.title}
                </Text>
                {DRAWER_SECTIONS.configuration.items.map((item) =>
                  renderDrawerItemSimple(
                    item.route as DrawerSection,
                    item.label,
                    item.icon,
                  ),
                )}
              </PaperDrawer.Section>
            </>
          )}

          {/* Sección de Administración - Solo visible si tiene permisos */}
          {DRAWER_SECTIONS.administration.items.some((item) =>
            hasPermission(user?.role?.id, item.route as DrawerSection),
          ) && (
            <>
              <Divider style={styles.divider} />

              <PaperDrawer.Section style={styles.drawerSection}>
                <Text style={styles.configSubheader}>
                  {DRAWER_SECTIONS.administration.title}
                </Text>
                {DRAWER_SECTIONS.administration.items.map((item) =>
                  renderDrawerItemSimple(
                    item.route as DrawerSection,
                    item.label,
                    item.icon,
                  ),
                )}
              </PaperDrawer.Section>
            </>
          )}
        </View>
      </DrawerContentScrollView>

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
                  size={24}
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
            <View pointerEvents="none">
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
                size={24}
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
            logout();
          }}
          style={styles.drawerItemContainer}
          rippleColor={`${theme.colors.error}20`}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.drawerItemIconContainer}>
              <Icon source="logout" size={24} color={theme.colors.error} />
            </View>
            <Text
              style={[styles.drawerItemLabel, { color: theme.colors.error }]}
            >
              Cerrar Sesión
            </Text>
          </View>
        </TouchableRipple>
      </PaperDrawer.Section>
    </Surface>
  );
}
