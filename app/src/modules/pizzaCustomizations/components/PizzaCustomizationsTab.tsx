import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Text,
  Searchbar,
  ActivityIndicator,
  Menu,
  IconButton,
  Badge,
  Chip,
  Surface,
} from 'react-native-paper';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '@/app/styles/theme';
import {
  usePizzaCustomizationsList,
  useDeletePizzaCustomization,
} from '../hooks/usePizzaCustomizationsQueries';
import { PizzaCustomizationDetailModal } from './PizzaCustomizationDetailModal';
import {
  CustomizationType,
  PizzaCustomization,
} from '../types/pizzaCustomization.types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PizzaCustomizationsStackParamList } from '../navigation/types';
import EmptyState from '@/app/components/common/EmptyState';
import ConfirmationModal from '@/app/components/common/ConfirmationModal';

type NavigationProp = NativeStackNavigationProp<
  PizzaCustomizationsStackParamList,
  'PizzaCustomizationsList'
>;

export function PizzaCustomizationsTab() {
  const theme = useAppTheme();
  const navigation = useNavigation<NavigationProp>();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<CustomizationType | 'all'>(
    'all',
  );
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [selectedCustomization, setSelectedCustomization] =
    useState<PizzaCustomization | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [customizationToDelete, setCustomizationToDelete] =
    useState<PizzaCustomization | null>(null);

  const deleteMutation = useDeletePizzaCustomization();

  const { data, isLoading, isError, refetch } = usePizzaCustomizationsList({
    search: searchQuery || undefined,
    type: selectedType === 'all' ? undefined : selectedType,
    limit: 100, // Aumentar el límite para obtener todos los registros
  });

  const filteredData = data?.data || [];
  const hasActiveFilter = selectedType !== 'all';

  const handleItemPress = (item: PizzaCustomization) => {
    setSelectedCustomization(item);
    setDetailModalVisible(true);
  };

  const handleEdit = (customization: PizzaCustomization) => {
    setDetailModalVisible(false);
    navigation.navigate('PizzaCustomizationForm', { id: customization.id });
  };

  const handleDelete = (customization: PizzaCustomization) => {
    setCustomizationToDelete(customization);
    setDetailModalVisible(false);
    setDeleteConfirmVisible(true);
  };

  const confirmDelete = async () => {
    if (customizationToDelete) {
      await deleteMutation.mutateAsync(customizationToDelete.id);
      setDeleteConfirmVisible(false);
      setCustomizationToDelete(null);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => handleItemPress(item)}>
      <Surface style={styles.cardWrapper} elevation={1}>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <Text
                variant="titleMedium"
                style={styles.cardTitle}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <Chip
                mode="flat"
                compact
                icon={
                  item.type === CustomizationType.FLAVOR ? 'pizza' : 'cheese'
                }
                style={[
                  styles.typeChip,
                  {
                    backgroundColor:
                      item.type === CustomizationType.FLAVOR
                        ? theme.colors.errorContainer
                        : theme.colors.secondaryContainer,
                  },
                ]}
                textStyle={styles.chipText}
              >
                {item.type === CustomizationType.FLAVOR
                  ? 'Sabor'
                  : 'Ingrediente'}
              </Chip>
            </View>
            <View style={styles.statsContainer}>
              <Text variant="bodySmall" style={styles.statText}>
                Valor: {item.toppingValue || 0}
              </Text>
              <Text variant="bodySmall" style={styles.statText}>
                • {item.products?.length || 0} pizzas
              </Text>
            </View>
          </View>

          {item.ingredients && (
            <Text
              variant="bodySmall"
              style={styles.ingredientsText}
              numberOfLines={1}
            >
              {item.ingredients}
            </Text>
          )}
        </View>
      </Surface>
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: theme.spacing.m,
      backgroundColor: theme.colors.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
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
    cardWrapper: {
      marginHorizontal: theme.spacing.m,
      marginVertical: theme.spacing.xs,
      borderRadius: theme.roundness * 2,
      overflow: 'hidden',
    },
    cardContent: {
      padding: theme.spacing.s,
      paddingHorizontal: theme.spacing.m,
    },
    cardHeader: {
      marginBottom: theme.spacing.xs,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.s,
    },
    cardTitle: {
      flex: 1,
      fontWeight: '600',
      color: theme.colors.onSurface,
      fontSize: 16,
    },
    typeChip: {
      height: 24,
    },
    chipText: {
      fontSize: 11,
      marginHorizontal: theme.spacing.xs,
      marginVertical: 0,
    },
    statsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.s,
      marginTop: theme.spacing.xs,
    },
    statText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    ingredientsText: {
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
      fontSize: 12,
      marginTop: theme.spacing.xs,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
                  icon={
                    selectedType === 'all'
                      ? 'filter-variant'
                      : selectedType === CustomizationType.FLAVOR
                        ? 'pizza'
                        : 'cheese'
                  }
                  mode="contained-tonal"
                  size={24}
                  onPress={() => setFilterMenuVisible(true)}
                  style={styles.filterIconButton}
                  iconColor={
                    selectedType !== 'all'
                      ? theme.colors.primary
                      : theme.colors.onSurfaceVariant
                  }
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
                leadingIcon="pizza"
                trailingIcon={
                  selectedType === CustomizationType.FLAVOR
                    ? 'check'
                    : undefined
                }
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
                leadingIcon="cheese"
                trailingIcon={
                  selectedType === CustomizationType.INGREDIENT
                    ? 'check'
                    : undefined
                }
                titleStyle={
                  selectedType === CustomizationType.INGREDIENT
                    ? { color: theme.colors.primary, fontWeight: '600' }
                    : undefined
                }
              />
            </Menu>
            {hasActiveFilter && <Badge style={styles.filterBadge} size={8} />}
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <FlashList
          data={filteredData}
          renderItem={renderItem}
          estimatedItemSize={120}
          ListEmptyComponent={
            <EmptyState
              title="No hay personalizaciones"
              message={
                selectedType === CustomizationType.FLAVOR
                  ? 'No hay sabores disponibles'
                  : selectedType === CustomizationType.INGREDIENT
                    ? 'No hay ingredientes disponibles'
                    : 'No hay personalizaciones disponibles'
              }
              icon="cheese"
            />
          }
          contentContainerStyle={styles.listContainer}
          keyExtractor={(item) => item.id}
          refreshing={isLoading}
          onRefresh={refetch}
        />
      </View>

      <PizzaCustomizationDetailModal
        visible={detailModalVisible}
        onDismiss={() => {
          setDetailModalVisible(false);
          setSelectedCustomization(null);
        }}
        customization={selectedCustomization}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isDeleting={deleteMutation.isPending}
      />

      <ConfirmationModal
        visible={deleteConfirmVisible}
        title="Eliminar personalización"
        message={`¿Estás seguro de que quieres eliminar "${customizationToDelete?.name}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        confirmButtonColor={theme.colors.error}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteConfirmVisible(false);
          setCustomizationToDelete(null);
        }}
        onDismiss={() => {
          setDeleteConfirmVisible(false);
          setCustomizationToDelete(null);
        }}
      />
    </View>
  );
}
