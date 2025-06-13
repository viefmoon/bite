import { PizzaIngredient } from '../../../../domain/pizza-ingredient';
import { PizzaIngredientEntity } from '../entities/pizza-ingredient.entity';

export class PizzaIngredientMapper {
  static toDomain(raw: PizzaIngredientEntity): PizzaIngredient {
    const domainEntity = new PizzaIngredient();
    domainEntity.id = raw.id;
    domainEntity.name = raw.name;
    domainEntity.ingredientValue = raw.ingredientValue;
    domainEntity.ingredients = raw.ingredients;
    domainEntity.isActive = raw.isActive;
    domainEntity.sortOrder = raw.sortOrder;
    // Mapear los productos relacionados si están cargados
    if (raw.products) {
      domainEntity.productIds = raw.products.map((product) => product.id);
    }
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: PizzaIngredient): PizzaIngredientEntity {
    const persistenceEntity = new PizzaIngredientEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.name = domainEntity.name;
    persistenceEntity.ingredientValue = domainEntity.ingredientValue;
    persistenceEntity.ingredients = domainEntity.ingredients ?? null;
    persistenceEntity.isActive = domainEntity.isActive;
    persistenceEntity.sortOrder = domainEntity.sortOrder;
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;
    persistenceEntity.deletedAt = domainEntity.deletedAt ?? null;
    // Nota: La relación con productos se maneja por separado

    return persistenceEntity;
  }
}
