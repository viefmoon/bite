import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Text,
  FAB,
  Searchbar,
  Chip,
  ActivityIndicator,
  Portal,
  Modal,
  Button,
  Menu,
  IconButton,
  SegmentedButtons,
} from 'react-native-paper';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/app/styles/theme';
import { usePizzaCustomizationsList } from '../hooks/usePizzaCustomizationsQueries';
import { PizzaCustomizationCard } from '../components/PizzaCustomizationCard';
import { CustomizationType } from '../types/pizzaCustomization.types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PizzaCustomizationsStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<
  PizzaCustomizationsStackParamList,
  'PizzaCustomizationsList'
>;

export function PizzaCustomizationsListScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation<NavigationProp>();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<CustomizationType | 'all'>('all');
  const [menuVisible, setMenuVisible] = useState(false);

  const { data, isLoading, isError, refetch } = usePizzaCustomizationsList({
    search: searchQuery || undefined,
    type: selectedType === 'all' ? undefined : selectedType,
  });

  const filteredData = data?.data || [];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: theme.spacing.m,
      backgroundColor: theme.colors.surface,
      elevation: 2,
    },
    searchbar: {
      marginBottom: theme.spacing.m,
    },
    segmentedButtons: {
      marginBottom: theme.spacing.m,
    },
    content: {
      flex: 1,
    },
    listContainer: {
      padding: theme.spacing.m,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    emptyText: {
      ...theme.fonts.bodyLarge,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      marginTop: theme.spacing.m,
    },
    fab: {
      position: 'absolute',
      margin: 16,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.primary,
    },
    menuButton: {
      position: 'absolute',
      top: theme.spacing.s,
      right: theme.spacing.s,
    },
  });

  const renderItem = ({ item }: { item: any }) => (
    <PizzaCustomizationCard
      customization={item}
      onPress={() => navigation.navigate('PizzaCustomizationDetail', { id: item.id })}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        No hay personalizaciones disponibles
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Buscar personalización..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        
        <SegmentedButtons
          value={selectedType}
          onValueChange={(value) => setSelectedType(value as CustomizationType | 'all')}
          buttons={[
            { value: 'all', label: 'Todas' },
            { value: CustomizationType.FLAVOR, label: 'Sabores' },
            { value: CustomizationType.INGREDIENT, label: 'Ingredientes' },
          ]}
          style={styles.segmentedButtons}
        />

        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <IconButton
              icon="dots-vertical"
              onPress={() => setMenuVisible(true)}
              style={styles.menuButton}
            />
          }
        >
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              navigation.navigate('PizzaConfigurations');
            }}
            title="Configuración de Precios"
            leadingIcon="currency-usd"
          />
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              navigation.navigate('AssociatePizzaCustomizations');
            }}
            title="Asociar a Pizzas"
            leadingIcon="link-variant"
          />
        </Menu>
      </View>

      <View style={styles.content}>
        <FlashList
          data={filteredData}
          renderItem={renderItem}
          estimatedItemSize={100}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContainer}
          keyExtractor={(item) => item.id}
          refreshing={isLoading}
          onRefresh={refetch}
        />
      </View>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('PizzaCustomizationDetail', {})}
        label="Nueva"
      />
    </SafeAreaView>
  );
}