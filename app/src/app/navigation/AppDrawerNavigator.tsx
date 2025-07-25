import React from 'react';
import {
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  View,
  Text,
} from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { MenuStackNavigator } from '../../modules/menu/navigation/MenuStackNavigator';
import ModifiersStackNavigator from '../../modules/modifiers/navigation/ModifiersStackNavigator';
import PreparationScreensStackNavigator from '../../modules/preparationScreens/navigation/PreparationScreensStackNavigator';
import AreasTablesStackNavigator from '../../modules/areasTables/navigation/AreasTablesStackNavigator';
import OrdersStackNavigator from './OrdersStackNavigator';
import PrintersStackNavigator from '../../modules/printers/navigation/PrintersStackNavigator';
import { ReceiptsStackNavigator } from '../../modules/receipts/navigation/ReceiptsStackNavigator';
import { AvailabilityScreen } from '../../modules/availability/screens/AvailabilityScreen';
import { OrderFinalizationStackNavigator } from '../../modules/orderFinalization/navigation/OrderFinalizationStackNavigator';
import { RestaurantConfigStackNavigator } from '../../modules/restaurantConfig/navigation/RestaurantConfigStackNavigator';
import { CustomersStackNavigator } from '../../modules/customers/navigation/CustomersStackNavigator';
import { PizzaCustomizationsStackNavigator } from '../../modules/pizzaCustomizations/navigation/PizzaCustomizationsStackNavigator';
import { SyncStackNavigator } from '../../modules/sync/navigation/SyncStackNavigator';
import { UsersListScreen } from '../../modules/users/screens/UsersListScreen';
import KitchenOrdersScreen from '../../modules/kitchen/screens/KitchenOrdersScreen';
import { ShiftAuditStackNavigator } from '../../modules/shiftAudit/navigation/ShiftAuditStackNavigator';
import { SettingsStackNavigator } from '../../modules/settings/navigation/SettingsStackNavigator';
import { ServerSettingsScreen } from '../../modules/settings/screens/ServerSettingsScreen';

import { CustomDrawerContent } from './components/CustomDrawerContent';
import { useAppTheme } from '../styles/theme';
import { Icon, Surface, Checkbox, Text as PaperText } from 'react-native-paper';
import type { AppDrawerParamList } from './types';
import { useResponsive } from '../hooks/useResponsive';
import { ConnectionIndicator } from '../components/ConnectionIndicator';
import { ShiftIndicator } from '../components/ShiftIndicator';
import { useAuthStore } from '../store/authStore';
import { KitchenFilterButton } from '../../modules/kitchen/components/KitchenFilterButton';
import { useKitchenStore } from '../../modules/kitchen/store/kitchenStore';
import { OrderType } from '../../modules/kitchen/types/kitchen.types';

const Drawer = createDrawerNavigator<AppDrawerParamList>();

export function AppDrawerNavigator() {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const user = useAuthStore((state) => state.user);
  const { filters, setFilters } = useKitchenStore();
  const kitchenScreenName =
    user?.preparationScreen?.name || 'Pantalla de Preparación';

  // Obtener el texto del filtro activo
  const getFilterText = () => {
    switch (filters.orderType) {
      case OrderType.DINE_IN:
        return ' • Mesa';
      case OrderType.TAKE_AWAY:
        return ' • Llevar';
      case OrderType.DELIVERY:
        return ' • Domicilio';
      default:
        return '';
    }
  };

  // Ruta inicial por defecto (no-kitchen users)
  const initialRouteName = 'OrdersStack';

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        drawerButtonContainer: {
          width: 56,
          height: 56,
          justifyContent: 'center',
          alignItems: 'center',
          marginLeft: 0,
          borderRadius: 28,
        },
        headerStyle: {
          backgroundColor: theme.colors.primary,
          height: responsive.dimensions.headerHeight,
          elevation: 2,
        },
        headerTitleStyle: {
          ...theme.fonts.titleLarge,
          color: theme.colors.onPrimary,
          fontWeight: 'bold',
          fontSize: responsive.isTablet ? 20 : 22,
        },
        drawerStyle: {
          backgroundColor: theme.colors.surface,
          width: responsive.dimensions.drawerWidth,
          borderTopRightRadius: theme.roundness * 2,
          borderBottomRightRadius: theme.roundness * 2,
        },
      }),
    [theme, responsive],
  );

  return (
    <>
      <StatusBar
        backgroundColor={theme.colors.primary}
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
      />
      <Drawer.Navigator
        initialRouteName={initialRouteName}
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={({ navigation, route }) => ({
          headerStyle: styles.headerStyle,
          headerTintColor: theme.colors.onPrimary,
          headerTitleStyle: styles.headerTitleStyle,
          drawerStyle: styles.drawerStyle,
          drawerActiveTintColor: theme.colors.primary,
          drawerInactiveTintColor: theme.colors.onSurfaceVariant,
          drawerLabelStyle: {
            ...theme.fonts.labelLarge,
            fontSize: responsive.fontSize.m,
          },
          drawerItemStyle: {
            marginVertical: responsive.spacing.xxs,
            borderRadius: theme.roundness * 2,
            paddingVertical: responsive.spacing.xxs,
            paddingHorizontal: responsive.spacing.xs,
          },
          headerShown: true,
          drawerType: 'front',
          drawerPosition: 'left',
          headerShadowVisible: false,
          swipeEdgeWidth: 100,
          headerLeft: () => (
            <TouchableOpacity
              style={styles.drawerButtonContainer}
              onPress={() => navigation.openDrawer()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon source="menu" size={32} color={theme.colors.onPrimary} />
            </TouchableOpacity>
          ),
          headerTitle: ({ children }) => {
            let title = '';
            switch (children) {
              case 'MenuStack':
                title = 'Menú';
                break;
              case 'ModifiersStack':
                title = 'Modificadores';
                break;
              case 'PreparationScreensStack':
                title = 'Pantallas Preparación';
                break;
              case 'AreasTablesStack':
                title = 'Áreas y Mesas';
                break;
              case 'OrdersStack':
                title = 'Órdenes';
                break;
              case 'PrintersStack':
                title = 'Impresoras';
                break;
              case 'ReceiptsStack':
                title = 'Recibos';
                break;
              case 'AvailabilityScreen':
                title = 'Disponibilidad';
                break;
              case 'OrderFinalizationStack':
                title = 'Finalización';
                break;
              case 'RestaurantConfigStack':
                title = 'Configuración';
                break;
              case 'CustomersStack':
                title = 'Clientes';
                break;
              case 'PizzaCustomizationsStack':
                title = 'Personalizaciones';
                break;
              case 'SyncStack':
                title = 'Sincronización';
                break;
              case 'UsersScreen':
                title = 'Usuarios';
                break;
              case 'KitchenScreen':
                title =
                  kitchenScreenName +
                  (filters.orderType ? getFilterText() : '');
                break;
              case 'ShiftAuditStack':
                title = 'Historial de Turnos';
                break;
              case 'ServerSettings':
                title = 'Configuración del Servidor';
                break;
              default:
                title = children?.toString() || '';
            }
            return (
              <Surface
                elevation={0}
                style={{
                  backgroundColor: 'transparent',
                }}
              >
                <Text style={styles.headerTitleStyle}>{title}</Text>
              </Surface>
            );
          },
          headerRight: () => {
            // Solo mostrar ShiftIndicator en las secciones de ventas
            const salesScreens = [
              'OrdersStack',
              'ReceiptsStack',
              'OrderFinalizationStack',
            ];
            const showShiftIndicator = salesScreens.includes(route.name);

            return (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {showShiftIndicator && <ShiftIndicator />}
                <ConnectionIndicator />
              </View>
            );
          },
        })}
      >
        <Drawer.Screen
          name="OrdersStack"
          component={OrdersStackNavigator}
          options={{
            title: 'Órdenes',
            drawerIcon: ({ color }) => (
              <Icon
                source="clipboard-list-outline"
                color={color}
                size={responsive.dimensions.iconSize.medium}
              />
            ),
          }}
        />
        <Drawer.Screen
          name="ReceiptsStack"
          component={ReceiptsStackNavigator}
          options={{
            title: 'Recibos',
            drawerIcon: ({ color }) => (
              <Icon
                source="receipt"
                color={color}
                size={responsive.dimensions.iconSize.medium}
              />
            ),
          }}
        />
        <Drawer.Screen
          name="OrderFinalizationStack"
          component={OrderFinalizationStackNavigator}
          options={{
            title: 'Finalización',
            drawerIcon: ({ color }) => (
              <Icon
                source="clipboard-check-outline"
                color={color}
                size={responsive.dimensions.iconSize.medium}
              />
            ),
          }}
        />
        <Drawer.Screen
          name="MenuStack"
          component={MenuStackNavigator}
          options={{
            title: 'Menú',
            drawerIcon: ({ color }) => (
              <Icon
                source="menu"
                color={color}
                size={responsive.dimensions.iconSize.medium}
              />
            ),
          }}
        />
        <Drawer.Screen
          name="AvailabilityScreen"
          component={AvailabilityScreen}
          options={{
            title: 'Disponibilidad',
            drawerIcon: ({ color }) => (
              <Icon
                source="eye-off-outline"
                color={color}
                size={responsive.dimensions.iconSize.medium}
              />
            ),
          }}
        />
        <Drawer.Screen
          name="ModifiersStack"
          component={ModifiersStackNavigator}
          options={{
            title: 'Modificadores',
            drawerIcon: ({ color }) => (
              <Icon
                source="tune"
                color={color}
                size={responsive.dimensions.iconSize.medium}
              />
            ),
          }}
        />
        <Drawer.Screen
          name="PizzaCustomizationsStack"
          component={PizzaCustomizationsStackNavigator}
          options={{
            title: 'Gestión de Pizzas',
            drawerIcon: ({ color }) => (
              <Icon
                source="pizza"
                color={color}
                size={responsive.dimensions.iconSize.medium}
              />
            ),
          }}
        />
        <Drawer.Screen
          name="PreparationScreensStack"
          component={PreparationScreensStackNavigator}
          options={{
            title: 'Pantallas Preparación',
            drawerIcon: ({ color }) => (
              <Icon
                source="monitor-dashboard"
                color={color}
                size={responsive.dimensions.iconSize.medium}
              />
            ),
          }}
        />
        <Drawer.Screen
          name="AreasTablesStack"
          component={AreasTablesStackNavigator}
          options={{
            title: 'Áreas y Mesas',
            drawerIcon: ({ color }) => (
              <Icon
                source="map-marker-radius-outline"
                color={color}
                size={responsive.dimensions.iconSize.medium}
              />
            ),
          }}
        />

        <Drawer.Screen
          name="PrintersStack"
          component={PrintersStackNavigator}
          options={{
            title: 'Impresoras',
            drawerIcon: ({ color }) => (
              <Icon
                source="printer"
                color={color}
                size={responsive.dimensions.iconSize.medium}
              />
            ),
          }}
        />
        <Drawer.Screen
          name="RestaurantConfigStack"
          component={RestaurantConfigStackNavigator}
          options={{
            title: 'Configuración',
            drawerIcon: ({ color }) => (
              <Icon
                source="cog-outline"
                color={color}
                size={responsive.dimensions.iconSize.medium}
              />
            ),
          }}
        />
        <Drawer.Screen
          name="CustomersStack"
          component={CustomersStackNavigator}
          options={{
            title: 'Clientes',
            drawerIcon: ({ color }) => (
              <Icon
                source="account-group-outline"
                color={color}
                size={responsive.dimensions.iconSize.medium}
              />
            ),
          }}
        />
        <Drawer.Screen
          name="SyncStack"
          component={SyncStackNavigator}
          options={{
            title: 'Sincronización',
            drawerIcon: ({ color }) => (
              <Icon
                source="sync"
                color={color}
                size={responsive.dimensions.iconSize.medium}
              />
            ),
          }}
        />
        <Drawer.Screen
          name="UsersScreen"
          component={UsersListScreen}
          options={{
            title: 'Usuarios',
            drawerIcon: ({ color }) => (
              <Icon
                source="account-multiple"
                color={color}
                size={responsive.dimensions.iconSize.medium}
              />
            ),
          }}
        />
        <Drawer.Screen
          name="ShiftAuditStack"
          component={ShiftAuditStackNavigator}
          options={{
            title: 'Historial de Turnos',
            drawerIcon: ({ color }) => (
              <Icon
                source="history"
                color={color}
                size={responsive.dimensions.iconSize.medium}
              />
            ),
          }}
        />
        <Drawer.Screen
          name="KitchenScreen"
          component={KitchenOrdersScreen}
          options={{
            title: kitchenScreenName,
            drawerIcon: ({ color }) => (
              <Icon
                source="chef-hat"
                color={color}
                size={responsive.dimensions.iconSize.medium}
              />
            ),
            headerRight: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {/* Checkbox para mostrar/ocultar ordenes listas */}
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    marginRight: 8,
                    backgroundColor: filters.showPrepared
                      ? 'rgba(255,255,255,0.2)'
                      : 'transparent',
                    borderRadius: 20,
                  }}
                  onPress={() =>
                    setFilters({
                      ...filters,
                      showPrepared: !filters.showPrepared,
                    })
                  }
                >
                  <Checkbox
                    status={filters.showPrepared ? 'checked' : 'unchecked'}
                    onPress={() =>
                      setFilters({
                        ...filters,
                        showPrepared: !filters.showPrepared,
                      })
                    }
                    color={theme.colors.onPrimary}
                    uncheckedColor={theme.colors.onPrimary}
                  />
                  <PaperText
                    style={{
                      color: theme.colors.onPrimary,
                      fontSize: 14,
                      marginLeft: 4,
                      fontWeight: filters.showPrepared ? 'bold' : 'normal',
                    }}
                  >
                    Mostrar Listas
                  </PaperText>
                </TouchableOpacity>
                <KitchenFilterButton />
                <ConnectionIndicator />
              </View>
            ),
          }}
        />
        <Drawer.Screen
          name="ServerSettings"
          component={ServerSettingsScreen}
          options={{
            title: 'Configuración del Servidor',
            drawerItemStyle: { display: 'none' }, // Oculto del drawer, solo accesible desde el botón
          }}
        />
      </Drawer.Navigator>
    </>
  );
}
