import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { Portal, Modal, Surface, Text, Switch } from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import { useKitchenStore } from '../store/kitchenStore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { OrderType } from '../types/kitchen.types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const KitchenFilterButton: React.FC = () => {
  const theme = useAppTheme();
  const [visible, setVisible] = useState(false);
  const { filters, setFilters } = useKitchenStore();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

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
            {
              backgroundColor:
                activeFiltersCount > 0
                  ? theme.colors.primaryContainer
                  : 'rgba(255,255,255,0.2)',
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
            style={{
              maxHeight: screenHeight < 400 ? screenHeight - 80 : undefined,
            }}
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
                  <Text
                    variant="titleMedium"
                    style={{ color: theme.colors.onSurface, fontWeight: '600' }}
                  >
                    Tipo de orden
                  </Text>
                </View>
                <View style={styles.orderTypeContainer}>
                  {[
                    { value: undefined, label: 'Todos', icon: 'check-all' },
                    {
                      value: OrderType.DINE_IN,
                      label: 'Mesa',
                      icon: 'table-chair',
                    },
                    {
                      value: OrderType.TAKE_AWAY,
                      label: 'Llevar',
                      icon: 'bag-checked',
                    },
                    {
                      value: OrderType.DELIVERY,
                      label: 'Domicilio',
                      icon: 'moped',
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
                          !isSelected && {
                            backgroundColor: theme.colors.surfaceVariant,
                            borderColor: 'transparent',
                          },
                        ]}
                        onPress={() =>
                          setFilters({ ...filters, orderType: option.value })
                        }
                        activeOpacity={0.8}
                      >
                        <Icon
                          name={option.icon}
                          size={20}
                          color={
                            isSelected
                              ? theme.colors.onPrimaryContainer
                              : theme.colors.onSurfaceVariant
                          }
                        />
                        <Text
                          variant="labelMedium"
                          style={{
                            color: isSelected
                              ? theme.colors.onPrimaryContainer
                              : theme.colors.onSurfaceVariant,
                            fontWeight: isSelected ? '700' : '500',
                            marginTop: 4,
                          }}
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
                  <Text
                    variant="titleMedium"
                    style={{ color: theme.colors.onSurface, fontWeight: '600' }}
                  >
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
                          style={{
                            color: theme.colors.onSurface,
                            fontWeight: '600',
                          }}
                        >
                          Mostrar listas
                        </Text>
                        <Text
                          variant="bodySmall"
                          style={{ color: theme.colors.onSurfaceVariant }}
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
                          style={{
                            color: theme.colors.onSurface,
                            fontWeight: '600',
                          }}
                        >
                          Ver todos los productos
                        </Text>
                        <Text
                          variant="bodySmall"
                          style={{ color: theme.colors.onSurfaceVariant }}
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
                          style={{
                            color: theme.colors.onSurface,
                            fontWeight: '600',
                          }}
                        >
                          Desagrupar productos
                        </Text>
                        <Text
                          variant="bodySmall"
                          style={{ color: theme.colors.onSurfaceVariant }}
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

const styles = StyleSheet.create({
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
    maxWidth: screenHeight < 400 ? screenWidth - 40 : 380,
    maxHeight: screenHeight < 400 ? screenHeight - 60 : undefined,
    alignSelf: 'center',
    width: Math.min(screenWidth - (screenHeight < 400 ? 40 : 60), 380),
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
});
