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
  Badge,
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
  const [selectedType, setSelectedType] = useState<CustomizationType | 'all'>(
    'all',
  );
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

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
      padding: theme.spacing.s,
      backgroundColor: theme.colors.surface,
      elevation: 2,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.s,
    },
    searchbar: {
      flex: 1,
      backgroundColor: theme.colors.elevation.level2,
    },
    filterButtonContainer: {
      position: 'relative',
    },
    filterIconButton: {
      margin: 0,
      backgroundColor: theme.colors.elevation.level2,
    },
    filterBadge: {
      position: 'absolute',
      top: 4,
      right: 4,
      backgroundColor: theme.colors.primary,
    },
    menuContent: {
      backgroundColor: theme.colors.elevation.level3,
      marginTop: theme.spacing.xs,
    },
    content: {
      flex: 1,
    },
    listContainer: {
      padding: theme.spacing.s,
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
    },
    fabGroup: {
      paddingBottom: 0,
    },
  });

  const renderItem = ({ item }: { item: any }) => (
    <PizzaCustomizationCard
      customization={item}
      onPress={() =>
        navigation.navigate('PizzaCustomizationDetail', { id: item.id })
      }
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No hay personalizaciones disponibles</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <Searchbar
            placeholder="Buscar personalización..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
            elevation={0}
            inputStyle={{ color: theme.colors.onSurface }}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            iconColor={theme.colors.onSurfaceVariant}
          />
          <View style={styles.filterButtonContainer}>
            <Menu
              visible={filterMenuVisible}
              onDismiss={() => setFilterMenuVisible(false)}
              anchor={
                <IconButton
                  icon={selectedType === 'all' ? 'filter-variant' : selectedType === CustomizationType.FLAVOR ? 'food-apple' : 'food-variant'}
                  mode="contained-tonal"
                  size={24}
                  onPress={() => setFilterMenuVisible(true)}
                  style={styles.filterIconButton}
                  iconColor={selectedType !== 'all' ? theme.colors.primary : theme.colors.onSurfaceVariant}
                />
              }
              anchorPosition="bottom"
              contentStyle={styles.menuContent}
            >
              <Menu.Item
                onPress={() => {
                  setSelectedType('all');
                  setFilterMenuVisible(false);
                }}
                title="Todas"
                leadingIcon="filter-variant"
                trailingIcon={selectedType === 'all' ? 'check' : undefined}
                titleStyle={
                  selectedType === 'all'
                    ? { color: theme.colors.primary, fontWeight: '600' }
                    : undefined
                }
              />
              <Menu.Item
                onPress={() => {
                  setSelectedType(CustomizationType.FLAVOR);
                  setFilterMenuVisible(false);
                }}
                title="Sabores"
                leadingIcon="food-apple"
                trailingIcon={selectedType === CustomizationType.FLAVOR ? 'check' : undefined}
                titleStyle={
                  selectedType === CustomizationType.FLAVOR
                    ? { color: theme.colors.primary, fontWeight: '600' }
                    : undefined
                }
              />
              <Menu.Item
                onPress={() => {
                  setSelectedType(CustomizationType.INGREDIENT);
                  setFilterMenuVisible(false);
                }}
                title="Ingredientes"
                leadingIcon="food-variant"
                trailingIcon={selectedType === CustomizationType.INGREDIENT ? 'check' : undefined}
                titleStyle={
                  selectedType === CustomizationType.INGREDIENT
                    ? { color: theme.colors.primary, fontWeight: '600' }
                    : undefined
                }
              />
            </Menu>
            {selectedType !== 'all' && (
              <Badge
                style={styles.filterBadge}
                size={8}
              />
            )}
          </View>
        </View>
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

      <Portal>
        <FAB.Group
          open={fabOpen}
          visible
          icon={fabOpen ? 'close' : 'food-variant'}
          actions={[
            {
              icon: 'link-variant',
              label: 'Asociar a Productos',
              onPress: () => {
                navigation.navigate('AssociatePizzaCustomizations');
                setFabOpen(false);
              },
            },
            {
              icon: 'currency-usd',
              label: 'Configuración de Precios',
              onPress: () => {
                navigation.navigate('PizzaConfigurations');
                setFabOpen(false);
              },
            },
            {
              icon: 'plus',
              label: 'Nueva Personalización',
              onPress: () => {
                navigation.navigate('PizzaCustomizationDetail', {});
                setFabOpen(false);
              },
            },
          ]}
          onStateChange={({ open }) => setFabOpen(open)}
          style={styles.fabGroup}
          fabStyle={styles.fab}
        />
      </Portal>
    </SafeAreaView>
  );
}
