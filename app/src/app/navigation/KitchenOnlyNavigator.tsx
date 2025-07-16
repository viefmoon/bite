import React, { useEffect } from 'react';
import {
  BackHandler,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import KitchenNavigator from '../../modules/kitchen/navigation/KitchenNavigator';
import { CustomDrawerContent } from './components/CustomDrawerContent';
import { useAppTheme } from '../styles/theme';
import { Icon, Surface, Text, Checkbox } from 'react-native-paper';
import { useResponsive } from '../hooks/useResponsive';
import { ConnectionIndicator } from '../components/ConnectionIndicator';
import { KitchenFilterButton } from '../../modules/kitchen/components/KitchenFilterButton';
import { RefreshButton } from '../../modules/kitchen/components/RefreshButton';
import { useAuthStore } from '../store/authStore';
import { useKitchenStore } from '../../modules/kitchen/store/kitchenStore';
import { OrderType } from '../../modules/kitchen/types/kitchen.types';
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

  // Prevenir navegación hacia atrás en Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        // Retornar true previene el comportamiento por defecto
        return true;
      },
    );

    return () => backHandler.remove();
  }, []);

  const responsive = useResponsive();
  
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        drawerButtonContainer: {
          width: responsive.dimensions.iconSize.large + responsive.spacing.s,
          height: responsive.dimensions.iconSize.large + responsive.spacing.s,
          justifyContent: 'center',
          alignItems: 'center',
          marginLeft: responsive.spacing.xs,
          borderRadius: (responsive.dimensions.iconSize.large + responsive.spacing.s) / 2,
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
          fontSize: responsive.fontSize(responsive.isTablet ? 18 : 20),
        },
        drawerStyle: {
          backgroundColor: theme.colors.surface,
          width: responsive.dimensions.drawerWidth,
          borderTopRightRadius: theme.roundness * 2,
          borderBottomRightRadius: theme.roundness * 2,
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
        screenOptions={({ navigation }) => ({
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
          swipeEdgeWidth: 0, // Desactivar completamente el swipe del drawer
          swipeEnabled: false, // Desactivar swipe para abrir drawer
          gestureEnabled: false, // Desactivar todos los gestos del drawer
          headerLeft: () => (
            <TouchableOpacity
              style={styles.drawerButtonContainer}
              onPress={() => navigation.openDrawer()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon source="menu" size={responsive.dimensions.iconSize.large} color={theme.colors.onPrimary} />
            </TouchableOpacity>
          ),
          headerTitle: () => (
            <Surface
              elevation={0}
              style={{
                backgroundColor: 'transparent',
              }}
            >
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
                <Text
                  style={{
                    color: theme.colors.onPrimary,
                    fontSize: responsive.fontSize.m,
                    marginLeft: responsive.spacing.xs,
                    fontWeight: filters.showPrepared ? 'bold' : 'normal',
                  }}
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
          component={KitchenNavigator}
          options={{
            title: screenName,
            drawerIcon: ({ color, size }) => (
              <Icon source="chef-hat" color={color} size={size} />
            ),
          }}
        />
      </Drawer.Navigator>
    </>
  );
}

export function KitchenOnlyNavigator() {
  return (
    <KitchenProvider>
      <KitchenOnlyNavigatorContent />
    </KitchenProvider>
  );
}
