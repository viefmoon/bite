import { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Text,
  Searchbar,
  ActivityIndicator,
  Chip,
  Surface,
  Badge,
} from 'react-native-paper';
import { FlashList } from '@shopify/flash-list';
import { useAppTheme } from '@/app/styles/theme';
import {
  ThemeDropdown,
  type DropdownOption,
} from '@/app/components/common/ThemeDropdown';
import {
  usePizzaCustomizationsList,
  useDeletePizzaCustomization,
} from '../hooks/usePizzaCustomizationsQueries';
import { PizzaCustomizationDetailModal } from './PizzaCustomizationDetailModal';
import { PizzaCustomizationFormModal } from './PizzaCustomizationFormModal';
import {
  CustomizationType,
  CustomizationTypeEnum,
  PizzaCustomization,
} from '../schema/pizzaCustomization.schema';
import EmptyState from '@/app/components/common/EmptyState';

export function PizzaCustomizationsTab() {
  const theme = useAppTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<CustomizationType | 'all'>(
    'all',
  );

  // Opciones para el dropdown de tipo
  const typeOptions: DropdownOption[] = [
    { id: 'all', label: 'Todas', icon: 'filter-variant' },
    { id: CustomizationTypeEnum.FLAVOR, label: 'Sabores', icon: 'pizza' },
    {
      id: CustomizationTypeEnum.INGREDIENT,
      label: 'Ingredientes',
      icon: 'cheese',
    },
  ];
  const [selectedCustomization, setSelectedCustomization] =
    useState<PizzaCustomization | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingCustomizationId, setEditingCustomizationId] = useState<
    string | undefined
  >();

  const deleteMutation = useDeletePizzaCustomization();

  const {
    data,
    isLoading,
    isError: _isError,
    refetch,
  } = usePizzaCustomizationsList({
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
    setEditingCustomizationId(customization.id);
    setFormModalVisible(true);
  };

  const handleDelete = async (customization: PizzaCustomization) => {
    setDetailModalVisible(false);
    await deleteMutation.mutateAsync(customization.id);
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => handleItemPress(item)}>
      <Surface
        style={[
          styles.cardWrapper,
          !item.isActive && styles.cardWrapperInactive,
        ]}
        elevation={1}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <View style={styles.titleContainer}>
                <Text
                  variant="titleMedium"
                  style={[
                    styles.cardTitle,
                    !item.isActive && styles.textInactive,
                  ]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                {!item.isActive && (
                  <Badge style={styles.inactiveBadge} size={16}>
                    Inactivo
                  </Badge>
                )}
              </View>
              <Chip
                mode="flat"
                compact
                icon={
                  item.type === CustomizationTypeEnum.FLAVOR
                    ? 'pizza'
                    : 'cheese'
                }
                style={[
                  styles.typeChip,
                  {
                    backgroundColor:
                      item.type === CustomizationTypeEnum.FLAVOR
                        ? theme.colors.errorContainer
                        : theme.colors.secondaryContainer,
                  },
                  !item.isActive && styles.chipInactive,
                ]}
                textStyle={styles.chipText}
              >
                {item.type === CustomizationTypeEnum.FLAVOR
                  ? 'Sabor'
                  : 'Ingrediente'}
              </Chip>
            </View>
            <View style={styles.statsContainer}>
              <View
                style={[
                  styles.statusIndicator,
                  item.isActive ? styles.statusActive : styles.statusInactive,
                ]}
              />
              <Text
                variant="bodySmall"
                style={[styles.statText, !item.isActive && styles.textInactive]}
              >
                Orden: {item.sortOrder || 0}
              </Text>
              <Text
                variant="bodySmall"
                style={[styles.statText, !item.isActive && styles.textInactive]}
              >
                • Valor: {item.toppingValue || 0}
              </Text>
              <Text
                variant="bodySmall"
                style={[styles.statText, !item.isActive && styles.textInactive]}
              >
                • {item.products?.length || 0} pizzas
              </Text>
            </View>
          </View>

          {item.ingredients && (
            <Text
              variant="bodySmall"
              style={[
                styles.ingredientsText,
                !item.isActive && styles.textInactive,
              ]}
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
      minWidth: 140,
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
    cardWrapperInactive: {
      opacity: 0.7,
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
    titleContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.s,
    },
    cardTitle: {
      fontWeight: '600',
      color: theme.colors.onSurface,
      fontSize: 16,
    },
    textInactive: {
      color: theme.colors.onSurfaceVariant,
    },
    inactiveBadge: {
      backgroundColor: theme.colors.errorContainer,
      color: theme.colors.onErrorContainer,
      fontSize: 10,
      fontWeight: '600',
    },
    typeChip: {
      height: 24,
    },
    chipInactive: {
      opacity: 0.6,
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
    statusIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    statusActive: {
      backgroundColor: theme.colors.primary,
    },
    statusInactive: {
      backgroundColor: theme.colors.error,
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
            <ThemeDropdown
              label="Tipo"
              value={selectedType}
              options={typeOptions}
              onSelect={(option) =>
                setSelectedType(option.id as CustomizationType | 'all')
              }
              placeholder="Selecciona tipo"
            />
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
                selectedType === CustomizationTypeEnum.FLAVOR
                  ? 'No hay sabores disponibles'
                  : selectedType === CustomizationTypeEnum.INGREDIENT
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

      <PizzaCustomizationFormModal
        visible={formModalVisible}
        onDismiss={() => {
          setFormModalVisible(false);
          setEditingCustomizationId(undefined);
        }}
        customizationId={editingCustomizationId}
        onSuccess={() => {
          refetch();
        }}
      />
    </View>
  );
}
