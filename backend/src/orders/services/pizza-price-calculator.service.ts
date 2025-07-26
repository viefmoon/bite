import { Injectable } from '@nestjs/common';
import { Product } from '../../products/domain/product';
import { ProductVariant } from '../../product-variants/domain/product-variant';
import { ProductModifier } from '../../product-modifiers/domain/product-modifier';
import { SelectedPizzaCustomization } from '../../selected-pizza-customizations/domain/selected-pizza-customization';
import { PizzaConfiguration } from '../../pizza-configurations/domain/pizza-configuration';
import { PizzaCustomization } from '../../pizza-customizations/domain/pizza-customization';
import { CustomizationAction } from '../../selected-pizza-customizations/domain/enums/customization-action.enum';
import { PizzaHalf } from '../../selected-pizza-customizations/domain/enums/pizza-half.enum';

@Injectable()
export class PizzaPriceCalculatorService {
  calculateOrderItemPrice(params: {
    product: Product;
    productVariant?: ProductVariant | null;
    productModifiers: ProductModifier[];
    selectedPizzaCustomizations?: SelectedPizzaCustomization[];
  }): { basePrice: number; finalPrice: number } {
    const {
      product,
      productVariant,
      productModifiers,
      selectedPizzaCustomizations,
    } = params;

    let basePrice = 0;

    if (productVariant) {
      basePrice = Number(productVariant.price);
    } else if (product.hasVariants) {
      throw new Error('Producto con variantes requiere selección de variante');
    } else {
      basePrice = Number(product.price) || 0;
    }

    const modifiersPrice = productModifiers.reduce(
      (sum, modifier) => sum + (Number(modifier.price) || 0),
      0,
    );

    let finalPrice = basePrice + modifiersPrice;

    if (
      product.isPizza &&
      product.pizzaConfiguration &&
      selectedPizzaCustomizations
    ) {
      const pizzaExtraCost = this.calculatePizzaExtraCost(
        product.pizzaConfiguration,
        selectedPizzaCustomizations,
        product.pizzaCustomizations || [],
      );
      finalPrice += pizzaExtraCost;
    }

    return { basePrice, finalPrice };
  }

  private calculatePizzaExtraCost(
    config: PizzaConfiguration,
    selectedCustomizations: SelectedPizzaCustomization[],
    availableCustomizations: PizzaCustomization[],
  ): number {
    let totalToppingValue = 0;

    const addedCustomizations = selectedCustomizations.filter(
      (c) => c.action === CustomizationAction.ADD,
    );

    for (const selected of addedCustomizations) {
      const customization = availableCustomizations.find(
        (c) => c.id === selected.pizzaCustomizationId,
      );

      if (!customization) {
        continue;
      }

      if (selected.half === PizzaHalf.FULL) {
        totalToppingValue += customization.toppingValue;
      } else {
        totalToppingValue += customization.toppingValue / 2;
      }
    }

    if (totalToppingValue > config.includedToppings) {
      const extraToppings = totalToppingValue - config.includedToppings;
      return extraToppings * Number(config.extraToppingCost);
    }

    return 0;
  }
}
