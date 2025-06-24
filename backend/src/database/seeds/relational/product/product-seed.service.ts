import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryEntity } from '../../../../categories/infrastructure/persistence/relational/entities/category.entity';
import { SubcategoryEntity } from '../../../../subcategories/infrastructure/persistence/relational/entities/subcategory.entity';
import { ProductEntity } from '../../../../products/infrastructure/persistence/relational/entities/product.entity';
import { ProductVariantEntity } from '../../../../product-variants/infrastructure/persistence/relational/entities/product-variant.entity';
import { ModifierGroupEntity } from '../../../../modifier-groups/infrastructure/persistence/relational/entities/modifier-group.entity';
import { ProductModifierEntity } from '../../../../product-modifiers/infrastructure/persistence/relational/entities/product-modifier.entity';
import { PizzaCustomizationEntity } from '../../../../pizza-customizations/infrastructure/persistence/relational/entities/pizza-customization.entity';
import { PizzaConfigurationEntity } from '../../../../pizza-configurations/infrastructure/persistence/relational/entities/pizza-configuration.entity';
import { CustomizationType } from '../../../../pizza-customizations/domain/enums/customization-type.enum';

@Injectable()
export class ProductSeedService {
  constructor(
    @InjectRepository(CategoryEntity)
    private categoryRepository: Repository<CategoryEntity>,
    @InjectRepository(SubcategoryEntity)
    private subcategoryRepository: Repository<SubcategoryEntity>,
    @InjectRepository(ProductEntity)
    private productRepository: Repository<ProductEntity>,
    @InjectRepository(ProductVariantEntity)
    private variantRepository: Repository<ProductVariantEntity>,
    @InjectRepository(ModifierGroupEntity)
    private modifierGroupRepository: Repository<ModifierGroupEntity>,
    @InjectRepository(ProductModifierEntity)
    private modifierRepository: Repository<ProductModifierEntity>,
    @InjectRepository(PizzaCustomizationEntity)
    private pizzaCustomizationRepository: Repository<PizzaCustomizationEntity>,
    @InjectRepository(PizzaConfigurationEntity)
    private pizzaConfigurationRepository: Repository<PizzaConfigurationEntity>,
  ) {}

  async run() {
    const countCategories = await this.categoryRepository.count();

    if (!countCategories) {
      // Aquí iremos agregando el código paso a paso
      await this.seedCategories();
    }
  }

  private async seedCategories() {
    // Datos de categorías y subcategorías
    const categoriesData = [
      {
        id: 'COM',
        name: 'Comida',
        description: 'Platos principales y entradas',
        sortOrder: 1,
        subcategories: [
          {
            id: 'COM-S1',
            name: 'Entradas',
            description: 'Alitas, papas y más',
            sortOrder: 1,
          },
          {
            id: 'COM-S2',
            name: 'Pizzas',
            description: 'Pizzas artesanales',
            sortOrder: 2,
          },
          {
            id: 'COM-S3',
            name: 'Hamburguesas',
            description: 'Hamburguesas gourmet',
            sortOrder: 3,
          },
          {
            id: 'COM-S4',
            name: 'Ensaladas',
            description: 'Ensaladas frescas',
            sortOrder: 4,
          },
        ],
      },
      {
        id: 'BEB',
        name: 'Bebida',
        description: 'Bebidas y coctelería',
        sortOrder: 2,
        subcategories: [
          {
            id: 'BEB-S1',
            name: 'Frappes y Postres',
            description: 'Bebidas frías y postres',
            sortOrder: 1,
          },
          {
            id: 'BEB-S2',
            name: 'Jarras',
            description: 'Bebidas para compartir',
            sortOrder: 2,
          },
          {
            id: 'BEB-S3',
            name: 'Cocteleria',
            description: 'Cocteles y bebidas con alcohol',
            sortOrder: 3,
          },
          {
            id: 'BEB-S4',
            name: 'Bebidas',
            description: 'Aguas frescas y bebidas naturales',
            sortOrder: 4,
          },
          {
            id: 'BEB-S5',
            name: 'Cafe Caliente',
            description: 'Café y bebidas calientes',
            sortOrder: 5,
          },
          {
            id: 'BEB-S6',
            name: 'Refrescos',
            description: 'Refrescos embotellados',
            sortOrder: 6,
          },
        ],
      },
    ];

    // Crear categorías y subcategorías
    for (const categoryData of categoriesData) {
      const { subcategories, ...categoryInfo } = categoryData;

      // Crear categoría
      const category = await this.categoryRepository.save(
        this.categoryRepository.create({
          ...categoryInfo,
          isActive: true,
        }),
      );

      // Crear subcategorías
      for (const subcategoryData of subcategories) {
        await this.subcategoryRepository.save(
          this.subcategoryRepository.create({
            ...subcategoryData,
            category: category,
            isActive: true,
          }),
        );
      }
    }

    // Después de crear categorías, crear productos
    await this.seedProducts();
  }

  private async seedProducts() {
    // Primero crear las customizaciones de pizza
    await this.seedPizzaCustomizations();

    // Luego crear los productos
    await this.seedBeverageProducts();
    await this.seedFoodProducts();
  }

  private async seedPizzaCustomizations() {
    const pizzaCustomizations = [
      // Sabores de pizza (FLAVOR)
      {
        id: 'PZ-I-1',
        name: 'Adelita',
        type: CustomizationType.FLAVOR,
        ingredients: 'Salsa de tomate, queso, jamón, champiñones',
        toppingValue: 4,
        sortOrder: 1,
      },
      {
        id: 'PZ-I-2',
        name: 'Carnes Frias',
        type: CustomizationType.FLAVOR,
        ingredients: 'Salsa de tomate, queso, jamón, salami, pepperoni',
        toppingValue: 4,
        sortOrder: 2,
      },
      {
        id: 'PZ-I-3',
        name: 'Carranza',
        type: CustomizationType.FLAVOR,
        ingredients: 'Salsa de tomate, queso, pollo, cebolla, chile morrón',
        toppingValue: 4,
        sortOrder: 3,
      },
      {
        id: 'PZ-I-4',
        name: 'Especial',
        type: CustomizationType.FLAVOR,
        ingredients: 'Salsa de tomate, queso, jamón, champiñones, chile morrón',
        toppingValue: 4,
        sortOrder: 4,
      },
      {
        id: 'PZ-I-5',
        name: 'Hawaiana',
        type: CustomizationType.FLAVOR,
        ingredients: 'Salsa de tomate, queso, jamón, piña',
        toppingValue: 3,
        sortOrder: 5,
      },
      // Ingredientes individuales (INGREDIENT)
      {
        id: 'PZ-I-18',
        name: 'Albahaca',
        type: CustomizationType.INGREDIENT,
        ingredients: null,
        toppingValue: 1,
        sortOrder: 18,
      },
      {
        id: 'PZ-I-19',
        name: 'Arándano',
        type: CustomizationType.INGREDIENT,
        ingredients: null,
        toppingValue: 1,
        sortOrder: 19,
      },
      {
        id: 'PZ-I-20',
        name: 'Calabaza',
        type: CustomizationType.INGREDIENT,
        ingredients: null,
        toppingValue: 1,
        sortOrder: 20,
      },
      {
        id: 'PZ-I-21',
        name: 'Cebolla',
        type: CustomizationType.INGREDIENT,
        ingredients: null,
        toppingValue: 1,
        sortOrder: 21,
      },
      {
        id: 'PZ-I-22',
        name: 'Champiñón',
        type: CustomizationType.INGREDIENT,
        ingredients: null,
        toppingValue: 1,
        sortOrder: 22,
      },
    ];

    for (const customization of pizzaCustomizations) {
      await this.pizzaCustomizationRepository.save(
        this.pizzaCustomizationRepository.create({
          ...customization,
          isActive: true,
        }),
      );
    }
  }

  private async seedBeverageProducts() {
    // Productos de bebidas simples (sin variantes)
    const simpleBeverages = [
      // Aguas frescas
      {
        id: 'AH',
        name: 'Agua fresca de horchata',
        description: 'Refrescante agua de horchata natural',
        price: 35,
        subcategoryId: 'BEB-S4',
        sortOrder: 1,
      },
      {
        id: 'LIM',
        name: 'Limonada',
        description: 'Limonada natural recién preparada',
        price: 35,
        subcategoryId: 'BEB-S4',
        sortOrder: 2,
      },
      {
        id: 'LIMM',
        name: 'Limonada Mineral',
        description: 'Limonada con agua mineral',
        price: 35,
        subcategoryId: 'BEB-S4',
        sortOrder: 3,
      },
      {
        id: 'SANP',
        name: 'Sangria Preparada',
        description: 'Sangría sin alcohol con frutas naturales',
        price: 35,
        subcategoryId: 'BEB-S4',
        sortOrder: 4,
      },
      // Refrescos
      {
        id: 'CC',
        name: 'Coca Cola',
        description: 'Refresco Coca Cola 355ml',
        price: 30,
        subcategoryId: 'BEB-S6',
        sortOrder: 1,
      },
      {
        id: 'SAN',
        name: 'Sangria',
        description: 'Refresco Sangría Señorial',
        price: 30,
        subcategoryId: 'BEB-S6',
        sortOrder: 2,
      },
      {
        id: 'SQU',
        name: 'Squirt',
        description: 'Refresco Squirt toronja',
        price: 30,
        subcategoryId: 'BEB-S6',
        sortOrder: 3,
      },
      // Café caliente
      {
        id: 'CA',
        name: 'Cafe Americano',
        description: 'Café americano recién preparado',
        price: 45,
        subcategoryId: 'BEB-S5',
        sortOrder: 1,
      },
      {
        id: 'CP',
        name: 'Capuchino',
        description: 'Capuchino con espuma de leche',
        price: 45,
        subcategoryId: 'BEB-S5',
        sortOrder: 2,
      },
      {
        id: 'CH',
        name: 'Chocolate',
        description: 'Chocolate caliente cremoso',
        price: 50,
        subcategoryId: 'BEB-S5',
        sortOrder: 3,
      },
    ];

    for (const beverage of simpleBeverages) {
      const subcategory = await this.subcategoryRepository.findOne({
        where: { id: beverage.subcategoryId },
      });

      if (subcategory) {
        await this.productRepository.save(
          this.productRepository.create({
            id: beverage.id,
            name: beverage.name,
            description: beverage.description,
            price: beverage.price,
            hasVariants: false,
            isActive: true,
            isPizza: false,
            sortOrder: beverage.sortOrder,
            subcategory: subcategory,
            estimatedPrepTime: 5,
          }),
        );
      }
    }

    // Productos con variantes
    await this.seedBeveragesWithVariants();
  }

  private async seedBeveragesWithVariants() {
    // Micheladas
    const micheladaSubcategory = await this.subcategoryRepository.findOne({
      where: { id: 'BEB-S4' },
    });
    if (micheladaSubcategory) {
      const michelada = await this.productRepository.save(
        this.productRepository.create({
          id: 'MC',
          name: 'Michelada',
          description: 'Michelada preparada con nuestra receta especial',
          hasVariants: true,
          isActive: true,
          isPizza: false,
          sortOrder: 5,
          subcategory: micheladaSubcategory,
          estimatedPrepTime: 5,
        }),
      );

      // Crear variantes de michelada
      const micheladaVariants = [
        { id: 'MCV1', name: 'Michelada clara', price: 80, sortOrder: 1 },
        { id: 'MCV2', name: 'Michelada oscura', price: 80, sortOrder: 2 },
      ];

      for (const variant of micheladaVariants) {
        await this.variantRepository.save(
          this.variantRepository.create({
            ...variant,
            product: michelada,
            isActive: true,
          }),
        );
      }
    }

    // Frappes
    const frappeSubcategory = await this.subcategoryRepository.findOne({
      where: { id: 'BEB-S1' },
    });
    if (frappeSubcategory) {
      const frappe = await this.productRepository.save(
        this.productRepository.create({
          id: 'F',
          name: 'Frappe',
          description: 'Frappes preparados con ingredientes premium',
          hasVariants: true,
          isActive: true,
          isPizza: false,
          sortOrder: 1,
          subcategory: frappeSubcategory,
          estimatedPrepTime: 10,
        }),
      );

      // Crear variantes de frappe
      const frappeVariants = [
        { id: 'FV1', name: 'Frappe Capuchino', price: 70, sortOrder: 1 },
        { id: 'FV2', name: 'Frappe Coco', price: 70, sortOrder: 2 },
        { id: 'FV3', name: 'Frappe Caramelo', price: 70, sortOrder: 3 },
        { id: 'FV4', name: 'Frappe Cajeta', price: 70, sortOrder: 4 },
        { id: 'FV5', name: 'Frappe Mocaccino', price: 70, sortOrder: 5 },
      ];

      for (const variant of frappeVariants) {
        await this.variantRepository.save(
          this.variantRepository.create({
            ...variant,
            product: frappe,
            isActive: true,
          }),
        );
      }
    }
  }

  private async seedFoodProducts() {
    // Hamburguesas con modificadores
    await this.seedHamburgers();

    // Otros productos de comida
    await this.seedOtherFoodProducts();
  }

  private async seedHamburgers() {
    const hamburguesaSubcategory = await this.subcategoryRepository.findOne({
      where: { id: 'COM-S3' },
    });

    if (hamburguesaSubcategory) {
      // Crear producto de hamburguesa
      const hamburguesa = await this.productRepository.save(
        this.productRepository.create({
          id: 'H',
          name: 'Hamburguesa',
          description: 'Hamburguesas artesanales con carne de res premium',
          hasVariants: true,
          isActive: true,
          isPizza: false,
          sortOrder: 1,
          subcategory: hamburguesaSubcategory,
          estimatedPrepTime: 15,
        }),
      );

      // Crear variantes de hamburguesa
      const hamburguesaVariants = [
        { id: 'HV1', name: 'Hamburguesa Tradicional', price: 85, sortOrder: 1 },
        { id: 'HV2', name: 'Hamburguesa Especial', price: 95, sortOrder: 2 },
        { id: 'HV3', name: 'Hamburguesa Hawaiana', price: 95, sortOrder: 3 },
        { id: 'HV4', name: 'Hamburguesa Pollo', price: 100, sortOrder: 4 },
        { id: 'HV5', name: 'Hamburguesa BBQ', price: 100, sortOrder: 5 },
        { id: 'HV6', name: 'Hamburguesa Leñazo', price: 110, sortOrder: 6 },
        { id: 'HV7', name: 'Hamburguesa Cubana', price: 100, sortOrder: 7 },
      ];

      for (const variant of hamburguesaVariants) {
        await this.variantRepository.save(
          this.variantRepository.create({
            ...variant,
            product: hamburguesa,
            isActive: true,
          }),
        );
      }

      // Crear grupos de modificadores para hamburguesas
      await this.createHamburgerModifiers(hamburguesa);
    }
  }

  private async createHamburgerModifiers(hamburguesa: ProductEntity) {
    // Grupo 1: Hamburguesa con papas
    const papasGroup = await this.modifierGroupRepository.save(
      this.modifierGroupRepository.create({
        id: 'HM1',
        name: 'Hamburguesa con papas',
        isRequired: false,
        allowMultipleSelections: false,
        maxSelections: 1,
        isActive: true,
        sortOrder: 1,
      }),
    );

    const papasModifiers = [
      { id: 'HM1-1', name: 'Con papas francesa', price: 10, sortOrder: 1 },
      { id: 'HM1-2', name: 'Con papas gajo', price: 15, sortOrder: 2 },
      { id: 'HM1-3', name: 'Con papas mixtas', price: 15, sortOrder: 3 },
      {
        id: 'HM1-4',
        name: 'Con papas francesa gratinadas',
        price: 15,
        sortOrder: 4,
      },
      {
        id: 'HM1-5',
        name: 'Con papas gajo gratinadas',
        price: 20,
        sortOrder: 5,
      },
      {
        id: 'HM1-6',
        name: 'Con papas mixtas gratinadas',
        price: 20,
        sortOrder: 6,
      },
    ];

    for (const modifier of papasModifiers) {
      await this.modifierRepository.save(
        this.modifierRepository.create({
          ...modifier,
          modifierGroup: papasGroup,
          isActive: true,
          isDefault: false,
        }),
      );
    }

    // Grupo 2: Hamburguesa extras
    const extrasGroup = await this.modifierGroupRepository.save(
      this.modifierGroupRepository.create({
        id: 'HM2',
        name: 'Hamburguesa extras',
        isRequired: false,
        allowMultipleSelections: true,
        maxSelections: 5,
        isActive: true,
        sortOrder: 2,
      }),
    );

    const extrasModifiers = [
      { id: 'HM2-1', name: 'Partida', price: 0, sortOrder: 1 },
      { id: 'HM2-2', name: 'Doble carne', price: 15, sortOrder: 2 },
      { id: 'HM2-3', name: 'Doble pollo', price: 20, sortOrder: 3 },
      { id: 'HM2-4', name: 'Piña', price: 5, sortOrder: 4 },
      {
        id: 'HM2-5',
        name: 'Pollo en lugar de carne de res',
        price: 15,
        sortOrder: 5,
      },
    ];

    for (const modifier of extrasModifiers) {
      await this.modifierRepository.save(
        this.modifierRepository.create({
          ...modifier,
          modifierGroup: extrasGroup,
          isActive: true,
          isDefault: false,
        }),
      );
    }

    // Asociar grupos de modificadores con el producto
    hamburguesa.modifierGroups = [papasGroup, extrasGroup];
    await this.productRepository.save(hamburguesa);
  }

  private async seedOtherFoodProducts() {
    // Pizzas
    await this.seedPizzas();

    // Dedos de queso
    const hamburguesaSubcategory = await this.subcategoryRepository.findOne({
      where: { id: 'COM-S3' },
    });
    if (hamburguesaSubcategory) {
      await this.productRepository.save(
        this.productRepository.create({
          id: 'DQ',
          name: 'Dedos de queso',
          description: 'Dedos de queso mozzarella empanizados',
          price: 90,
          hasVariants: false,
          isActive: true,
          isPizza: false,
          sortOrder: 2,
          subcategory: hamburguesaSubcategory,
          estimatedPrepTime: 8,
        }),
      );
    }
  }

  private async seedPizzas() {
    const pizzaSubcategory = await this.subcategoryRepository.findOne({
      where: { id: 'COM-S2' },
    });

    if (pizzaSubcategory) {
      // Crear producto de pizza
      const pizza = await this.productRepository.save(
        this.productRepository.create({
          id: 'PZ',
          name: 'Pizza',
          description: 'Pizzas artesanales horneadas en horno de leña',
          hasVariants: true,
          isActive: true,
          isPizza: true,
          sortOrder: 1,
          subcategory: pizzaSubcategory,
          estimatedPrepTime: 20,
        }),
      );

      // Crear variantes de pizza
      const pizzaVariants = [
        { id: 'PZ-V-1', name: 'Pizza Grande', price: 240, sortOrder: 1 },
        { id: 'PZ-V-2', name: 'Pizza Mediana', price: 190, sortOrder: 2 },
        { id: 'PZ-V-3', name: 'Pizza Chica', price: 140, sortOrder: 3 },
        {
          id: 'PZ-V-4',
          name: 'Pizza Grande Con Orilla Rellena de Queso',
          price: 270,
          sortOrder: 4,
        },
        {
          id: 'PZ-V-5',
          name: 'Pizza Mediana Con Orilla Rellena de Queso',
          price: 220,
          sortOrder: 5,
        },
        {
          id: 'PZ-V-6',
          name: 'Pizza Chica Con Orilla Rellena de Queso',
          price: 160,
          sortOrder: 6,
        },
      ];

      for (const variant of pizzaVariants) {
        await this.variantRepository.save(
          this.variantRepository.create({
            ...variant,
            product: pizza,
            isActive: true,
          }),
        );
      }

      // Crear configuración de pizza
      await this.pizzaConfigurationRepository.save(
        this.pizzaConfigurationRepository.create({
          product: pizza,
          includedToppings: 4,
          extraToppingCost: 20,
        }),
      );

      // Asociar pizza customizations con el producto pizza
      const pizzaCustomizations =
        await this.pizzaCustomizationRepository.find();
      pizza.pizzaCustomizations = pizzaCustomizations;
      await this.productRepository.save(pizza);

      // Crear grupo de modificadores para pizza
      await this.createPizzaModifiers(pizza);
    }
  }

  private async createPizzaModifiers(pizza: ProductEntity) {
    // Grupo de observaciones para pizza
    const observacionesGroup = await this.modifierGroupRepository.save(
      this.modifierGroupRepository.create({
        id: 'PZ-M1',
        name: 'Observaciones de Pizza',
        isRequired: false,
        allowMultipleSelections: true,
        maxSelections: 6,
        isActive: true,
        sortOrder: 1,
      }),
    );

    const observacionesModifiers = [
      { id: 'PZ-M1-1', name: 'Con catsup', price: 0, sortOrder: 1 },
      { id: 'PZ-M1-2', name: 'Extra aderezo', price: 0, sortOrder: 2 },
      { id: 'PZ-M1-3', name: 'Extra chile de aceite', price: 0, sortOrder: 3 },
      { id: 'PZ-M1-4', name: 'Extra dorada', price: 0, sortOrder: 4 },
      { id: 'PZ-M1-5', name: 'Menos dorada', price: 0, sortOrder: 5 },
      { id: 'PZ-M1-6', name: 'Sin salsa', price: 0, sortOrder: 6 },
    ];

    for (const modifier of observacionesModifiers) {
      await this.modifierRepository.save(
        this.modifierRepository.create({
          ...modifier,
          modifierGroup: observacionesGroup,
          isActive: true,
          isDefault: false,
        }),
      );
    }

    // Asociar grupo de modificadores con el producto
    pizza.modifierGroups = [observacionesGroup];
    await this.productRepository.save(pizza);
  }
}
