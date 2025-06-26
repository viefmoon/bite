import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SegmentedButtons, Portal, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/app/styles/theme';
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

export function PizzaManagementScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation<NavigationProp>();
  const [selectedTab, setSelectedTab] = useState('products');
  const [fabOpen, setFabOpen] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
      elevation: 2,
    },
    segmentedButtons: {
      backgroundColor: 'transparent',
    },
    content: {
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

  // Renderizar contenido según tab seleccionada
  const renderContent = () => {
    switch (selectedTab) {
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

  // Acciones del FAB según la tab activa
  const getFabActions = () => {
    switch (selectedTab) {
      case 'products':
        return [
          {
            icon: 'plus',
            label: 'Nueva Pizza',
            onPress: () => {
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
      <View style={styles.header}>
        <SegmentedButtons
          value={selectedTab}
          onValueChange={setSelectedTab}
          buttons={[
            {
              value: 'products',
              label: 'Productos',
              icon: 'pizza',
            },
            {
              value: 'customizations',
              label: 'Ingredientes',
              icon: 'food-apple',
            },
            {
              value: 'configuration',
              label: 'Configuración',
              icon: 'cog',
            },
          ]}
          style={styles.segmentedButtons}
          density="regular"
        />
      </View>

      <View style={styles.content}>
        {renderContent()}
      </View>

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