import { useEffect, useMemo } from 'react';
import {
  BackHandler,
  StatusBar,
  StyleSheet,
  Platform,
} from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import KitchenOrdersScreen from '../../modules/kitchen/screens/KitchenOrdersScreen';
import { CustomDrawerContent } from './components/CustomDrawerContent';
import { ServerSettingsScreen } from '../../modules/settings/screens/ServerSettingsScreen';
import { useAppTheme } from '../styles/theme';
import { Icon } from 'react-native-paper';
import { useResponsive } from '../hooks/useResponsive';
import { KitchenProvider } from '../../modules/kitchen/context/KitchenContext';
import { useKitchenHeader } from './components/KitchenHeader';

const Drawer = createDrawerNavigator();

function KitchenOnlyNavigatorContent() {
  const theme = useAppTheme();

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
        screenOptions={({ navigation }) => {
          const kitchenHeader = useKitchenHeader({
            onMenuPress: () => navigation.openDrawer(),
          });

          return {
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
            headerLeft: kitchenHeader.MenuButton,
            headerTitle: kitchenHeader.Title,
            headerRight: kitchenHeader.RightActions,
          };
        }}
      >
        <Drawer.Screen
          name="Kitchen"
          options={({ navigation }) => {
            const kitchenHeader = useKitchenHeader({
              onMenuPress: () => navigation.openDrawer(),
            });
            return {
              title: kitchenHeader.screenName,
              drawerIcon: ({ color, size }) => (
                <Icon source="chef-hat" color={color} size={size} />
              ),
            };
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
