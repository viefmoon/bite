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
import { PreparationScreenEntity } from '../../../../preparation-screens/infrastructure/persistence/relational/entities/preparation-screen.entity';
import {
  CustomIdService,
  EntityPrefix,
} from '../../../../common/services/custom-id.service';

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
    @InjectRepository(PreparationScreenEntity)
    private preparationScreenRepository: Repository<PreparationScreenEntity>,
    private customIdService: CustomIdService,
  ) {}

  async run() {
    const countCategories = await this.categoryRepository.count();
    const countProducts = await this.productRepository.count();

    if (!countCategories) {
      // Primero crear categorías y subcategorías
      await this.seedCategories();
    }

    if (!countProducts) {
      // Crear productos si no existen
      await this.seedProducts();
    }
  }

  private async seedCategories() {
    // Datos de categorías y subcategorías
    const categoriesData = [
      {
        id: 'CAT-1',
        name: 'Comida',
        description: 'Platos principales y entradas',
        sortOrder: 1,
        subcategories: [
          {
            id: 'SUB-1',
            name: 'Entradas',
            description: 'Alitas, papas y más',
            sortOrder: 1,
          },
          {
            id: 'SUB-2',
            name: 'Pizzas',
            description: 'Pizzas artesanales',
            sortOrder: 2,
          },
          {
            id: 'SUB-3',
            name: 'Hamburguesas',
            description: 'Hamburguesas gourmet',
            sortOrder: 3,
          },
          {
            id: 'SUB-4',
            name: 'Ensaladas',
            description: 'Ensaladas frescas',
            sortOrder: 4,
          },
        ],
      },
      {
        id: 'CAT-2',
        name: 'Bebida',
        description: 'Bebidas y coctelería',
        sortOrder: 2,
        subcategories: [
          {
            id: 'SUB-5',
            name: 'Frappes y Postres',
            description: 'Bebidas frías y postres',
            sortOrder: 1,
          },
          {
            id: 'SUB-6',
            name: 'Jarras',
            description: 'Bebidas para compartir',
            sortOrder: 2,
          },
          {
            id: 'SUB-7',
            name: 'Cocteleria',
            description: 'Cocteles y bebidas con alcohol',
            sortOrder: 3,
          },
          {
            id: 'SUB-8',
            name: 'Bebidas',
            description: 'Aguas frescas y bebidas naturales',
            sortOrder: 4,
          },
          {
            id: 'SUB-9',
            name: 'Cafe Caliente',
            description: 'Café y bebidas calientes',
            sortOrder: 5,
          },
          {
            id: 'SUB-10',
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
        name: 'Adelita',
        type: CustomizationType.FLAVOR,
        ingredients: 'Jamon, Piña, Arandano',
        toppingValue: 4,
        sortOrder: 1,
      },
      {
        name: 'Carnes Frias',
        type: CustomizationType.FLAVOR,
        ingredients: 'Jamon, Salami, Peperoni',
        toppingValue: 4,
        sortOrder: 2,
      },
      {
        name: 'Carranza',
        type: CustomizationType.FLAVOR,
        ingredients: 'Cebolla, Chile Morron, Pollo BBQ',
        toppingValue: 4,
        sortOrder: 3,
      },
      {
        name: 'Especial',
        type: CustomizationType.FLAVOR,
        ingredients: 'Jamon, Champiñon, Chile Morron',
        toppingValue: 4,
        sortOrder: 4,
      },
      {
        name: 'Hawaiana',
        type: CustomizationType.FLAVOR,
        ingredients: 'Jamon, Piña',
        toppingValue: 3,
        sortOrder: 5,
      },
      {
        name: 'Kahlo',
        type: CustomizationType.FLAVOR,
        ingredients: 'Calabaza, Elote, Champiñon, Jitomate',
        toppingValue: 4,
        sortOrder: 6,
      },
      {
        name: 'La Leña',
        type: CustomizationType.FLAVOR,
        ingredients: 'Tocino, Pierna, Chorizo, Molida',
        toppingValue: 6,
        sortOrder: 7,
      },
      {
        name: 'La Maria',
        type: CustomizationType.FLAVOR,
        ingredients: 'Pollo BBQ, Piña, Chile Jalapeño',
        toppingValue: 6,
        sortOrder: 8,
      },
      {
        name: 'Lupita',
        type: CustomizationType.FLAVOR,
        ingredients: 'Molida, Tocino, Cebolla, Chile Morron',
        toppingValue: 4,
        sortOrder: 9,
      },
      {
        name: 'Malinche',
        type: CustomizationType.FLAVOR,
        ingredients: 'Queso de cabra, Champiñon, Jamon, Chile Seco, Albahaca',
        toppingValue: 6,
        sortOrder: 10,
      },
      {
        name: 'Margarita',
        type: CustomizationType.FLAVOR,
        ingredients: 'Jitomate, Albahaca',
        toppingValue: 4,
        sortOrder: 11,
      },
      {
        name: 'Mexicana',
        type: CustomizationType.FLAVOR,
        ingredients: 'Chorizo, Cebolla, Chile Jalapeño, Jitomate',
        toppingValue: 4,
        sortOrder: 12,
      },
      {
        name: 'Pepperoni',
        type: CustomizationType.FLAVOR,
        ingredients: 'Pepperoni',
        toppingValue: 4,
        sortOrder: 13,
      },
      {
        name: 'Rivera',
        type: CustomizationType.FLAVOR,
        ingredients: 'Elote, Champiñon, Chile Morron',
        toppingValue: 4,
        sortOrder: 14,
      },
      {
        name: 'Villa',
        type: CustomizationType.FLAVOR,
        ingredients: 'Chorizo, Tocino, Piña, Chile Jalapeño',
        toppingValue: 4,
        sortOrder: 15,
      },
      {
        name: 'Zapata',
        type: CustomizationType.FLAVOR,
        ingredients: 'Salami, Jamon, Champiñon',
        toppingValue: 4,
        sortOrder: 16,
      },
      {
        name: '3 Quesos',
        type: CustomizationType.FLAVOR,
        ingredients: '3 Quesos',
        toppingValue: 2,
        sortOrder: 17,
      },
      // Ingredientes individuales (INGREDIENT)
      {
        name: 'Albahaca',
        type: CustomizationType.INGREDIENT,
        ingredients: null,
        toppingValue: 1,
        sortOrder: 18,
      },
      {
        name: 'Arándano',
        type: CustomizationType.INGREDIENT,
        ingredients: null,
        toppingValue: 1,
        sortOrder: 19,
      },
      {
        name: 'Calabaza',
        type: CustomizationType.INGREDIENT,
        ingredients: null,
        toppingValue: 1,
        sortOrder: 20,
      },
      {
        name: 'Cebolla',
        type: CustomizationType.INGREDIENT,
        ingredients: null,
        toppingValue: 1,
        sortOrder: 21,
      },
      {
        name: 'Champiñón',
        type: CustomizationType.INGREDIENT,
        ingredients: null,
        toppingValue: 1,
        sortOrder: 22,
      },
      {
        name: 'Chile Jalapeño',
        type: CustomizationType.INGREDIENT,
        ingredients: null,
        toppingValue: 1,
        sortOrder: 23,
      },
      {
        name: 'Chile Morrón',
        type: CustomizationType.INGREDIENT,
        ingredients: null,
        toppingValue: 1,
        sortOrder: 24,
      },
      {
        name: 'Chile Seco',
        type: CustomizationType.INGREDIENT,
        ingredients: null,
        toppingValue: 1,
        sortOrder: 25,
      },
      {
        name: 'Chorizo',
        type: CustomizationType.INGREDIENT,
        ingredients: null,
        toppingValue: 1,
        sortOrder: 26,
      },
      {
        name: 'Elote',
        type: CustomizationType.INGREDIENT,
        ingredients: null,
        toppingValue: 1,
        sortOrder: 27,
      },
      {
        name: 'Jamón',
        type: CustomizationType.INGREDIENT,
        ingredients: null,
        toppingValue: 1,
        sortOrder: 28,
      },
      {
        name: 'Jitomate',
        type: CustomizationType.INGREDIENT,
        ingredients: null,
        toppingValue: 1,
        sortOrder: 29,
      },
      {
        name: 'Molida',
        type: CustomizationType.INGREDIENT,
        ingredients: null,
        toppingValue: 1,
        sortOrder: 30,
      },
      {
        name: 'Pierna',
        type: CustomizationType.INGREDIENT,
        ingredients: null,
        toppingValue: 2,
        sortOrder: 31,
      },
      {
        name: 'Piña',
        type: CustomizationType.INGREDIENT,
        ingredients: null,
        toppingValue: 1,
        sortOrder: 32,
      },
      {
        name: 'Pollo BBQ',
        type: CustomizationType.INGREDIENT,
        ingredients: null,
        toppingValue: 2,
        sortOrder: 33,
      },
      {
        name: 'Queso Extra',
        type: CustomizationType.INGREDIENT,
        ingredients: null,
        toppingValue: 1,
        sortOrder: 34,
      },
      {
        name: 'Queso de cabra',
        type: CustomizationType.INGREDIENT,
        ingredients: null,
        toppingValue: 2,
        sortOrder: 35,
      },
      {
        name: 'Salami',
        type: CustomizationType.INGREDIENT,
        ingredients: null,
        toppingValue: 1,
        sortOrder: 36,
      },
      {
        name: 'Salchicha',
        type: CustomizationType.INGREDIENT,
        ingredients: null,
        toppingValue: 1,
        sortOrder: 37,
      },
      {
        name: 'Salsa BBQ',
        type: CustomizationType.INGREDIENT,
        ingredients: null,
        toppingValue: 0,
        sortOrder: 38,
      },
      {
        name: 'Tocino',
        type: CustomizationType.INGREDIENT,
        ingredients: null,
        toppingValue: 1,
        sortOrder: 39,
      },
      {
        name: 'Pepperoni Extra',
        type: CustomizationType.INGREDIENT,
        ingredients: null,
        toppingValue: 1,
        sortOrder: 40,
      },
      {
        name: 'Pepperoni',
        type: CustomizationType.INGREDIENT,
        ingredients: null,
        toppingValue: 1,
        sortOrder: 41,
      },
      {
        name: 'Pollo',
        type: CustomizationType.INGREDIENT,
        ingredients: null,
        toppingValue: 1,
        sortOrder: 42,
      },
    ];

    for (const customization of pizzaCustomizations) {
      const id = await this.customIdService.generateId(
        EntityPrefix.PIZZA_CUSTOMIZATION,
        'pizza_customization',
      );

      await this.pizzaCustomizationRepository.save(
        this.pizzaCustomizationRepository.create({
          id,
          ...customization,
          isActive: true,
        }),
      );
    }
  }

  private async seedBeverageProducts() {
    // Obtener las pantallas de preparación
    const preparationScreens = await this.preparationScreenRepository.find({
      where: { isActive: true },
    });

    const barScreen = preparationScreens.find(
      (screen) => screen.name === 'Bar',
    );
    const defaultScreen = preparationScreens[0]; // Usar la primera como predeterminada si no se encuentra "Bar"

    if (!defaultScreen) {
      console.error(
        'No hay pantallas de preparación disponibles. Por favor ejecuta el seeder de preparation screens primero.',
      );
      return;
    }

    const beverageScreen = barScreen || defaultScreen;

    // Productos de bebidas simples (sin variantes)
    const simpleBeverages = [
      // Aguas frescas
      {
        name: 'Agua fresca de horchata',
        description: 'Refrescante agua de horchata natural',
        price: 35,
        subcategoryId: 'SUB-8',
        sortOrder: 1,
      },
      {
        name: 'Limonada',
        description: 'Limonada natural recién preparada',
        price: 35,
        subcategoryId: 'SUB-8',
        sortOrder: 2,
      },
      {
        name: 'Limonada Mineral',
        description: 'Limonada con agua mineral',
        price: 35,
        subcategoryId: 'SUB-8',
        sortOrder: 3,
      },
      {
        name: 'Sangria Preparada',
        description: 'Sangría sin alcohol con frutas naturales',
        price: 35,
        subcategoryId: 'SUB-8',
        sortOrder: 4,
      },
      // Refrescos
      {
        name: 'Coca Cola',
        description: 'Refresco Coca Cola 355ml',
        price: 30,
        subcategoryId: 'SUB-10',
        sortOrder: 1,
      },
      {
        name: 'Sangria',
        description: 'Refresco Sangría Señorial',
        price: 30,
        subcategoryId: 'SUB-10',
        sortOrder: 2,
      },
      {
        name: 'Squirt',
        description: 'Refresco Squirt toronja',
        price: 30,
        subcategoryId: 'SUB-10',
        sortOrder: 3,
      },
      // Refrescos adicionales
      {
        name: 'Mirinda',
        description: 'Refresco Mirinda naranja',
        price: 30,
        subcategoryId: 'SUB-10',
        sortOrder: 4,
      },
      {
        name: 'Manzanita',
        description: 'Refresco Manzanita Sol',
        price: 30,
        subcategoryId: 'SUB-10',
        sortOrder: 5,
      },
      {
        name: '7up',
        description: 'Refresco 7up lima-limón',
        price: 30,
        subcategoryId: 'SUB-10',
        sortOrder: 6,
      },
      {
        name: 'Agua Mineral',
        description: 'Agua mineral Peñafiel',
        price: 30,
        subcategoryId: 'SUB-10',
        sortOrder: 7,
      },
      // Café caliente
      {
        name: 'Cafe Americano',
        description: 'Café americano recién preparado',
        price: 45,
        subcategoryId: 'SUB-9',
        sortOrder: 1,
      },
      {
        name: 'Capuchino',
        description: 'Capuchino con espuma de leche',
        price: 45,
        subcategoryId: 'SUB-9',
        sortOrder: 2,
      },
      {
        name: 'Chocolate',
        description: 'Chocolate caliente cremoso',
        price: 50,
        subcategoryId: 'SUB-9',
        sortOrder: 3,
      },
      {
        name: 'Latte Capuchino',
        description: 'Latte con toque de capuchino',
        price: 50,
        subcategoryId: 'SUB-9',
        sortOrder: 4,
      },
      {
        name: 'Latte Vainilla',
        description: 'Latte con jarabe de vainilla',
        price: 50,
        subcategoryId: 'SUB-9',
        sortOrder: 5,
      },
      {
        name: 'Mocaccino',
        description: 'Café con chocolate y crema',
        price: 50,
        subcategoryId: 'SUB-9',
        sortOrder: 6,
      },
      // Coctelería
      {
        name: 'Carajillo',
        description: 'Café con licor 43',
        price: 90,
        subcategoryId: 'SUB-7',
        sortOrder: 1,
      },
      {
        name: 'Clericot',
        description: 'Vino tinto con frutas',
        price: 80,
        subcategoryId: 'SUB-7',
        sortOrder: 2,
      },
      {
        name: 'Conga',
        description: 'Coctel refrescante con vodka',
        price: 75,
        subcategoryId: 'SUB-7',
        sortOrder: 3,
      },
      {
        name: 'Copa Vino',
        description: 'Copa de vino tinto o blanco',
        price: 90,
        subcategoryId: 'SUB-7',
        sortOrder: 4,
      },
      {
        name: 'Destornillador',
        description: 'Vodka con jugo de naranja',
        price: 75,
        subcategoryId: 'SUB-7',
        sortOrder: 5,
      },
      {
        name: 'Gin Maracuya',
        description: 'Gin con maracuyá',
        price: 90,
        subcategoryId: 'SUB-7',
        sortOrder: 6,
      },
      {
        name: 'Gin Pepino',
        description: 'Gin con pepino y tónica',
        price: 90,
        subcategoryId: 'SUB-7',
        sortOrder: 7,
      },
      {
        name: 'Margarita',
        description: 'Tequila, triple sec y limón',
        price: 85,
        subcategoryId: 'SUB-7',
        sortOrder: 8,
      },
      {
        name: 'Mojito',
        description: 'Ron, hierbabuena, limón y soda',
        price: 100,
        subcategoryId: 'SUB-7',
        sortOrder: 9,
      },
      {
        name: 'Paloma',
        description: 'Tequila con refresco de toronja',
        price: 80,
        subcategoryId: 'SUB-7',
        sortOrder: 10,
      },
      {
        name: 'Palo Santo',
        description: 'Mezcal con jugos cítricos',
        price: 80,
        subcategoryId: 'SUB-7',
        sortOrder: 11,
      },
      {
        name: 'Pina Colada',
        description: 'Ron, crema de coco y piña',
        price: 75,
        subcategoryId: 'SUB-7',
        sortOrder: 12,
      },
      {
        name: 'Pinada',
        description: 'Bebida tropical con piña',
        price: 70,
        subcategoryId: 'SUB-7',
        sortOrder: 13,
      },
      {
        name: 'Ruso Blanco',
        description: 'Vodka, licor de café y crema',
        price: 85,
        subcategoryId: 'SUB-7',
        sortOrder: 14,
      },
      {
        name: 'Sangria con Vino',
        description: 'Vino tinto con frutas y refresco',
        price: 80,
        subcategoryId: 'SUB-7',
        sortOrder: 15,
      },
      {
        name: 'Tequila',
        description: 'Caballito de tequila',
        price: 90,
        subcategoryId: 'SUB-7',
        sortOrder: 16,
      },
      {
        name: 'Tinto de Verano',
        description: 'Vino tinto con refresco de limón',
        price: 90,
        subcategoryId: 'SUB-7',
        sortOrder: 17,
      },
      {
        name: 'Vampiro',
        description: 'Tequila, sangrita y refresco',
        price: 80,
        subcategoryId: 'SUB-7',
        sortOrder: 18,
      },
    ];

    for (const beverage of simpleBeverages) {
      const subcategory = await this.subcategoryRepository.findOne({
        where: { id: beverage.subcategoryId },
      });

      if (subcategory) {
        const id = await this.customIdService.generateId(
          EntityPrefix.PRODUCT,
          'product',
        );

        await this.productRepository.save(
          this.productRepository.create({
            id,
            name: beverage.name,
            description: beverage.description,
            price: beverage.price,
            hasVariants: false,
            isActive: true,
            isPizza: false,
            sortOrder: beverage.sortOrder,
            subcategory: subcategory,
            estimatedPrepTime: 5,
            preparationScreenId: beverageScreen.id,
          }),
        );
      }
    }

    // Productos con variantes
    await this.seedBeveragesWithVariants(beverageScreen);
  }

  private async seedBeveragesWithVariants(
    beverageScreen: PreparationScreenEntity,
  ) {
    // Micheladas
    const micheladaSubcategory = await this.subcategoryRepository.findOne({
      where: { id: 'SUB-8' },
    });
    if (micheladaSubcategory) {
      const micheladaId = await this.customIdService.generateId(
        EntityPrefix.PRODUCT,
        'product',
      );

      const michelada = await this.productRepository.save(
        this.productRepository.create({
          id: micheladaId,
          name: 'Michelada',
          description: 'Michelada preparada con nuestra receta especial',
          hasVariants: true,
          isActive: true,
          isPizza: false,
          sortOrder: 5,
          subcategory: micheladaSubcategory,
          estimatedPrepTime: 5,
          preparationScreenId: beverageScreen.id,
        }),
      );

      // Crear variantes de michelada
      const micheladaVariants = [
        { name: 'Michelada clara', price: 80, sortOrder: 1 },
        { name: 'Michelada oscura', price: 80, sortOrder: 2 },
      ];

      for (const variant of micheladaVariants) {
        const variantId = await this.customIdService.generateId(
          EntityPrefix.PRODUCT_VARIANT,
          'product_variant',
        );

        await this.variantRepository.save(
          this.variantRepository.create({
            id: variantId,
            ...variant,
            product: michelada,
            isActive: true,
          }),
        );
      }
    }

    // Frappes
    const frappeSubcategory = await this.subcategoryRepository.findOne({
      where: { id: 'SUB-5' },
    });
    if (frappeSubcategory) {
      const frappeId = await this.customIdService.generateId(
        EntityPrefix.PRODUCT,
        'product',
      );

      const frappe = await this.productRepository.save(
        this.productRepository.create({
          id: frappeId,
          name: 'Frappe',
          description: 'Frappes preparados con ingredientes premium',
          hasVariants: true,
          isActive: true,
          isPizza: false,
          sortOrder: 1,
          subcategory: frappeSubcategory,
          estimatedPrepTime: 10,
          preparationScreenId: beverageScreen.id,
        }),
      );

      // Crear variantes de frappe
      const frappeVariants = [
        { name: 'Frappe Capuchino', price: 70, sortOrder: 1 },
        { name: 'Frappe Coco', price: 70, sortOrder: 2 },
        { name: 'Frappe Caramelo', price: 70, sortOrder: 3 },
        { name: 'Frappe Cajeta', price: 70, sortOrder: 4 },
        { name: 'Frappe Mocaccino', price: 70, sortOrder: 5 },
        { name: 'Frappe Galleta', price: 70, sortOrder: 6 },
        { name: 'Frappe Bombon', price: 70, sortOrder: 7 },
        { name: 'Frappe Rompope', price: 85, sortOrder: 8 },
        { name: 'Frappe Mazapan', price: 85, sortOrder: 9 },
        { name: 'Frappe Magnum', price: 85, sortOrder: 10 },
      ];

      for (const variant of frappeVariants) {
        const variantId = await this.customIdService.generateId(
          EntityPrefix.PRODUCT_VARIANT,
          'product_variant',
        );

        await this.variantRepository.save(
          this.variantRepository.create({
            id: variantId,
            ...variant,
            product: frappe,
            isActive: true,
          }),
        );
      }
    }
  }

  private async seedFoodProducts() {
    // Obtener las pantallas de preparación
    const preparationScreens = await this.preparationScreenRepository.find({
      where: { isActive: true },
    });

    const pizzaScreen = preparationScreens.find(
      (screen) => screen.name === 'Pizza',
    );
    const hamburguesasScreen = preparationScreens.find(
      (screen) => screen.name === 'Hamburguesas',
    );
    const defaultScreen = preparationScreens[0]; // Usar la primera como predeterminada

    if (!defaultScreen) {
      console.error(
        'No hay pantallas de preparación disponibles. Por favor ejecuta el seeder de preparation screens primero.',
      );
      return;
    }

    // Hamburguesas con modificadores
    await this.seedHamburgers(hamburguesasScreen || defaultScreen);

    // Alitas con variantes y modificadores - van a pantalla de Pizza
    await this.seedAlitas(pizzaScreen || defaultScreen);

    // Papas con variantes y modificadores - van a pantalla de Pizza
    await this.seedPapas(pizzaScreen || defaultScreen);

    // Ensaladas con variantes y modificadores
    await this.seedEnsaladas(hamburguesasScreen || defaultScreen);

    // Otros productos de comida
    await this.seedOtherFoodProducts(
      pizzaScreen || defaultScreen,
      hamburguesasScreen || defaultScreen,
    );
  }

  private async seedHamburgers(preparationScreen: PreparationScreenEntity) {
    const hamburguesaSubcategory = await this.subcategoryRepository.findOne({
      where: { id: 'SUB-3' },
    });

    if (hamburguesaSubcategory) {
      // Crear producto de hamburguesa
      const hamburguesaId = await this.customIdService.generateId(
        EntityPrefix.PRODUCT,
        'product',
      );

      const hamburguesa = await this.productRepository.save(
        this.productRepository.create({
          id: hamburguesaId,
          name: 'Hamburguesa',
          description: 'Hamburguesas artesanales con carne de res premium',
          hasVariants: true,
          isActive: true,
          isPizza: false,
          sortOrder: 1,
          subcategory: hamburguesaSubcategory,
          estimatedPrepTime: 15,
          preparationScreenId: preparationScreen.id,
        }),
      );

      // Crear variantes de hamburguesa
      const hamburguesaVariants = [
        { name: 'Hamburguesa Tradicional', price: 85, sortOrder: 1 },
        { name: 'Hamburguesa Especial', price: 95, sortOrder: 2 },
        { name: 'Hamburguesa Hawaiana', price: 95, sortOrder: 3 },
        { name: 'Hamburguesa Pollo', price: 100, sortOrder: 4 },
        { name: 'Hamburguesa BBQ', price: 100, sortOrder: 5 },
        { name: 'Hamburguesa Leñazo', price: 110, sortOrder: 6 },
        { name: 'Hamburguesa Cubana', price: 100, sortOrder: 7 },
      ];

      for (const variant of hamburguesaVariants) {
        const variantId = await this.customIdService.generateId(
          EntityPrefix.PRODUCT_VARIANT,
          'product_variant',
        );

        await this.variantRepository.save(
          this.variantRepository.create({
            id: variantId,
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
    const papasGroupId = await this.customIdService.generateId(
      EntityPrefix.MODIFIER_GROUP,
      'modifier_group',
    );

    const papasGroup = await this.modifierGroupRepository.save(
      this.modifierGroupRepository.create({
        id: papasGroupId,
        name: 'Hamburguesa con papas',
        isRequired: false,
        allowMultipleSelections: false,
        maxSelections: 1,
        isActive: true,
        sortOrder: 1,
      }),
    );

    const papasModifiers = [
      { name: 'Con papas francesa', price: 10, sortOrder: 1 },
      { name: 'Con papas gajo', price: 15, sortOrder: 2 },
      { name: 'Con papas mixtas', price: 15, sortOrder: 3 },
      {
        name: 'Con papas francesa gratinadas',
        price: 15,
        sortOrder: 4,
      },
      {
        name: 'Con papas gajo gratinadas',
        price: 20,
        sortOrder: 5,
      },
      {
        name: 'Con papas mixtas gratinadas',
        price: 20,
        sortOrder: 6,
      },
    ];

    for (const modifier of papasModifiers) {
      const modifierId = await this.customIdService.generateId(
        EntityPrefix.MODIFIER,
        'product_modifier',
      );

      await this.modifierRepository.save(
        this.modifierRepository.create({
          id: modifierId,
          ...modifier,
          modifierGroup: papasGroup,
          isActive: true,
          isDefault: false,
        }),
      );
    }

    // Grupo 2: Hamburguesa extras
    const extrasGroupId = await this.customIdService.generateId(
      EntityPrefix.MODIFIER_GROUP,
      'modifier_group',
    );

    const extrasGroup = await this.modifierGroupRepository.save(
      this.modifierGroupRepository.create({
        id: extrasGroupId,
        name: 'Hamburguesa extras',
        isRequired: false,
        allowMultipleSelections: true,
        maxSelections: 5,
        isActive: true,
        sortOrder: 2,
      }),
    );

    const extrasModifiers = [
      { name: 'Partida', price: 0, sortOrder: 1 },
      { name: 'Doble carne', price: 15, sortOrder: 2 },
      { name: 'Doble pollo', price: 20, sortOrder: 3 },
      { name: 'Piña', price: 5, sortOrder: 4 },
      {
        name: 'Pollo en lugar de carne de res',
        price: 15,
        sortOrder: 5,
      },
    ];

    for (const modifier of extrasModifiers) {
      const modifierId = await this.customIdService.generateId(
        EntityPrefix.MODIFIER,
        'product_modifier',
      );

      await this.modifierRepository.save(
        this.modifierRepository.create({
          id: modifierId,
          ...modifier,
          modifierGroup: extrasGroup,
          isActive: true,
          isDefault: false,
        }),
      );
    }

    // Grupo 3: Quitar ingredientes
    const quitarGroupId = await this.customIdService.generateId(
      EntityPrefix.MODIFIER_GROUP,
      'modifier_group',
    );

    const quitarGroup = await this.modifierGroupRepository.save(
      this.modifierGroupRepository.create({
        id: quitarGroupId,
        name: 'Quitar ingredientes Hamburguesa',
        isRequired: false,
        allowMultipleSelections: true,
        maxSelections: 14,
        isActive: true,
        sortOrder: 3,
      }),
    );

    const quitarModifiers = [
      { name: 'Sin aderezo', price: 0, sortOrder: 1 },
      { name: 'Sin aderezos', price: 0, sortOrder: 2 },
      { name: 'Sin catsup', price: 0, sortOrder: 3 },
      { name: 'Sin cebolla', price: 0, sortOrder: 4 },
      { name: 'Sin chile jalapeño', price: 0, sortOrder: 5 },
      { name: 'Sin crema', price: 0, sortOrder: 6 },
      { name: 'Sin jitomate', price: 0, sortOrder: 7 },
      { name: 'Sin lechuga', price: 0, sortOrder: 8 },
      { name: 'Sin mostaza', price: 0, sortOrder: 9 },
      { name: 'Sin pierna', price: 0, sortOrder: 10 },
      { name: 'Sin queso amarillo', price: 0, sortOrder: 11 },
      { name: 'Sin queso blanco', price: 0, sortOrder: 12 },
      { name: 'Sin tocino', price: 0, sortOrder: 13 },
      { name: 'Sin verduras', price: 0, sortOrder: 14 },
    ];

    for (const modifier of quitarModifiers) {
      const modifierId = await this.customIdService.generateId(
        EntityPrefix.MODIFIER,
        'product_modifier',
      );

      await this.modifierRepository.save(
        this.modifierRepository.create({
          id: modifierId,
          ...modifier,
          modifierGroup: quitarGroup,
          isActive: true,
          isDefault: false,
        }),
      );
    }

    // Asociar grupos de modificadores con el producto
    hamburguesa.modifierGroups = [papasGroup, extrasGroup, quitarGroup];
    await this.productRepository.save(hamburguesa);
  }

  private async seedAlitas(preparationScreen: PreparationScreenEntity) {
    const entradasSubcategory = await this.subcategoryRepository.findOne({
      where: { id: 'SUB-1' },
    });

    if (entradasSubcategory) {
      // Crear producto de alitas
      const alitasId = await this.customIdService.generateId(
        EntityPrefix.PRODUCT,
        'product',
      );

      const alitas = await this.productRepository.save(
        this.productRepository.create({
          id: alitasId,
          name: 'Alitas',
          description: 'Alitas de pollo preparadas al momento',
          hasVariants: true,
          isActive: true,
          isPizza: false,
          sortOrder: 1,
          subcategory: entradasSubcategory,
          estimatedPrepTime: 15,
          preparationScreenId: preparationScreen.id,
        }),
      );

      // Crear variantes de alitas
      const alitasVariants = [
        { name: 'Orden de Alitas BBQ', price: 135, sortOrder: 1 },
        { name: 'Orden de Alitas Picosas', price: 135, sortOrder: 2 },
        { name: 'Orden de Alitas Fritas', price: 135, sortOrder: 3 },
        { name: 'Orden de Alitas Mango Habanero', price: 140, sortOrder: 4 },
        { name: 'Orden de Alitas Mixtas', price: 135, sortOrder: 5 },
        { name: 'Media Orden de Alitas BBQ', price: 70, sortOrder: 6 },
        { name: 'Media Orden de Alitas Picosas', price: 70, sortOrder: 7 },
        { name: 'Media Orden de Alitas Fritas', price: 70, sortOrder: 8 },
        {
          name: 'Media Orden de Alitas Mango Habanero',
          price: 75,
          sortOrder: 9,
        },
      ];

      for (const variant of alitasVariants) {
        const variantId = await this.customIdService.generateId(
          EntityPrefix.PRODUCT_VARIANT,
          'product_variant',
        );

        await this.variantRepository.save(
          this.variantRepository.create({
            id: variantId,
            ...variant,
            product: alitas,
            isActive: true,
          }),
        );
      }

      // Crear grupo de modificadores para alitas
      const alitasModifierGroupId = await this.customIdService.generateId(
        EntityPrefix.MODIFIER_GROUP,
        'modifier_group',
      );

      const alitasModifierGroup = await this.modifierGroupRepository.save(
        this.modifierGroupRepository.create({
          id: alitasModifierGroupId,
          name: 'Modificadores Alitas',
          isRequired: false,
          allowMultipleSelections: true,
          maxSelections: 4,
          isActive: true,
          sortOrder: 1,
        }),
      );

      const alitasModifiers = [
        { name: 'Extra salsa', price: 10, sortOrder: 1 },
        { name: 'Con aderezo ranch', price: 10, sortOrder: 2 },
        { name: 'Extra chile de aceite', price: 10, sortOrder: 3 },
        { name: 'Extra doradas', price: 0, sortOrder: 4 },
      ];

      for (const modifier of alitasModifiers) {
        const modifierId = await this.customIdService.generateId(
          EntityPrefix.MODIFIER,
          'product_modifier',
        );

        await this.modifierRepository.save(
          this.modifierRepository.create({
            id: modifierId,
            ...modifier,
            modifierGroup: alitasModifierGroup,
            isActive: true,
            isDefault: false,
          }),
        );
      }

      // Asociar grupo de modificadores con el producto
      alitas.modifierGroups = [alitasModifierGroup];
      await this.productRepository.save(alitas);
    }
  }

  private async seedPapas(preparationScreen: PreparationScreenEntity) {
    const entradasSubcategory = await this.subcategoryRepository.findOne({
      where: { id: 'SUB-1' },
    });

    if (entradasSubcategory) {
      // Crear producto de papas
      const papasId = await this.customIdService.generateId(
        EntityPrefix.PRODUCT,
        'product',
      );

      const papas = await this.productRepository.save(
        this.productRepository.create({
          id: papasId,
          name: 'Orden de Papas',
          description: 'Papas preparadas con nuestra receta especial',
          hasVariants: true,
          isActive: true,
          isPizza: false,
          sortOrder: 2,
          subcategory: entradasSubcategory,
          estimatedPrepTime: 10,
          preparationScreenId: preparationScreen.id,
        }),
      );

      // Crear variantes de papas
      const papasVariants = [
        { name: 'Orden de Papas a la Francesa', price: 90, sortOrder: 1 },
        { name: 'Orden de Papas Gajo', price: 105, sortOrder: 2 },
        {
          name: 'Orden de Papas Mixtas francesa y gajo',
          price: 105,
          sortOrder: 3,
        },
        { name: 'Media Orden de Papas a la Francesa', price: 50, sortOrder: 4 },
        { name: 'Media Orden de Papas Gajo', price: 65, sortOrder: 5 },
      ];

      for (const variant of papasVariants) {
        const variantId = await this.customIdService.generateId(
          EntityPrefix.PRODUCT_VARIANT,
          'product_variant',
        );

        await this.variantRepository.save(
          this.variantRepository.create({
            id: variantId,
            ...variant,
            product: papas,
            isActive: true,
          }),
        );
      }

      // Crear grupos de modificadores para papas
      const papasQuesoGroupId = await this.customIdService.generateId(
        EntityPrefix.MODIFIER_GROUP,
        'modifier_group',
      );

      const papasQuesoGroup = await this.modifierGroupRepository.save(
        this.modifierGroupRepository.create({
          id: papasQuesoGroupId,
          name: 'Papas queso',
          isRequired: true,
          allowMultipleSelections: true,
          maxSelections: 3,
          isActive: true,
          sortOrder: 1,
        }),
      );

      const papasQuesoModifiers = [
        { name: 'Sin queso', price: 0, sortOrder: 1 },
        { name: 'Con queso', price: 0, sortOrder: 2 },
        { name: 'Extra queso', price: 10, sortOrder: 3 },
      ];

      for (const modifier of papasQuesoModifiers) {
        const modifierId = await this.customIdService.generateId(
          EntityPrefix.MODIFIER,
          'product_modifier',
        );

        await this.modifierRepository.save(
          this.modifierRepository.create({
            id: modifierId,
            ...modifier,
            modifierGroup: papasQuesoGroup,
            isActive: true,
            isDefault: modifier.name === 'Con queso', // Con queso es default
          }),
        );
      }

      const papasObservacionesGroupId = await this.customIdService.generateId(
        EntityPrefix.MODIFIER_GROUP,
        'modifier_group',
      );

      const papasObservacionesGroup = await this.modifierGroupRepository.save(
        this.modifierGroupRepository.create({
          id: papasObservacionesGroupId,
          name: 'Papas observaciones',
          isRequired: false,
          allowMultipleSelections: true,
          maxSelections: 1,
          isActive: true,
          sortOrder: 2,
        }),
      );

      const papasObservacionesModifiers = [
        { name: 'Extra aderezo', price: 0, sortOrder: 1 },
      ];

      for (const modifier of papasObservacionesModifiers) {
        const modifierId = await this.customIdService.generateId(
          EntityPrefix.MODIFIER,
          'product_modifier',
        );

        await this.modifierRepository.save(
          this.modifierRepository.create({
            id: modifierId,
            ...modifier,
            modifierGroup: papasObservacionesGroup,
            isActive: true,
            isDefault: false,
          }),
        );
      }

      // Asociar grupos de modificadores con el producto
      papas.modifierGroups = [papasQuesoGroup, papasObservacionesGroup];
      await this.productRepository.save(papas);
    }
  }

  private async seedEnsaladas(preparationScreen: PreparationScreenEntity) {
    const ensaladasSubcategory = await this.subcategoryRepository.findOne({
      where: { id: 'SUB-4' },
    });

    if (ensaladasSubcategory) {
      // Crear producto de ensaladas
      const ensaladaId = await this.customIdService.generateId(
        EntityPrefix.PRODUCT,
        'product',
      );

      const ensalada = await this.productRepository.save(
        this.productRepository.create({
          id: ensaladaId,
          name: 'Ensalada',
          description: 'Ensaladas frescas preparadas al momento',
          hasVariants: true,
          isActive: true,
          isPizza: false,
          sortOrder: 1,
          subcategory: ensaladasSubcategory,
          estimatedPrepTime: 8,
          preparationScreenId: preparationScreen.id,
        }),
      );

      // Crear variantes de ensaladas
      const ensaladaVariants = [
        {
          name: 'Ensalada de Pollo Chica',
          price: 90,
          sortOrder: 1,
        },
        {
          name: 'Ensalada de Pollo Grande',
          price: 120,
          sortOrder: 2,
        },
        {
          name: 'Ensalada de Jamon Chica',
          price: 80,
          sortOrder: 3,
        },
        {
          name: 'Ensalada de Jamon Grande',
          price: 100,
          sortOrder: 4,
        },
        {
          name: 'Ensalada Vegetal Chica',
          price: 70,
          sortOrder: 5,
        },
        {
          name: 'Ensalada Vegetal Grande',
          price: 90,
          sortOrder: 6,
        },
      ];

      for (const variant of ensaladaVariants) {
        const variantId = await this.customIdService.generateId(
          EntityPrefix.PRODUCT_VARIANT,
          'product_variant',
        );

        await this.variantRepository.save(
          this.variantRepository.create({
            id: variantId,
            ...variant,
            product: ensalada,
            isActive: true,
          }),
        );
      }

      // Crear grupos de modificadores para ensaladas
      const extrasEnsaladasGroupId = await this.customIdService.generateId(
        EntityPrefix.MODIFIER_GROUP,
        'modifier_group',
      );

      const extrasEnsaladasGroup = await this.modifierGroupRepository.save(
        this.modifierGroupRepository.create({
          id: extrasEnsaladasGroupId,
          name: 'Extras Ensaladas',
          isRequired: false,
          allowMultipleSelections: true,
          maxSelections: 2,
          isActive: true,
          sortOrder: 1,
        }),
      );

      const extrasEnsaladasModifiers = [
        { name: 'Con vinagreta', price: 0, sortOrder: 1 },
        { name: 'Extra pollo', price: 15, sortOrder: 2 },
      ];

      for (const modifier of extrasEnsaladasModifiers) {
        const modifierId = await this.customIdService.generateId(
          EntityPrefix.MODIFIER,
          'product_modifier',
        );

        await this.modifierRepository.save(
          this.modifierRepository.create({
            id: modifierId,
            ...modifier,
            modifierGroup: extrasEnsaladasGroup,
            isActive: true,
            isDefault: false,
          }),
        );
      }

      const quitarEnsaladaGroupId = await this.customIdService.generateId(
        EntityPrefix.MODIFIER_GROUP,
        'modifier_group',
      );

      const quitarEnsaladaGroup = await this.modifierGroupRepository.save(
        this.modifierGroupRepository.create({
          id: quitarEnsaladaGroupId,
          name: 'Quitar ingredientes Ensalada',
          isRequired: false,
          allowMultipleSelections: true,
          maxSelections: 10,
          isActive: true,
          sortOrder: 2,
        }),
      );

      const quitarEnsaladaModifiers = [
        { name: 'Sin aderezo', price: 0, sortOrder: 1 },
        { name: 'Sin betabel crujiente', price: 0, sortOrder: 2 },
        { name: 'Sin chile morrón', price: 0, sortOrder: 3 },
        { name: 'Sin elote', price: 0, sortOrder: 4 },
        { name: 'Sin jamón', price: 0, sortOrder: 5 },
        { name: 'Sin jitomate', price: 0, sortOrder: 6 },
        { name: 'Sin lechuga', price: 0, sortOrder: 7 },
        { name: 'Sin pollo', price: 0, sortOrder: 8 },
        { name: 'Sin queso parmesano', price: 0, sortOrder: 9 },
        { name: 'Sin zanahoria', price: 0, sortOrder: 10 },
      ];

      for (const modifier of quitarEnsaladaModifiers) {
        const modifierId = await this.customIdService.generateId(
          EntityPrefix.MODIFIER,
          'product_modifier',
        );

        await this.modifierRepository.save(
          this.modifierRepository.create({
            id: modifierId,
            ...modifier,
            modifierGroup: quitarEnsaladaGroup,
            isActive: true,
            isDefault: false,
          }),
        );
      }

      // Asociar grupos de modificadores con el producto
      ensalada.modifierGroups = [extrasEnsaladasGroup, quitarEnsaladaGroup];
      await this.productRepository.save(ensalada);
    }
  }

  private async seedOtherFoodProducts(
    pizzaScreen: PreparationScreenEntity,
    hamburguesasScreen: PreparationScreenEntity,
  ) {
    // Pizzas
    await this.seedPizzas(pizzaScreen);

    // Dedos de queso
    const hamburguesaSubcategory = await this.subcategoryRepository.findOne({
      where: { id: 'SUB-3' },
    });
    if (hamburguesaSubcategory) {
      const dedosId = await this.customIdService.generateId(
        EntityPrefix.PRODUCT,
        'product',
      );

      await this.productRepository.save(
        this.productRepository.create({
          id: dedosId,
          name: 'Dedos de queso',
          description: 'Dedos de queso mozzarella empanizados',
          price: 90,
          hasVariants: false,
          isActive: true,
          isPizza: false,
          sortOrder: 2,
          subcategory: hamburguesaSubcategory,
          estimatedPrepTime: 8,
          preparationScreenId: hamburguesasScreen.id,
        }),
      );
    }
  }

  private async seedPizzas(preparationScreen: PreparationScreenEntity) {
    const pizzaSubcategory = await this.subcategoryRepository.findOne({
      where: { id: 'SUB-2' },
    });

    if (pizzaSubcategory) {
      // Crear producto de pizza
      const pizzaId = await this.customIdService.generateId(
        EntityPrefix.PRODUCT,
        'product',
      );

      const pizza = await this.productRepository.save(
        this.productRepository.create({
          id: pizzaId,
          name: 'Pizza',
          description: 'Pizzas artesanales horneadas en horno de leña',
          hasVariants: true,
          isActive: true,
          isPizza: true,
          sortOrder: 1,
          subcategory: pizzaSubcategory,
          estimatedPrepTime: 20,
          preparationScreenId: preparationScreen.id,
        }),
      );

      // Crear variantes de pizza
      const pizzaVariants = [
        { name: 'Pizza Grande', price: 240, sortOrder: 1 },
        { name: 'Pizza Mediana', price: 190, sortOrder: 2 },
        { name: 'Pizza Chica', price: 140, sortOrder: 3 },
        {
          name: 'Pizza Grande Con Orilla Rellena de Queso',
          price: 270,
          sortOrder: 4,
        },
        {
          name: 'Pizza Mediana Con Orilla Rellena de Queso',
          price: 220,
          sortOrder: 5,
        },
        {
          name: 'Pizza Chica Con Orilla Rellena de Queso',
          price: 160,
          sortOrder: 6,
        },
      ];

      for (const variant of pizzaVariants) {
        const variantId = await this.customIdService.generateId(
          EntityPrefix.PRODUCT_VARIANT,
          'product_variant',
        );

        await this.variantRepository.save(
          this.variantRepository.create({
            id: variantId,
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

      // Chile chillón
      const chileId = await this.customIdService.generateId(
        EntityPrefix.PRODUCT,
        'product',
      );

      await this.productRepository.save(
        this.productRepository.create({
          id: chileId,
          name: 'Chile chillon',
          description: 'Chile jalapeño relleno de queso',
          price: 35,
          hasVariants: false,
          isActive: true,
          isPizza: false,
          sortOrder: 2,
          subcategory: pizzaSubcategory,
          estimatedPrepTime: 10,
          preparationScreenId: preparationScreen.id,
        }),
      );
    }
  }

  private async createPizzaModifiers(pizza: ProductEntity) {
    // Grupo de observaciones para pizza
    const observacionesGroupId = await this.customIdService.generateId(
      EntityPrefix.MODIFIER_GROUP,
      'modifier_group',
    );

    const observacionesGroup = await this.modifierGroupRepository.save(
      this.modifierGroupRepository.create({
        id: observacionesGroupId,
        name: 'Observaciones de Pizza',
        isRequired: false,
        allowMultipleSelections: true,
        maxSelections: 6,
        isActive: true,
        sortOrder: 1,
      }),
    );

    const observacionesModifiers = [
      { name: 'Con catsup', price: 0, sortOrder: 1 },
      { name: 'Extra aderezo', price: 0, sortOrder: 2 },
      { name: 'Extra chile de aceite', price: 0, sortOrder: 3 },
      { name: 'Extra dorada', price: 0, sortOrder: 4 },
      { name: 'Menos dorada', price: 0, sortOrder: 5 },
      { name: 'Sin salsa', price: 0, sortOrder: 6 },
    ];

    for (const modifier of observacionesModifiers) {
      const modifierId = await this.customIdService.generateId(
        EntityPrefix.MODIFIER,
        'product_modifier',
      );

      await this.modifierRepository.save(
        this.modifierRepository.create({
          id: modifierId,
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
