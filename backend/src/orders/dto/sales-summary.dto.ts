import { ApiProperty } from '@nestjs/swagger';

export class ProductSalesSummaryDto {
  @ApiProperty({
    description: 'ID del producto',
    example: 'PR-001',
  })
  productId: string;

  @ApiProperty({
    description: 'Nombre del producto',
    example: 'Pizza Margarita',
  })
  productName: string;

  @ApiProperty({
    description: 'Cantidad vendida',
    example: 10,
  })
  quantity: number;

  @ApiProperty({
    description: 'Total vendido del producto',
    example: 1500.00,
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Precio promedio por unidad',
    example: 150.00,
  })
  averagePrice: number;
}

export class SubcategorySalesSummaryDto {
  @ApiProperty({
    description: 'ID de la subcategoría',
    example: 'SUB-001',
  })
  subcategoryId: string;

  @ApiProperty({
    description: 'Nombre de la subcategoría',
    example: 'Pizzas Especiales',
  })
  subcategoryName: string;

  @ApiProperty({
    description: 'Cantidad total de productos vendidos en la subcategoría',
    example: 25,
  })
  quantity: number;

  @ApiProperty({
    description: 'Total vendido en la subcategoría',
    example: 3750.00,
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Productos vendidos en esta subcategoría',
    type: [ProductSalesSummaryDto],
  })
  products: ProductSalesSummaryDto[];
}

export class CategorySalesSummaryDto {
  @ApiProperty({
    description: 'ID de la categoría',
    example: 'CAT-001',
  })
  categoryId: string;

  @ApiProperty({
    description: 'Nombre de la categoría',
    example: 'Pizzas',
  })
  categoryName: string;

  @ApiProperty({
    description: 'Cantidad total de productos vendidos en la categoría',
    example: 50,
  })
  quantity: number;

  @ApiProperty({
    description: 'Total vendido en la categoría',
    example: 7500.00,
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Porcentaje del total de ventas',
    example: 45.5,
  })
  percentage: number;

  @ApiProperty({
    description: 'Subcategorías de esta categoría',
    type: [SubcategorySalesSummaryDto],
  })
  subcategories: SubcategorySalesSummaryDto[];
}

export class ShiftSalesSummaryDto {
  @ApiProperty({
    description: 'ID del turno',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  shiftId: string;

  @ApiProperty({
    description: 'Número del turno',
    example: 1,
  })
  shiftNumber: number;

  @ApiProperty({
    description: 'Fecha del turno',
    example: '2024-01-20',
  })
  date: Date;

  @ApiProperty({
    description: 'Total general de ventas',
    example: 15000.00,
  })
  totalSales: number;

  @ApiProperty({
    description: 'Cantidad total de productos vendidos',
    example: 100,
  })
  totalQuantity: number;

  @ApiProperty({
    description: 'Cantidad de órdenes completadas',
    example: 25,
  })
  completedOrders: number;

  @ApiProperty({
    description: 'Ticket promedio',
    example: 600.00,
  })
  averageTicket: number;

  @ApiProperty({
    description: 'Resumen de ventas por categoría',
    type: [CategorySalesSummaryDto],
  })
  categories: CategorySalesSummaryDto[];

  @ApiProperty({
    description: 'Productos más vendidos (top 10)',
    type: [ProductSalesSummaryDto],
  })
  topProducts: ProductSalesSummaryDto[];

  @ApiProperty({
    description: 'Hora de inicio del turno',
  })
  startTime: Date;

  @ApiProperty({
    description: 'Hora de fin del turno (null si está abierto)',
    nullable: true,
  })
  endTime: Date | null;
}