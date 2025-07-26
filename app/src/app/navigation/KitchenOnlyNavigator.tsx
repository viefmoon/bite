import { useEffect, useMemo } from 'react';
import {
  BackHandler,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  View,
  Text,
  Platform,
} from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import KitchenOrdersScreen from '../../modules/kitchen/screens/KitchenOrdersScreen';
import { CustomDrawerContent } from './components/CustomDrawerContent';
import { ServerSettingsScreen } from '../../modules/settings/screens/ServerSettingsScreen';
import { useAppTheme } from '../styles/theme';
import { Icon, Surface, Checkbox } from 'react-native-paper';
import { useResponsive } from '../hooks/useResponsive';
import { ConnectionIndicator } from '../components/ConnectionIndicator';
import { KitchenFilterButton } from '../../modules/kitchen/components/KitchenFilterButton';
import { RefreshButton } from '../../modules/kitchen/components/RefreshButton';
import { useAuthStore } from '../store/authStore';
import { useKitchenStore } from '../../modules/kitchen/store/kitchenStore';
import { OrderTypeEnum } from '../../modules/kitchen/schema/kitchen.schema';
import { KitchenProvider } from '../../modules/kitchen/context/KitchenContext';

const Drawer = createDrawerNavigator();

function KitchenOnlyNavigatorContent() {
  const theme = useAppTheme();
  const user = useAuthStore((state) => state.user);
  const { filters, setFilters } = useKitchenStore();
  const screenName = user?.preparationScreen?.name || 'Pantalla de Preparación';

  // Obtener el texto del filtro activo
  const getFilterText = () => {
    switch (filters.orderType) {
      case OrderTypeEnum.DINE_IN:
        return ' • Mesa';
      case OrderTypeEnum.TAKE_AWAY:
        return ' • Llevar';
      case OrderTypeEnum.DELIVERY:
        return ' • Domicilio';
      default:
        return '';
    }
  };

  // Prevenir navegación hacia atrás en Android (no aplicar en web)
  useEffect(() => {
    if (Platform.OS !== 'web') {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          // Retornar true previene el comportamiento por defecto
          return true;
        },
      );

      return () => backHandler.remove();
    }
  }, []);

  const responsive = useResponsive();

  const styles = useMemo(
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
          height: responsive.isWeb ? 80 : responsive.dimensions.headerHeight,
          elevation: 2,
        },
        headerTitleStyle: {
          ...theme.fonts.titleLarge,
          color: theme.colors.onPrimary,
          fontWeight: 'bold',
          fontSize: responsive.isWeb ? 26 : responsive.isTablet ? 20 : 22,
        },
        drawerStyle: {
          backgroundColor: theme.colors.surface,
          width: responsive.isWeb ? 320 : responsive.dimensions.drawerWidth,
          borderTopRightRadius: responsive.isWeb ? 0 : theme.roundness * 2,
          borderBottomRightRadius: responsive.isWeb ? 0 : theme.roundness * 2,
          borderRightWidth: 0,
          borderRightColor: theme.colors.outlineVariant,
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0,
          shadowRadius: 0,
        },
        titleContainer: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        filterIndicator: {
          ...theme.fonts.titleMedium,
          fontWeight: '500',
          opacity: 0.9,
        },
        transparentSurface: {
          backgroundColor: 'transparent',
        },
        headerRightContainer: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        preparedOrdersToggle: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 8,
          marginRight: 8,
          borderRadius: 20,
        },
        preparedOrdersText: {
          marginLeft: 4,
        },
        preparedOrdersToggleActive: {
          backgroundColor: 'rgba(255,255,255,0.2)',
        },
        preparedOrdersToggleInactive: {
          backgroundColor: 'transparent',
        },
        preparedOrdersTextWeb: {
          fontSize: 16,
        },
        preparedOrdersTextMobile: {
          fontSize: 14,
        },
        preparedOrdersTextBold: {
          fontWeight: 'bold',
        },
        preparedOrdersTextNormal: {
          fontWeight: 'normal',
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
        initialRouteName="Kitchen"
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        defaultStatus="closed"
        screenOptions={({ navigation }) => ({
          headerStyle: styles.headerStyle,
          headerTintColor: theme.colors.onPrimary,
          headerTitleStyle: styles.headerTitleStyle,
          drawerStyle: styles.drawerStyle,
          drawerActiveTintColor: theme.colors.primary,
          drawerInactiveTintColor: theme.colors.onSurfaceVariant,
          drawerLabelStyle: {
            ...theme.fonts.labelLarge,
            fontSize: responsive.fontSizePreset.m,
          },
          drawerItemStyle: {
            marginVertical: responsive.spacingPreset.xxs,
            borderRadius: theme.roundness * 2,
            paddingVertical: responsive.spacingPreset.xxs,
            paddingHorizontal: responsive.spacingPreset.xs,
          },
          headerShown: true,
          drawerType: 'slide',
          drawerPosition: 'left',
          headerShadowVisible: false,
          swipeEdgeWidth: 0,
          swipeEnabled: false,
          drawerHideStatusBarOnOpen: false,
          headerLeft: () => (
            <TouchableOpacity
              style={styles.drawerButtonContainer}
              onPress={() => navigation.openDrawer()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon
                source="menu"
                size={responsive.isWeb ? 36 : 32}
                color={theme.colors.onPrimary}
              />
            </TouchableOpacity>
          ),
          headerTitle: () => (
            <Surface elevation={0} style={styles.transparentSurface}>
              <View style={styles.titleContainer}>
                <Text style={styles.headerTitleStyle}>{screenName}</Text>
                {filters.orderType && (
                  <Text
                    style={[
                      styles.filterIndicator,
                      { color: theme.colors.onPrimary },
                    ]}
                  >
                    {getFilterText()}
                  </Text>
                )}
              </View>
            </Surface>
          ),
          headerRight: () => (
            <View style={styles.headerRightContainer}>
              {/* Checkbox para mostrar/ocultar ordenes listas */}
              <TouchableOpacity
                style={[
                  styles.preparedOrdersToggle,
                  filters.showPrepared
                    ? styles.preparedOrdersToggleActive
                    : styles.preparedOrdersToggleInactive,
                ]}
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
                <Text
                  style={[
                    styles.preparedOrdersText,
                    { color: theme.colors.onPrimary },
                    responsive.isWeb
                      ? styles.preparedOrdersTextWeb
                      : styles.preparedOrdersTextMobile,
                    filters.showPrepared
                      ? styles.preparedOrdersTextBold
                      : styles.preparedOrdersTextNormal,
                  ]}
                >
                  Mostrar Listas
                </Text>
              </TouchableOpacity>
              <KitchenFilterButton />
              {/* Botón de recargar */}
              <RefreshButton />
              <ConnectionIndicator />
            </View>
          ),
        })}
      >
        <Drawer.Screen
          name="Kitchen"
          options={{
            title: screenName,
            drawerIcon: ({ color, size }) => (
              <Icon source="chef-hat" color={color} size={size} />
            ),
          }}
        >
          {() => <KitchenOrdersScreen />}
        </Drawer.Screen>

        <Drawer.Screen
          name="ServerSettings"
          component={ServerSettingsScreen}
          options={{
            title: 'Configuración del Servidor',
            drawerIcon: ({ color, size }) => (
              <Icon source="server-network" color={color} size={size} />
            ),
            headerShown: true,
            headerStyle: styles.headerStyle,
            headerTintColor: theme.colors.onPrimary,
            headerTitleStyle: styles.headerTitleStyle,
          }}
        />
      </Drawer.Navigator>
    </>
  );
}

export function KitchenOnlyNavigator() {
  // Usar navegador web personalizado en plataforma web
  if (Platform.OS === 'web') {
    // Importación dinámica para evitar problemas de bundling
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { KitchenWebNavigator } = require('./KitchenWebNavigator') as {
      KitchenWebNavigator: React.ComponentType;
    };
    return <KitchenWebNavigator />;
  }

  // Usar navegador nativo para otras plataformas
  return (
    <KitchenProvider>
      <KitchenOnlyNavigatorContent />
    </KitchenProvider>
  );
}
