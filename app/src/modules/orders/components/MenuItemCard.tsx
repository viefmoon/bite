import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Title, Text, IconButton } from 'react-native-paper';
import { AutoImage } from '@/app/components/common/AutoImage';
import { useAppTheme } from '@/app/styles/theme';
import { useResponsive } from '@/app/hooks/useResponsive';
import type { Product, Category, SubCategory } from '../types/orders.types';

interface MenuItemCardProps {
  item: Category | SubCategory | Product;
  onPress: () => void;
  onLongPress?: () => void;
  onInfoPress?: () => void;
  navigationLevel: 'categories' | 'subcategories' | 'products';
  disabled?: boolean;
  showPrice?: boolean;
}

const MenuItemCard = React.memo<MenuItemCardProps>(
  ({
    item,
    onPress,
    onLongPress,
    onInfoPress,
    navigationLevel,
    disabled = false,
    showPrice = true,
  }) => {
    const theme = useAppTheme();
    const { colors, fonts } = theme;
    const responsive = useResponsive();

    const blurhash =
      '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

    const styles = useMemo(
      () =>
        StyleSheet.create({
          cardItem: {
            flex: 1,
            minWidth: 120, // Ancho mínimo para evitar cards muy pequeños
            overflow: 'hidden',
            borderRadius: theme.roundness,
            elevation: 2,
          },
          cardItemInactive: {
            opacity: 0.5,
          },
          itemImage: {
            width: '100%',
            height: responsive.getResponsiveDimension(120, 160),
          },
          imageInactive: {
            opacity: 0.6,
          },
          cardContent: {
            paddingHorizontal: responsive.spacing.s,
            paddingVertical: responsive.spacing.xs,
          },
          cardTitle: {
            fontSize: responsive.fontSize.m,
            fontWeight: '600',
            lineHeight: responsive.fontSize.m * 1.2,
          },
          cardHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          },
          infoButton: {
            margin: -4,
            marginTop: -6,
            marginRight: -6,
          },
          priceText: {
            color: theme.colors.primary,
            fontWeight: '600',
            fontSize: responsive.fontSize.s,
            marginTop: 2,
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
        }),
      [colors, fonts, theme, responsive],
    );

    // Determinar si el item está activo
    const isActive = item.isActive !== false;

    // Verificar si es un producto sin pantalla de preparación
    const isProductWithoutScreen =
      navigationLevel === 'products' &&
      'preparationScreenId' in item &&
      !item.preparationScreenId;

    // Determinar si el card está deshabilitado
    const isDisabled = disabled || !isActive || isProductWithoutScreen;

    // Obtener la URL de la imagen
    const imageSource = item.photo ? item.photo.path : null;

    // Determinar si mostrar el precio
    const shouldShowPrice = () => {
      if (!showPrice) return false;
      if (
        navigationLevel === 'products' &&
        'price' in item &&
        'hasVariants' in item
      ) {
        const productItem = item as Product;
        return (
          !productItem.hasVariants &&
          productItem.price !== null &&
          productItem.price !== undefined
        );
      }
      return false;
    };

    // Determinar si mostrar el botón de información
    const shouldShowInfoButton = () => {
      return (
        navigationLevel === 'products' &&
        'price' in item &&
        'description' in item &&
        (item as Product).description &&
        (item as Product).description.trim() !== '' &&
        onInfoPress
      );
    };

    // Obtener el texto del badge
    const getBadgeText = () => {
      if (!isActive) return 'INACTIVO';
      if (isProductWithoutScreen) return 'SIN PANTALLA';
      return null;
    };

    const badgeText = getBadgeText();

    return (
      <Card
        style={[styles.cardItem, isDisabled && styles.cardItemInactive]}
        onPress={isDisabled ? undefined : onPress}
        onLongPress={isDisabled ? undefined : onLongPress}
        disabled={isDisabled}
      >
        <AutoImage
          source={imageSource}
          style={[styles.itemImage, isDisabled && styles.imageInactive]}
          contentFit="cover"
          placeholder={blurhash}
          transition={300}
          placeholderIcon="image-outline"
        />

        {badgeText && (
          <View style={styles.inactiveBadge}>
            <Text style={styles.inactiveBadgeText}>{badgeText}</Text>
          </View>
        )}

        <View style={styles.cardContent}>
          {shouldShowInfoButton() ? (
            <View style={styles.cardHeader}>
              <Title style={[styles.cardTitle, { flex: 1 }]}>{item.name}</Title>
              <IconButton
                icon="information-outline"
                size={20}
                onPress={onInfoPress}
                style={styles.infoButton}
              />
            </View>
          ) : (
            <Title style={styles.cardTitle}>{item.name}</Title>
          )}

          {shouldShowPrice() && (
            <Text style={styles.priceText}>
              ${Number((item as Product).price).toFixed(2)}
            </Text>
          )}
        </View>
      </Card>
    );
  },
);

MenuItemCard.displayName = 'MenuItemCard';

export default MenuItemCard;
