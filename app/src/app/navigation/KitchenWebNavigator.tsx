import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Text,
} from 'react-native';
import { Icon, Surface, Checkbox } from 'react-native-paper';
import { WebDrawer } from './components/WebDrawer';
import { WebDrawerContent } from './components/WebDrawerContent';
import KitchenOrdersScreen from '../../modules/kitchen/screens/KitchenOrdersScreen';
import { useAppTheme } from '../styles/theme';
import { useResponsive } from '../hooks/useResponsive';
import { ConnectionIndicator } from '../components/ConnectionIndicator';
import { KitchenFilterButton } from '../../modules/kitchen/components/KitchenFilterButton';
import { RefreshButton } from '../../modules/kitchen/components/RefreshButton';
import { useAuthStore } from '../store/authStore';
import { useKitchenStore } from '../../modules/kitchen/store/kitchenStore';
import { OrderType } from '../../modules/kitchen/types/kitchen.types';
import { KitchenProvider } from '../../modules/kitchen/context/KitchenContext';

export function KitchenWebNavigator() {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const user = useAuthStore((state) => state.user);
  const { filters, setFilters } = useKitchenStore();
  const screenName = user?.preparationScreen?.name || 'Pantalla de Preparación';
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      backgroundColor: theme.colors.primary,
      height: responsive.isWeb ? 80 : responsive.dimensions.headerHeight,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: responsive.spacing.m,
      elevation: 2,
    },
    drawerButtonContainer: {
      width: 56,
      height: 56,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 0,
      borderRadius: 28,
    },
    headerContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerTitle: {
      ...theme.fonts.titleLarge,
      color: theme.colors.onPrimary,
      fontWeight: 'bold',
      fontSize: responsive.isWeb ? 26 : 22,
    },
    filterIndicator: {
      ...theme.fonts.titleMedium,
      fontWeight: '500',
      opacity: 0.9,
      color: theme.colors.onPrimary,
    },
    content: {
      flex: 1,
    },
  });

  return (
    <KitchenProvider>
      <View style={styles.container}>
        <StatusBar
          backgroundColor={theme.colors.primary}
          barStyle={theme.dark ? 'light-content' : 'dark-content'}
        />

        <WebDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          drawerWidth={
            responsive.isWeb ? 320 : responsive.dimensions.drawerWidth
          }
          drawerContent={
            <WebDrawerContent onClose={() => setDrawerOpen(false)} />
          }
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.drawerButtonContainer}
                onPress={() => setDrawerOpen(true)}
                hitSlop={{ top: 30, bottom: 30, left: 30, right: 30 }}
              >
                <Icon
                  source="menu"
                  size={responsive.isWeb ? 36 : 32}
                  color={theme.colors.onPrimary}
                />
              </TouchableOpacity>

              <View style={styles.headerContent}>
                <Surface
                  elevation={0}
                  style={{
                    backgroundColor: 'transparent',
                  }}
                >
                  <View style={styles.titleContainer}>
                    <Text style={styles.headerTitle}>{screenName}</Text>
                    {filters.orderType && (
                      <Text style={styles.filterIndicator}>
                        {getFilterText()}
                      </Text>
                    )}
                  </View>
                </Surface>

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
                        fontSize: responsive.isWeb ? 16 : 14,
                        marginLeft: 4,
                        fontWeight: filters.showPrepared ? 'bold' : 'normal',
                      }}
                    >
                      Mostrar Listas
                    </Text>
                  </TouchableOpacity>
                  <KitchenFilterButton />
                  <RefreshButton />
                  <ConnectionIndicator />
                </View>
              </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
              <KitchenOrdersScreen />
            </View>
          </View>
        </WebDrawer>
      </View>
    </KitchenProvider>
  );
}
