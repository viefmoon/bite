import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { OrderType } from '../../orders/domain/enums/order-type.enum';

export class ProcessAudioOrderDto {
  @ApiProperty({
    description: 'Audio file in base64 format',
    example: 'data:audio/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2...',
  })
  @IsString()
  @IsNotEmpty()
  audioData: string;

  @ApiProperty({
    description: 'Transcription of the audio',
    example: 'Quiero una pizza familiar de pepperoni',
  })
  @IsString()
  @IsNotEmpty()
  transcription: string;

  @ApiPropertyOptional({
    description: 'Audio format',
    example: 'audio/webm',
  })
  @IsString()
  @IsOptional()
  audioFormat?: string;

  @ApiPropertyOptional({
    description: 'Duration of the audio in seconds',
    example: 5.2,
  })
  @IsNumber()
  @IsOptional()
  duration?: number;

  @ApiPropertyOptional({
    description: 'Customer ID if identified',
  })
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({
    description: 'Order ID if modifying existing order',
  })
  @IsUUID()
  @IsOptional()
  orderId?: string;

  @ApiPropertyOptional({
    description: 'Type of order',
    enum: OrderType,
    example: OrderType.DELIVERY,
  })
  @IsEnum(OrderType)
  @IsOptional()
  orderType?: OrderType;
}

export class AudioOrderResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Processing result message',
    example: 'Orden procesada correctamente',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'Created or updated order data',
  })
  order?: any;

  @ApiPropertyOptional({
    description: 'Structured data extracted from audio',
    example: {
      orderItems: [
        {
          productId: 'PR-39',
          variantId: 'PVA-20',
          quantity: 1,
        },
      ],
      deliveryInfo: {
        fullAddress: 'Nicolás Bravo 165',
      },
      orderType: 'DELIVERY',
      warnings: null,
      processingTime: 1500,
    },
  })
  extractedData?: {
    orderItems?: Array<{
      productId: string;
      variantId?: string;
      quantity: number;
      modifiers?: string[];
      pizzaCustomizations?: Array<{
        customizationId: string;
        half: string;
        action: string;
      }>;
    }>;
    deliveryInfo?: {
      fullAddress?: string;
      recipientName?: string;
      recipientPhone?: string;
    };
    scheduledDelivery?: {
      time?: string;
    };
    orderType?: OrderType;
    warnings?: string;
    processingTime?: number;
  };

  @ApiPropertyOptional({
    description: 'Error details if processing failed',
  })
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export class CloudApiRequestDto {
  audio: string;
  transcript: string;
  metadata?: {
    customerId?: string;
    orderId?: string;
    timestamp: string;
    orderType?: OrderType;
  };
}

export class CloudApiResponseDto {
  success: boolean;
  data?: {
    action: string;
    entities: any;
    confidence: number;
  };
  error?: {
    code: string;
    message: string;
  };
}