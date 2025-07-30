import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../domain/enums/order-status.enum';
import { OrderType } from '../domain/enums/order-type.enum';

class UserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName?: string;

  @ApiProperty()
  lastName?: string;

  @ApiProperty()
  username: string;
}

class AreaDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

class TableDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  number: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  isTemporary: boolean;

  @ApiProperty({ type: () => AreaDto, required: false })
  area?: AreaDto;
}

class DeliveryInfoDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ required: false })
  recipientName?: string;

  @ApiProperty({ required: false })
  recipientPhone?: string;

  @ApiProperty({ required: false })
  deliveryInstructions?: string;

  @ApiProperty({ required: false })
  fullAddress?: string;

  @ApiProperty({ required: false })
  street?: string;

  @ApiProperty({ required: false })
  number?: string;

  @ApiProperty({ required: false })
  interiorNumber?: string;

  @ApiProperty({ required: false })
  neighborhood?: string;

  @ApiProperty({ required: false })
  city?: string;

  @ApiProperty({ required: false })
  state?: string;

  @ApiProperty({ required: false })
  zipCode?: string;

  @ApiProperty({ required: false })
  country?: string;

  @ApiProperty({ required: false })
  latitude?: number;

  @ApiProperty({ required: false })
  longitude?: number;
}

class ProductDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  price: number;
}

class ProductVariantDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  price: number;
}

class ModifierDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  price: number;
}

class PizzaCustomizationDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  type: string;
}

class SelectedPizzaCustomizationDto {
  @ApiProperty()
  pizzaCustomizationId: string;

  @ApiProperty()
  half: string;

  @ApiProperty()
  action: string;

  @ApiProperty({ type: () => PizzaCustomizationDto, required: false })
  pizzaCustomization?: PizzaCustomizationDto;
}

class OrderItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  basePrice: number;

  @ApiProperty()
  finalPrice: number;

  @ApiProperty({ required: false })
  preparationNotes?: string;

  @ApiProperty({ required: false })
  preparationStatus?: string;

  @ApiProperty({ type: () => ProductDto })
  product: ProductDto;

  @ApiProperty({ type: () => ProductVariantDto, required: false })
  productVariant?: ProductVariantDto;

  @ApiProperty({ type: () => [ModifierDto], required: false })
  productModifiers?: ModifierDto[];

  @ApiProperty({ type: () => [SelectedPizzaCustomizationDto], required: false })
  selectedPizzaCustomizations?: SelectedPizzaCustomizationDto[];
}

class PaymentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  paymentMethod: string;

  @ApiProperty()
  paymentStatus: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

class PrinterDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

class TicketImpressionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  ticketType: string;

  @ApiProperty()
  impressionTime: Date;

  @ApiProperty({ type: () => UserDto, required: false })
  user?: UserDto;

  @ApiProperty({ type: () => PrinterDto, required: false })
  printer?: PrinterDto;
}

export class ReceiptDetailDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  shiftOrderNumber: number;

  @ApiProperty({ enum: OrderType })
  orderType: OrderType;

  @ApiProperty({ enum: OrderStatus })
  orderStatus: OrderStatus;

  @ApiProperty()
  total: number;

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false })
  finalizedAt?: Date;

  @ApiProperty({ required: false })
  scheduledAt?: Date;

  @ApiProperty({ required: false })
  notes?: string;

  @ApiProperty({ type: () => UserDto, required: false })
  user?: UserDto;

  @ApiProperty({ type: () => TableDto, required: false })
  table?: TableDto;

  @ApiProperty({ type: () => DeliveryInfoDto, required: false })
  deliveryInfo?: DeliveryInfoDto;

  @ApiProperty({ type: () => [OrderItemDto] })
  orderItems: OrderItemDto[];

  @ApiProperty({ type: () => [PaymentDto], required: false })
  payments?: PaymentDto[];

  @ApiProperty({ type: () => [TicketImpressionDto], required: false })
  ticketImpressions?: TicketImpressionDto[];

  @ApiProperty({
    required: false,
    description: 'Indica si la orden proviene de WhatsApp',
    example: true,
  })
  isFromWhatsApp?: boolean;
}
