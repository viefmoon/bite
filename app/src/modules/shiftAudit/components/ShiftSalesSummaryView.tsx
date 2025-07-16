import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  IconButton,
  Divider,
  Chip,
  ActivityIndicator,
  DataTable,
  ProgressBar,
  Appbar,
} from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import { formatCurrency } from '@/app/lib/formatters';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useShiftSalesSummary } from '../hooks/useShiftSalesSummary';
import type { 
  CategorySalesSummary, 
  SubcategorySalesSummary,
  ProductSalesSummary 
} from '../hooks/useShiftSalesSummary';

interface Props {
  shiftId: string;
  shiftNumber?: number;
  onBack: () => void;
}

export function ShiftSalesSummaryView({ 
  shiftId,
  shiftNumber,
  onBack 
}: Props) {
  const theme = useAppTheme();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());

  const { data: summary, isLoading, error } = useShiftSalesSummary(shiftId);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleSubcategory = (subcategoryId: string) => {
    const newExpanded = new Set(expandedSubcategories);
    if (newExpanded.has(subcategoryId)) {
      newExpanded.delete(subcategoryId);
    } else {
      newExpanded.add(subcategoryId);
    }
    setExpandedSubcategories(newExpanded);
  };

  const renderHeader = () => (
    <Appbar.Header elevated>
      <Appbar.BackAction onPress={onBack} />
      <Appbar.Content 
        title={`Resumen de Ventas - Turno #${shiftNumber || summary?.shiftNumber || 'N/A'}`}
        titleStyle={{ fontSize: 18 }}
      />
    </Appbar.Header>
  );

  const renderSummaryCards = () => {
    if (!summary) return null;

    return (
      <View style={styles.summaryCardsContainer}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardLabel}>VENTAS</Text>
            <Text style={styles.summaryCardValue}>
              {formatCurrency(summary.totalSales)}
            </Text>
          </View>
          
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardLabel}>ÓRDENES</Text>
            <Text style={styles.summaryCardValue}>
              {summary.completedOrders}
            </Text>
          </View>
        </View>
        
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardLabel}>PRODUCTOS</Text>
            <Text style={styles.summaryCardValue}>
              {summary.totalQuantity}
            </Text>
          </View>
          
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardLabel}>PROMEDIO</Text>
            <Text style={styles.summaryCardValue}>
              {formatCurrency(summary.averageTicket)}
            </Text>
          </View>
        </View>
        
        <Text style={styles.adjustmentNote}>
          * Los totales incluyen ajustes aplicados (descuentos y cargos)
        </Text>
      </View>
    );
  };

  const renderCategoryItem = (category: CategorySalesSummary) => {
    const isExpanded = expandedCategories.has(category.categoryId);
    
    return (
      <View key={category.categoryId}>
        <TouchableOpacity 
          onPress={() => toggleCategory(category.categoryId)}
          activeOpacity={0.7}
        >
          <View style={styles.categoryItem}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryInfo}>
                <View style={styles.categoryTitleRow}>
                  <Text style={styles.categoryName}>{category.categoryName}</Text>
                  <Text style={styles.categoryPercentage}>
                    {category.percentage.toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.categoryStatsRow}>
                  <Text style={styles.categoryQuantity}>
                    {category.quantity} productos vendidos
                  </Text>
                  <Text style={styles.categoryAmount}>
                    {formatCurrency(category.totalAmount)}
                  </Text>
                </View>
                <ProgressBar 
                  progress={category.percentage / 100} 
                  style={styles.progressBar}
                  color={theme.colors.primary}
                />
              </View>
              <IconButton
                icon={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={24}
                iconColor={theme.colors.onSurfaceVariant}
                style={styles.expandIcon}
              />
            </View>
          </View>
        </TouchableOpacity>

        {isExpanded && category.subcategories.length > 0 && (
          <View style={styles.subcategoriesContainer}>
            {category.subcategories.map((subcategory) => 
              renderSubcategoryItem(subcategory)
            )}
          </View>
        )}
      </View>
    );
  };

  const renderSubcategoryItem = (subcategory: SubcategorySalesSummary) => {
    const isExpanded = expandedSubcategories.has(subcategory.subcategoryId);
    
    return (
      <View key={subcategory.subcategoryId}>
        <TouchableOpacity
          onPress={() => toggleSubcategory(subcategory.subcategoryId)}
          activeOpacity={0.7}
        >
          <View style={styles.subcategoryItem}>
            <View style={styles.subcategoryHeader}>
              <View style={styles.subcategoryInfo}>
                <Text style={styles.subcategoryName}>{subcategory.subcategoryName}</Text>
                <Text style={styles.subcategoryStats}>
                  {subcategory.quantity} productos • {formatCurrency(subcategory.totalAmount)}
                </Text>
              </View>
              <IconButton
                icon={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                iconColor={theme.colors.onSurfaceVariant}
              />
            </View>
          </View>
        </TouchableOpacity>

        {isExpanded && subcategory.products.length > 0 && (
          <View style={styles.productsContainer}>
            {subcategory.products.map((product) => (
              <View key={product.productId} style={styles.productItem}>
                <Text style={styles.productName}>{product.productName}</Text>
                <View style={styles.productStats}>
                  <Text style={styles.productQuantity}>{product.quantity}x</Text>
                  <Text style={styles.productAmount}>
                    {formatCurrency(product.totalAmount)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderTopProducts = () => {
    if (!summary || !summary.topProducts || summary.topProducts.length === 0) {
      return null;
    }

    return (
      <View style={styles.topProductsSection}>
        <Text style={styles.sectionTitle}>Top 10 Productos Más Vendidos</Text>
        <View style={styles.topProductsTable}>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title style={styles.rankColumn}>#</DataTable.Title>
              <DataTable.Title style={styles.productColumn}>Producto</DataTable.Title>
              <DataTable.Title numeric style={styles.quantityColumn}>Cant.</DataTable.Title>
              <DataTable.Title numeric style={styles.amountColumn}>Total</DataTable.Title>
            </DataTable.Header>

            {summary.topProducts.slice(0, 10).map((product, index) => (
              <DataTable.Row key={product.productId}>
                <DataTable.Cell style={styles.rankColumn}>
                  <Text style={styles.rankNumber}>{index + 1}</Text>
                </DataTable.Cell>
                <DataTable.Cell style={styles.productColumn}>
                  <Text style={styles.topProductName} numberOfLines={2}>
                    {product.productName}
                  </Text>
                </DataTable.Cell>
                <DataTable.Cell numeric style={styles.quantityColumn}>
                  {product.quantity}
                </DataTable.Cell>
                <DataTable.Cell numeric style={styles.amountColumn}>
                  {formatCurrency(product.totalAmount)}
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </View>
      </View>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Cargando resumen de ventas...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error al cargar el resumen de ventas</Text>
        </View>
      );
    }

    if (!summary) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No hay datos disponibles</Text>
        </View>
      );
    }

    return (
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderSummaryCards()}
        
        <Divider style={styles.sectionDivider} />
        
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Ventas por Categoría</Text>
          {summary.categories.map(renderCategoryItem)}
        </View>

        <Divider style={styles.sectionDivider} />

        {renderTopProducts()}
      </ScrollView>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      paddingBottom: theme.spacing.xl,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    loadingText: {
      marginTop: theme.spacing.m,
      color: theme.colors.onSurfaceVariant,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: 16,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    emptyText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 16,
    },
    summaryCardsContainer: {
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
    },
    summaryRow: {
      flexDirection: 'row',
      gap: theme.spacing.s,
      marginBottom: theme.spacing.s,
    },
    summaryCard: {
      flex: 1,
      paddingVertical: theme.spacing.s,
      paddingHorizontal: theme.spacing.m,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surfaceVariant,
      alignItems: 'center',
    },
    summaryCardLabel: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
      letterSpacing: 0.3,
    },
    summaryCardValue: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.onSurface,
      marginTop: 2,
    },
    adjustmentNote: {
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
      textAlign: 'center',
      marginTop: theme.spacing.s,
      paddingHorizontal: theme.spacing.m,
    },
    sectionDivider: {
      marginVertical: theme.spacing.s,
      marginHorizontal: theme.spacing.m,
    },
    categoriesSection: {
      paddingHorizontal: theme.spacing.m,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.m,
    },
    categoryItem: {
      marginBottom: theme.spacing.s,
      padding: theme.spacing.m,
      borderRadius: theme.roundness * 2,
      backgroundColor: theme.colors.surface,
      elevation: 1,
    },
    categoryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    categoryInfo: {
      flex: 1,
    },
    categoryTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    categoryName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    categoryPercentage: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    categoryStatsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.s,
    },
    categoryQuantity: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    categoryAmount: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    expandIcon: {
      marginLeft: theme.spacing.xs,
    },
    progressBar: {
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.surfaceVariant,
    },
    subcategoriesContainer: {
      paddingLeft: theme.spacing.m,
      paddingBottom: theme.spacing.s,
    },
    subcategoryItem: {
      marginBottom: theme.spacing.xs,
      marginHorizontal: theme.spacing.xs,
      padding: theme.spacing.m,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    subcategoryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    subcategoryInfo: {
      flex: 1,
    },
    subcategoryName: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurface,
    },
    subcategoryStats: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
    },
    productsContainer: {
      paddingLeft: theme.spacing.m,
      paddingTop: theme.spacing.xs,
    },
    productItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.s,
      paddingHorizontal: theme.spacing.m,
      marginHorizontal: theme.spacing.s,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      marginBottom: theme.spacing.xs,
    },
    productName: {
      flex: 1,
      fontSize: 12,
      color: theme.colors.onSurface,
    },
    productStats: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.m,
    },
    productQuantity: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      fontWeight: '500',
      minWidth: 30,
      textAlign: 'right',
    },
    productAmount: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.primary,
      minWidth: 60,
      textAlign: 'right',
    },
    topProductsSection: {
      paddingHorizontal: theme.spacing.m,
      paddingBottom: theme.spacing.m,
    },
    topProductsTable: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness * 2,
      overflow: 'hidden',
    },
    rankColumn: {
      flex: 0.5,
    },
    productColumn: {
      flex: 3,
    },
    quantityColumn: {
      flex: 1,
    },
    amountColumn: {
      flex: 1.5,
    },
    rankNumber: {
      fontWeight: '700',
      color: theme.colors.primary,
    },
    topProductName: {
      fontSize: 13,
      color: theme.colors.onSurface,
    },
  });

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderContent()}
    </View>
  );
}