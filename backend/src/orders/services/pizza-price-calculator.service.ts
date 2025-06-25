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

    // 1. Calcular precio base
    let basePrice = 0;

    if (productVariant) {
      // REGLA: Si hay variante, usar precio de variante
      basePrice = Number(productVariant.price);
    } else if (product.hasVariants) {
      // REGLA: No se puede crear OrderItem sin variante si el producto tiene variantes
      throw new Error('Producto con variantes requiere selección de variante');
    } else {
      // REGLA: Si no hay variantes, usar precio del producto
      basePrice = Number(product.price) || 0;
    }

    // 2. Sumar modificadores (aplica a todos los productos)
    const modifiersPrice = productModifiers.reduce(
      (sum, modifier) => sum + (Number(modifier.price) || 0),
      0,
    );

    let finalPrice = basePrice + modifiersPrice;

    // 3. Si es pizza, calcular ingredientes adicionales
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

    // REGLA: Solo contar customizaciones con action = ADD
    const addedCustomizations = selectedCustomizations.filter(
      (c) => c.action === CustomizationAction.ADD,
    );

    for (const selected of addedCustomizations) {
      // Buscar la customización en las disponibles
      const customization = availableCustomizations.find(
        (c) => c.id === selected.pizzaCustomizationId,
      );

      if (!customization) {
        continue; // Ignorar si no se encuentra la customización
      }

      if (selected.half === PizzaHalf.FULL) {
        // REGLA: Pizza completa suma el toppingValue completo
        totalToppingValue += customization.toppingValue;
      } else {
        // REGLA: Media pizza suma la mitad del toppingValue
        totalToppingValue += customization.toppingValue / 2;
      }
    }

    // REGLA: Solo cobrar por toppings que excedan los incluidos
    if (totalToppingValue > config.includedToppings) {
      const extraToppings = totalToppingValue - config.includedToppings;
      return extraToppings * Number(config.extraToppingCost);
    }

    return 0;
  }

  /**
   * Ejemplo de cálculo:
   * Pizza Grande Hawaiana ($200) + Pepperoni extra en mitad ($10)
   * - Precio base (variante grande): $200
   * - Modificadores: $0
   * - Hawaiana FLAVOR (toppingValue: 3): incluido en precio base
   * - Pepperoni HALF_1 (toppingValue: 1): 0.5 valor = 0.5
   * - Total toppingValue: 3.5
   * - Incluidos: 4 (no hay cargo extra)
   * - Precio final: $200
   *
   * Ejemplo 2:
   * Pizza Mediana 4 Quesos ($150) + 3 ingredientes extra completos
   * - Precio base (variante mediana): $150
   * - 4 Quesos FLAVOR (toppingValue: 4): incluido
   * - 3 ingredientes extra (toppingValue: 1 cada uno): 3
   * - Total toppingValue: 7
   * - Incluidos: 4
   * - Extra: 3 x $20 = $60
   * - Precio final: $210
   */
}
