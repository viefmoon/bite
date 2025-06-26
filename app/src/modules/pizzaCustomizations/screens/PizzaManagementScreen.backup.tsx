import React, { useState, lazy } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { TabView, TabBar, SceneRendererProps, NavigationState, Route as TabRoute } from 'react-native-tab-view';
import { useAppTheme } from '@/app/styles/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Portal, FAB, Badge } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PizzaCustomizationsStackParamList } from '../navigation/types';

// Importar las tabs
import { 
  PizzaProductsTab, 
  PizzaCustomizationsTab, 
  PizzaConfigurationTab 
} from '../components';

type NavigationProp = NativeStackNavigationProp<
  PizzaCustomizationsStackParamList,
  'PizzaCustomizationsList'
>;

interface Route {
  key: string;
  title: string;
  icon?: string;
}

export function PizzaManagementScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation<NavigationProp>();
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [fabOpen, setFabOpen] = useState(false);

  const routes: Route[] = [
    { key: 'products', title: 'Productos Pizza', icon: 'pizza' },
    { key: 'customizations', title: 'Personalizaciones', icon: 'food-apple' },
    { key: 'configuration', title: 'Configuración', icon: 'cog' },
  ];

  const renderScene = ({ route }: { route: Route }) => {
    switch (route.key) {
      case 'products':
        return <PizzaProductsTab />;
      case 'customizations':
        return <PizzaCustomizationsTab />;
      case 'configuration':
        return <PizzaConfigurationTab />;
      default:
        return null;
    }
  };

  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: theme.colors.primary }}
      style={styles.tabBar}
      labelStyle={[
        styles.tabLabel,
        { color: theme.colors.onSurface }
      ]}
      activeColor={theme.colors.primary}
      inactiveColor={theme.colors.onSurfaceVariant}
      pressColor={theme.colors.primaryContainer}
      renderBadge={({ route }) => {
        // Aquí podemos agregar badges para mostrar contadores
        return null;
      }}
    />
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    tabBar: {
      backgroundColor: theme.colors.surface,
      elevation: 4,
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    tabLabel: {
      ...theme.fonts.labelMedium,
      textTransform: 'none',
    },
    scene: {
      flex: 1,
    },
    fab: {
      position: 'absolute',
      margin: 16,
      right: 0,
      bottom: 0,
    },
    fabGroup: {
      paddingBottom: 0,
    },
  });

  // Acciones del FAB según la pestaña activa
  const getFabActions = () => {
    switch (routes[index].key) {
      case 'products':
        return [
          {
            icon: 'plus',
            label: 'Nueva Pizza',
            onPress: () => {
              // Navegar a crear producto con isPizza = true
              setFabOpen(false);
            },
          },
          {
            icon: 'content-copy',
            label: 'Duplicar Configuración',
            onPress: () => {
              setFabOpen(false);
            },
          },
        ];
      case 'customizations':
        return [
          {
            icon: 'plus',
            label: 'Nueva Personalización',
            onPress: () => {
              navigation.navigate('PizzaCustomizationDetail', {});
              setFabOpen(false);
            },
          },
          {
            icon: 'link-variant',
            label: 'Asociar a Pizzas',
            onPress: () => {
              navigation.navigate('AssociatePizzaCustomizations');
              setFabOpen(false);
            },
          },
        ];
      case 'configuration':
        return [
          {
            icon: 'pencil',
            label: 'Edición Rápida',
            onPress: () => {
              setFabOpen(false);
            },
          },
          {
            icon: 'content-save',
            label: 'Guardar Cambios',
            onPress: () => {
              setFabOpen(false);
            },
          },
        ];
      default:
        return [];
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        renderTabBar={renderTabBar}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        sceneContainerStyle={styles.scene}
      />

      <Portal>
        <FAB.Group
          open={fabOpen}
          visible
          icon={fabOpen ? 'close' : 'pizza'}
          actions={getFabActions()}
          onStateChange={({ open }) => setFabOpen(open)}
          style={styles.fabGroup}
          fabStyle={styles.fab}
        />
      </Portal>
    </SafeAreaView>
  );
}