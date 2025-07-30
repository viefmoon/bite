import React, { useMemo, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, Animated, Pressable } from 'react-native';
import {
  Card,
  Title,
  Text,
  IconButton,
  ActivityIndicator,
  Appbar,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AutoImage } from '@/app/components/common/AutoImage';
import { useAppTheme } from '@/app/styles/theme';
import { useResponsive } from '@/app/hooks/useResponsive';
import {
  Category,
  SubCategory,
  Product,
  FullMenuCategory,
} from '../../schema/orders.schema';
import CartButton from '../CartButton';
import { useCartStore } from '../../stores/useCartStore';
import type { CartItem } from '../../utils/cartUtils';
import { CategoryQuickAccess } from './CategoryQuickAccess';

interface CategoryGridProps {
  isLoading: boolean;
  navigationLevel: 'categories' | 'subcategories' | 'products';
  items: (Category | SubCategory | Product)[];
  title: string;
  onItemSelect: (item: Category | SubCategory | Product) => void;
  onBack: () => void;
  onProductInfo?: (product: Product) => void;
  showCartButton: boolean;
  cartButtonRef: React.RefObject<{ animate: () => void } | null>;
  totalItemsCount: number;
  onViewCart: () => void;
  cartItems?: CartItem[];
  categories?: FullMenuCategory[];
  selectedCategoryId?: string | null;
  onCategoryQuickSelect?: (categoryId: string) => void;
}

const AnimatedItem: React.FC<{
  item: Category | SubCategory | Product;
  styles: any;
  onPress: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}> = ({ item: _item, styles, onPress, children, disabled }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 0.92,
        useNativeDriver: true,
        speed: 30,
        bounciness: 0,
      }),
      Animated.timing(opacityValue, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        speed: 15,
        bounciness: 12,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(scaleValue, {
          toValue: 1.08,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 0.9,
          duration: 120,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          useNativeDriver: true,
          speed: 12,
          bounciness: 18,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    setTimeout(() => {
      onPress();
    }, 180);
  };

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleValue }],
          opacity: opacityValue,
        },
        styles.animatedContainer,
      ]}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled}
        style={styles.pressableStyle}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  isLoading,
  navigationLevel,
  items,
  title,
  onItemSelect,
  onBack,
  onProductInfo,
  showCartButton,
  cartButtonRef,
  totalItemsCount,
  onViewCart,
  cartItems,
  categories,
  selectedCategoryId,
  onCategoryQuickSelect,
}) => {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const { colors, fonts } = theme;
  const storeCartItems = useCartStore((state) => state.items);
  const activeCartItems = cartItems || storeCartItems;
  const getProductCount = useCallback(
    (productId: string) => {
      return activeCartItems
        .filter((item) => item.productId === productId)
        .reduce((sum, item) => sum + item.quantity, 0);
    },
    [activeCartItems],
  );

  const numColumns = useMemo(() => {
    if (responsive.width >= 600) {
      if (responsive.width >= 1200) return 6;
      if (responsive.width >= 900) return 5;
      if (responsive.width >= 768) return 4;
      return 3;
    }
    if (responsive.width >= 480) return 3;
    if (responsive.width >= 360) return 2;
    return 2;
  }, [responsive.width]);

  const itemWidth = useMemo(() => {
    const padding = responsive.spacing(theme.spacing.m);
    const totalPadding = padding * 2;
    const gap = responsive.spacing(8);
    const totalGaps = gap * (numColumns - 1);
    const availableWidth = responsive.width - totalPadding - totalGaps;
    return Math.floor(availableWidth / numColumns);
  }, [responsive, numColumns, theme.spacing.m]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: colors.background,
        },
        appBar: {
          backgroundColor: colors.elevation.level2,
          alignItems: 'center',
        },
        appBarTitle: {
          ...fonts.titleMedium,
          color: colors.onSurface,
          fontWeight: 'bold',
          textAlign: 'center',
        },
        appBarContent: {},
        spacer: {
          width: 48,
        },
        content: {
          flex: 1,
        },
        loadingContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
        gridContainer: {
          padding: responsive.spacing(theme.spacing.m),
          paddingBottom: 60,
        },
        row: {
          justifyContent: 'flex-start',
          paddingHorizontal: 0,
          marginBottom: responsive.spacing(8),
          gap: responsive.spacing(8),
        },
        cardItem: {
          width: itemWidth,
          marginHorizontal: 0,
          marginVertical: 0,
          overflow: 'hidden',
          borderRadius: theme.roundness * 2,
          elevation: 2,
          backgroundColor: colors.surface,
          aspectRatio: 0.85,
        },
        cardItemInactive: {
          opacity: 0.5,
        },
        itemImage: {
          width: '100%',
          height: itemWidth * 0.65,
        },
        imageInactive: {
          opacity: 0.6,
        },
        cardContent: {
          paddingHorizontal: responsive.spacing(theme.spacing.s),
          paddingVertical: responsive.spacing(theme.spacing.xs),
          height: itemWidth * 0.35,
          justifyContent: 'center',
        },
        cardTitle: {
          fontSize: responsive.fontSize(responsive.width >= 600 ? 16 : 15),
          fontWeight: '600',
          lineHeight:
            responsive.fontSize(responsive.width >= 600 ? 16 : 15) * 1.2,
          marginBottom: responsive.spacing(2),
        },
        cardHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        },
        infoButton: {
          margin: -8,
          marginTop: -12,
          marginRight: -12,
        },
        priceText: {
          color: theme.colors.primary,
          fontWeight: '600',
          fontSize: responsive.fontSize(responsive.width >= 600 ? 14 : 13),
          marginTop: 2,
        },
        noItemsText: {
          textAlign: 'center',
          marginTop: 40,
          fontSize: 16,
          color: '#666',
        },
        inactiveBadge: {
          position: 'absolute',
          top: 8,
          right: 8,
          backgroundColor: colors.errorContainer,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 4,
        },
        inactiveBadgeText: {
          fontSize: 12,
          color: colors.onErrorContainer,
          fontWeight: '600',
        },
        animatedContainer: {
          elevation: 3,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.15,
          shadowRadius: 3.84,
        },
        productBadge: {
          position: 'absolute',
          top: 8,
          left: 8,
          backgroundColor: colors.primary,
          minWidth: 24,
          height: 24,
          borderRadius: 12,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 6,
        },
        productBadgeText: {
          color: colors.onPrimary,
          fontSize: 12,
          fontWeight: 'bold',
        },
        pressableStyle: {
          flex: 1,
        },
        flexOne: {
          flex: 1,
        },
      }),
    [colors, fonts, theme, responsive, itemWidth],
  );

  const blurhash =
    '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

  const renderItem = useCallback(
    ({ item }: { item: Category | SubCategory | Product }) => {
      const imageSource = item.photo ? item.photo.path : null;
      const isActive = item.isActive !== false;
      const isProductWithoutScreen =
        navigationLevel === 'products' &&
        'preparationScreenId' in item &&
        !item.preparationScreenId;
      const productCount =
        navigationLevel === 'products' && 'price' in item
          ? getProductCount(item.id)
          : 0;

      const handlePress = () => {
        if (!isActive || isProductWithoutScreen) return;
        onItemSelect(item);
      };

      const renderPrice = () => {
        if (
          navigationLevel === 'products' &&
          'price' in item &&
          'hasVariants' in item
        ) {
          const productItem = item as Product;
          if (
            !productItem.hasVariants &&
            productItem.price !== null &&
            productItem.price !== undefined
          ) {
            return (
              <Text style={styles.priceText}>
                ${productItem.price.toFixed(2)}
              </Text>
            );
          }
        }
        return null;
      };

      return (
        <AnimatedItem
          item={item}
          styles={styles}
          onPress={handlePress}
          disabled={!isActive || isProductWithoutScreen}
        >
          <Card
            style={[
              styles.cardItem,
              (!isActive || isProductWithoutScreen) && styles.cardItemInactive,
            ]}
          >
            <AutoImage
              source={imageSource}
              style={[
                styles.itemImage,
                (!isActive || isProductWithoutScreen) && styles.imageInactive,
              ]}
              contentFit="cover"
              placeholder={blurhash}
              transition={300}
              placeholderIcon="image-outline"
            />
            {!isActive && (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveBadgeText}>INACTIVO</Text>
              </View>
            )}
            {isProductWithoutScreen && (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveBadgeText}>SIN PANTALLA</Text>
              </View>
            )}
            {productCount > 0 && (
              <View style={styles.productBadge}>
                <Text style={styles.productBadgeText}>{productCount}</Text>
              </View>
            )}
            <View style={styles.cardContent}>
              {navigationLevel === 'products' &&
              'price' in item &&
              (item as Product).description &&
              onProductInfo ? (
                <View style={styles.cardHeader}>
                  <Title
                    style={[styles.cardTitle, styles.flexOne]}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {item.name}
                  </Title>
                  <IconButton
                    icon="information-outline"
                    size={20}
                    onPress={() => onProductInfo(item as Product)}
                    style={styles.infoButton}
                  />
                </View>
              ) : (
                <Title
                  style={styles.cardTitle}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {item.name}
                </Title>
              )}
              {renderPrice()}
            </View>
          </Card>
        </AnimatedItem>
      );
    },
    [
      navigationLevel,
      onItemSelect,
      onProductInfo,
      styles,
      blurhash,
      getProductCount,
    ],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <Appbar.Header style={styles.appBar} elevated>
        <Appbar.BackAction onPress={onBack} />
        <Appbar.Content
          title={title}
          titleStyle={styles.appBarTitle}
          style={styles.appBarContent}
        />
        {showCartButton ? (
          <CartButton
            ref={cartButtonRef}
            itemCount={totalItemsCount}
            onPress={onViewCart}
          />
        ) : (
          <View style={styles.spacer} />
        )}
      </Appbar.Header>

      {navigationLevel !== 'categories' &&
        categories &&
        selectedCategoryId &&
        onCategoryQuickSelect && (
          <CategoryQuickAccess
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onCategorySelect={onCategoryQuickSelect}
          />
        )}

      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2e7d32" />
            <Text>Cargando...</Text>
          </View>
        ) : items.length > 0 ? (
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={numColumns}
            key={numColumns}
            contentContainerStyle={styles.gridContainer}
            columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <Text style={styles.noItemsText}>
            {navigationLevel === 'products'
              ? 'No hay productos disponibles'
              : navigationLevel === 'subcategories'
                ? 'No hay subcategorías disponibles'
                : 'No hay categorías disponibles'}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
};
