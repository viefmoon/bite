import { useMemo } from 'react';
import type { FullMenuProduct as Product } from '../schema/orders.schema';
import type { CartItemModifier } from '../utils/cartUtils';

interface UseProductPricingProps {
  product: Product;
  selectedVariantId?: string;
  selectedModifiers: CartItemModifier[];
  pizzaExtraCost: number;
  quantity: number;
}

export const useProductPricing = ({
  product,
  selectedVariantId,
  selectedModifiers,
  pizzaExtraCost,
  quantity,
}: UseProductPricingProps) => {
  // Determinar si el producto tiene variantes
  const hasVariants = useMemo(
    () =>
      product?.variants &&
      Array.isArray(product.variants) &&
      product.variants.length > 0,
    [product?.variants],
  );

  // Obtener variante seleccionada
  const selectedVariant = useMemo(
    () =>
      hasVariants && product && product.variants
        ? product.variants.find((variant) => variant.id === selectedVariantId)
        : undefined,
    [hasVariants, product, selectedVariantId],
  );

  // Calcular precio base
  const basePrice = useMemo(() => {
    return selectedVariant ? selectedVariant.price : product?.price || 0;
  }, [selectedVariant, product?.price]);

  // Calcular precio de modificadores
  const modifiersPrice = useMemo(() => {
    return selectedModifiers.reduce((sum, mod) => sum + (mod.price || 0), 0);
  }, [selectedModifiers]);

  // Calcular precio total
  const totalPrice = useMemo(() => {
    return (basePrice + modifiersPrice + pizzaExtraCost) * quantity;
  }, [basePrice, modifiersPrice, pizzaExtraCost, quantity]);

  return {
    hasVariants,
    selectedVariant,
    basePrice,
    modifiersPrice,
    totalPrice,
  };
};
