import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Portal, FAB, Text, Icon } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/app/styles/theme';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PizzaCustomizationsStackParamList } from '../navigation/types';

// Importar las tabs
import { 
  PizzaProductsTab, 
  PizzaCustomizationsTab
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
      backgroundColor: theme.colors.elevation.level2,
      elevation: 0,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    tabsContainer: {
      flexDirection: 'row',
      height: 48,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.m,
      gap: theme.spacing.xs,
    },
    tabActive: {
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.primary,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
    },
    tabTextActive: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    tabIcon: {
      marginRight: 4,
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
      default:
        return null;
    }
  };

  // Acciones del FAB según la tab activa
  const getFabActions = () => {
    switch (selectedTab) {
      case 'products':
        return [];
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
        ];
      default:
        return [];
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <View style={styles.tabsContainer}>
          <Pressable
            style={[styles.tab, selectedTab === 'products' && styles.tabActive]}
            onPress={() => setSelectedTab('products')}
          >
            <Icon 
              source="pizza" 
              size={20} 
              color={selectedTab === 'products' ? theme.colors.primary : theme.colors.onSurfaceVariant}
            />
            <Text style={[styles.tabText, selectedTab === 'products' && styles.tabTextActive]}>
              Productos
            </Text>
          </Pressable>
          
          <Pressable
            style={[styles.tab, selectedTab === 'customizations' && styles.tabActive]}
            onPress={() => setSelectedTab('customizations')}
          >
            <Icon 
              source="cheese" 
              size={20} 
              color={selectedTab === 'customizations' ? theme.colors.primary : theme.colors.onSurfaceVariant}
            />
            <Text style={[styles.tabText, selectedTab === 'customizations' && styles.tabTextActive]}>
              Ingredientes
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.content}>
        {renderContent()}
      </View>

      {selectedTab === 'customizations' && (
        <Portal>
          <FAB.Group
            open={fabOpen}
            visible
            icon={fabOpen ? 'close' : 'plus'}
            actions={getFabActions()}
            onStateChange={({ open }) => setFabOpen(open)}
            style={styles.fabGroup}
            fabStyle={styles.fab}
          />
        </Portal>
      )}
    </SafeAreaView>
  );
}