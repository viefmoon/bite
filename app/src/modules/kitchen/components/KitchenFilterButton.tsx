import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Portal, Modal, Surface, Text, Switch } from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import { useKitchenStore } from '../store/kitchenStore';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { OrderTypeEnum } from '../schema/kitchen.schema';

export const KitchenFilterButton: React.FC = () => {
  const { height: screenHeight } = useWindowDimensions();
  const theme = useAppTheme();
  const [visible, setVisible] = useState(false);
  const { filters, setFilters } = useKitchenStore();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const styles = createStyles(screenHeight, theme);

  const activeFiltersCount = [
    filters.showPrepared,
    filters.showAllProducts,
    filters.ungroupProducts,
    filters.orderType !== undefined,
  ].filter(Boolean).length;

  const handleToggleFilter = (filterName: keyof typeof filters) => {
    setFilters({
      ...filters,
      [filterName]: !filters[filterName],
    });
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        style={styles.buttonContainer}
      >
        <Animated.View
          style={[
            styles.filterButton,
            activeFiltersCount > 0
              ? styles.filterButtonActive
              : styles.filterButtonInactive,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Icon
            name="tune-variant"
            size={24}
            color={
              activeFiltersCount > 0
                ? theme.colors.onPrimaryContainer
                : theme.colors.onPrimary
            }
          />
          {activeFiltersCount > 0 && (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: theme.colors.error,
                },
              ]}
            >
              <Text style={[styles.badgeText, { color: theme.colors.onError }]}>
                {activeFiltersCount}
              </Text>
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>

      <Portal>
        <Modal
          visible={visible}
          onDismiss={() => setVisible(false)}
          contentContainerStyle={[
            styles.modalContent,
            {
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          <ScrollView
            style={[
              styles.scrollView,
              screenHeight < 400 && { maxHeight: screenHeight - 80 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <Surface
              style={[
                styles.modalSurface,
                { backgroundColor: theme.colors.surface },
              ]}
              elevation={3}
            >
              <View
                style={[
                  styles.modalHeader,
                  { backgroundColor: theme.colors.primaryContainer },
                ]}
              >
                <View style={styles.headerContent}>
                  <Icon
                    name="tune-variant"
                    size={24}
                    color={theme.colors.onPrimaryContainer}
                  />
                  <View style={styles.headerTextContainer}>
                    <Text
                      variant="titleMedium"
                      style={[
                        styles.modalTitle,
                        { color: theme.colors.onPrimaryContainer },
                      ]}
                    >
                      Filtros de visualización
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setVisible(false)}
                  style={styles.closeButton}
                >
                  <Icon
                    name="close"
                    size={22}
                    color={theme.colors.onPrimaryContainer}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.filtersList}>
                {/* Tipo de orden */}
                <View style={styles.sectionHeader}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Tipo de orden
                  </Text>
                </View>
                <View style={styles.orderTypeContainer}>
                  {[
                    { value: undefined, label: 'Todos', icon: 'check-all' },
                    {
                      value: OrderTypeEnum.DINE_IN,
                      label: 'Mesa',
                      icon: 'table',
                    },
                    {
                      value: OrderTypeEnum.TAKE_AWAY,
                      label: 'Llevar',
                      icon: 'bag-personal',
                    },
                    {
                      value: OrderTypeEnum.DELIVERY,
                      label: 'Domicilio',
                      icon: 'truck-delivery',
                    },
                  ].map((option) => {
                    const isSelected = filters.orderType === option.value;
                    return (
                      <TouchableOpacity
                        key={option.label}
                        style={[
                          styles.orderTypeButton,
                          isSelected && {
                            backgroundColor: theme.colors.primaryContainer,
                            borderColor: theme.colors.primary,
                          },
                          !isSelected && styles.orderTypeButtonInactive,
                        ]}
                        onPress={() =>
                          setFilters({ ...filters, orderType: option.value })
                        }
                        activeOpacity={0.8}
                      >
                        <Icon
                          name={option.icon as any}
                          size={20}
                          color={
                            isSelected
                              ? theme.colors.onPrimaryContainer
                              : theme.colors.onSurfaceVariant
                          }
                        />
                        <Text
                          variant="labelMedium"
                          style={[
                            styles.orderTypeLabel,
                            isSelected
                              ? styles.orderTypeLabelSelected
                              : styles.orderTypeLabelUnselected,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View
                  style={[
                    styles.divider,
                    { backgroundColor: theme.colors.outlineVariant },
                  ]}
                />

                {/* Otros filtros */}
                <View style={styles.sectionHeader}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Opciones de visualización
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleToggleFilter('showPrepared')}
                  activeOpacity={0.7}
                >
                  <Surface
                    style={[
                      styles.filterItem,
                      filters.showPrepared && {
                        backgroundColor: theme.colors.primaryContainer,
                        borderColor: theme.colors.primary,
                      },
                    ]}
                    elevation={1}
                  >
                    <View style={styles.filterItemContent}>
                      <View
                        style={[
                          styles.iconContainer,
                          {
                            backgroundColor: filters.showPrepared
                              ? theme.colors.primary
                              : theme.colors.surfaceVariant,
                          },
                        ]}
                      >
                        <Icon
                          name="check-circle-outline"
                          size={22}
                          color={
                            filters.showPrepared
                              ? theme.colors.onPrimary
                              : theme.colors.onSurfaceVariant
                          }
                        />
                      </View>
                      <View style={styles.filterTextContent}>
                        <Text
                          variant="titleSmall"
                          style={styles.filterItemTitle}
                        >
                          Mostrar listas
                        </Text>
                        <Text
                          variant="bodySmall"
                          style={styles.filterItemDescription}
                        >
                          Muestra solo las órdenes listas
                        </Text>
                      </View>
                      <Switch
                        value={filters.showPrepared}
                        onValueChange={() => handleToggleFilter('showPrepared')}
                        color={theme.colors.primary}
                      />
                    </View>
                  </Surface>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleToggleFilter('showAllProducts')}
                  activeOpacity={0.7}
                >
                  <Surface
                    style={[
                      styles.filterItem,
                      filters.showAllProducts && {
                        backgroundColor: theme.colors.primaryContainer,
                        borderColor: theme.colors.primary,
                      },
                    ]}
                    elevation={1}
                  >
                    <View style={styles.filterItemContent}>
                      <View
                        style={[
                          styles.iconContainer,
                          {
                            backgroundColor: filters.showAllProducts
                              ? theme.colors.primary
                              : theme.colors.surfaceVariant,
                          },
                        ]}
                      >
                        <Icon
                          name="eye-outline"
                          size={22}
                          color={
                            filters.showAllProducts
                              ? theme.colors.onPrimary
                              : theme.colors.onSurfaceVariant
                          }
                        />
                      </View>
                      <View style={styles.filterTextContent}>
                        <Text
                          variant="titleSmall"
                          style={styles.filterItemTitle}
                        >
                          Ver todos los productos
                        </Text>
                        <Text
                          variant="bodySmall"
                          style={styles.filterItemDescription}
                        >
                          Muestra productos de todas las órdenes
                        </Text>
                      </View>
                      <Switch
                        value={filters.showAllProducts}
                        onValueChange={() =>
                          handleToggleFilter('showAllProducts')
                        }
                        color={theme.colors.primary}
                      />
                    </View>
                  </Surface>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleToggleFilter('ungroupProducts')}
                  activeOpacity={0.7}
                >
                  <Surface
                    style={[
                      styles.filterItem,
                      filters.ungroupProducts && {
                        backgroundColor: theme.colors.primaryContainer,
                        borderColor: theme.colors.primary,
                      },
                    ]}
                    elevation={1}
                  >
                    <View style={styles.filterItemContent}>
                      <View
                        style={[
                          styles.iconContainer,
                          {
                            backgroundColor: filters.ungroupProducts
                              ? theme.colors.primary
                              : theme.colors.surfaceVariant,
                          },
                        ]}
                      >
                        <Icon
                          name="ungroup"
                          size={22}
                          color={
                            filters.ungroupProducts
                              ? theme.colors.onPrimary
                              : theme.colors.onSurfaceVariant
                          }
                        />
                      </View>
                      <View style={styles.filterTextContent}>
                        <Text
                          variant="titleSmall"
                          style={styles.filterItemTitle}
                        >
                          Desagrupar productos
                        </Text>
                        <Text
                          variant="bodySmall"
                          style={styles.filterItemDescription}
                        >
                          Muestra cada producto individualmente
                        </Text>
                      </View>
                      <Switch
                        value={filters.ungroupProducts}
                        onValueChange={() =>
                          handleToggleFilter('ungroupProducts')
                        }
                        color={theme.colors.primary}
                      />
                    </View>
                  </Surface>
                </TouchableOpacity>
              </View>
            </Surface>
          </ScrollView>
        </Modal>
      </Portal>
    </>
  );
};

const createStyles = (screenHeight: number, theme: any) =>
  StyleSheet.create({
    buttonContainer: {
      marginRight: 12,
    },
    filterButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    filterButtonActive: {
      backgroundColor: theme.colors.primaryContainer,
    },
    filterButtonInactive: {
      backgroundColor: 'rgba(255,255,255,0.2)',
    },
    badge: {
      position: 'absolute',
      top: -4,
      right: -4,
      width: 20,
      height: 20,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: 'bold',
    },
    modalContent: {
      margin: screenHeight < 400 ? 10 : 20,
      maxWidth: screenHeight < 400 ? '90%' : 380,
      maxHeight: screenHeight < 400 ? screenHeight - 60 : undefined,
      alignSelf: 'center',
      width: '90%',
      borderRadius: 20,
      overflow: 'hidden',
    },
    modalSurface: {
      borderRadius: 20,
      overflow: 'hidden',
      maxHeight: screenHeight < 400 ? screenHeight - 60 : undefined,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: screenHeight < 400 ? 12 : 16,
      paddingBottom: screenHeight < 400 ? 8 : 12,
      marginBottom: 4,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    headerTextContainer: {
      marginLeft: 10,
      flex: 1,
    },
    modalTitle: {
      fontWeight: '700',
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
    },
    filtersList: {
      padding: screenHeight < 400 ? 8 : 12,
      paddingTop: screenHeight < 400 ? 4 : 8,
      gap: screenHeight < 400 ? 6 : 10,
    },
    filterItem: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'transparent',
      overflow: 'hidden',
    },
    filterItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: screenHeight < 400 ? 8 : 12,
      gap: screenHeight < 400 ? 8 : 10,
    },
    iconContainer: {
      width: screenHeight < 400 ? 32 : 40,
      height: screenHeight < 400 ? 32 : 40,
      borderRadius: screenHeight < 400 ? 16 : 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    filterTextContent: {
      flex: 1,
      gap: 2,
    },
    sectionHeader: {
      marginBottom: screenHeight < 400 ? 8 : 12,
      paddingHorizontal: 4,
    },
    orderTypeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
      gap: 8,
    },
    orderTypeButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: screenHeight < 400 ? 8 : 12,
      paddingHorizontal: screenHeight < 400 ? 4 : 8,
      borderRadius: 12,
      borderWidth: 1.5,
    },
    divider: {
      height: 1,
      marginVertical: screenHeight < 400 ? 8 : 16,
      marginHorizontal: screenHeight < 400 ? -8 : -12,
    },
    scrollView: {
      flex: 1,
    },
    sectionTitle: {
      color: theme.colors.onSurface,
      fontWeight: '600',
    },
    orderTypeLabel: {
      marginTop: 4,
    },
    orderTypeButtonInactive: {
      backgroundColor: theme.colors.surfaceVariant,
      borderColor: 'transparent',
    },
    orderTypeLabelSelected: {
      color: theme.colors.onPrimaryContainer,
      fontWeight: '700',
    },
    orderTypeLabelUnselected: {
      color: theme.colors.onSurfaceVariant,
      fontWeight: '500',
    },
    filterItemTitle: {
      color: theme.colors.onSurface,
      fontWeight: '600',
    },
    filterItemDescription: {
      color: theme.colors.onSurfaceVariant,
    },
  });
