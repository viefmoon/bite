import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Title, Text, IconButton } from 'react-native-paper';
import { AutoImage } from '@/app/components/common/AutoImage';
import { useAppTheme } from '@/app/styles/theme';
import { useResponsive } from '@/app/hooks/useResponsive';
import { DEFAULT_IMAGE_BLURHASH } from '@/app/constants/ui';
import type { Product, Category, SubCategory } from '../schema/orders.schema';

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
    const { colors } = theme;
    const responsive = useResponsive();

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
            paddingHorizontal: responsive.spacingPreset.s,
            paddingVertical: responsive.spacingPreset.xs,
          },
          cardTitle: {
            fontSize: responsive.fontSizePreset.m,
            fontWeight: '600',
            lineHeight: responsive.fontSizePreset.m * 1.2,
            marginBottom: responsive.spacingPreset.xs,
          },
          cardHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          },
          cardHeaderTitle: {
            flex: 1,
          },
          infoButton: {
            margin: -4,
            marginTop: -6,
            marginRight: -6,
          },
          priceText: {
            color: theme.colors.primary,
            fontWeight: '600',
            fontSize: responsive.fontSizePreset.s,
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
          warningMessage: {
            backgroundColor: colors.warningContainer || colors.errorContainer,
            paddingHorizontal: responsive.spacingPreset.s,
            paddingVertical: responsive.spacingPreset.xs,
            marginTop: responsive.spacingPreset.xs,
          },
          warningMessageText: {
            fontSize: responsive.fontSizePreset.xs,
            color: colors.onWarningContainer || colors.onErrorContainer,
            textAlign: 'center',
            lineHeight: responsive.fontSizePreset.xs * 1.3,
          },
        }),
      [colors, theme, responsive],
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
        (item as Product).description?.trim() !== '' &&
        onInfoPress
      );
    };

    // Obtener el texto del badge
    const getBadgeText = () => {
      if (!isActive) return 'INACTIVO';
      if (isProductWithoutScreen) return 'NO DISPONIBLE';
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
          placeholder={DEFAULT_IMAGE_BLURHASH}
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
              <Title style={[styles.cardTitle, styles.cardHeaderTitle]}>
                {item.name}
              </Title>
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
              ${(item as Product).price?.toFixed(2) || '0.00'}
            </Text>
          )}

          {isProductWithoutScreen && (
            <View style={styles.warningMessage}>
              <Text style={styles.warningMessageText}>
                Sin pantalla de preparación
              </Text>
            </View>
          )}
        </View>
      </Card>
    );
  },
);

MenuItemCard.displayName = 'MenuItemCard';

export default MenuItemCard;
