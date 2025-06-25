import {
  Controller,
  Post,
  Get,
  HttpStatus,
  HttpCode,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { LocalSyncService } from '../services/local-sync.service';
import { SyncStatusService } from '../services/sync-status.service';

@ApiTags('Sync')
@ApiBearerAuth()
@Controller({
  path: 'sync-local',
  version: '1',
})
export class SyncController {
  constructor(
    private readonly localSyncService: LocalSyncService,
    private readonly syncStatusService: SyncStatusService,
  ) {}

  @Post('trigger')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Disparar sincronización manual' })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Sincronización iniciada',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Ya hay una sincronización en progreso',
  })
  triggerSync() {
    if (this.syncStatusService.isCurrentlySyncing()) {
      return {
        message: 'Ya hay una sincronización en progreso',
        status: 'in_progress',
      };
    }

    // Ejecutar sincronización de forma asíncrona
    this.localSyncService.triggerSync().catch((error) => {
      console.error('Error durante la sincronización:', error);
    });

    return {
      message: 'Sincronización iniciada',
      status: 'started',
    };
  }

  @Get('status')
  @ApiOperation({ summary: 'Obtener estado de sincronización' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estado actual de sincronización',
    schema: {
      type: 'object',
      properties: {
        isCurrentlySyncing: { type: 'boolean' },
        lastSync: {
          type: 'object',
          nullable: true,
          properties: {
            type: { type: 'string' },
            status: { type: 'string' },
            completedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            itemsSynced: { type: 'number' },
            itemsFailed: { type: 'number' },
            duration: { type: 'number', nullable: true },
          },
        },
        syncHistory: {
          type: 'array',
          items: { type: 'object' },
        },
        errors: {
          type: 'array',
          nullable: true,
          items: { type: 'object' },
        },
      },
    },
  })
  async getSyncStatus() {
    return await this.syncStatusService.getStatus();
  }

  @Get('history')
  @ApiOperation({ summary: 'Obtener historial de sincronizaciones' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Historial de sincronizaciones',
  })
  async getSyncHistory() {
    const { data, count } = await this.syncStatusService[
      'syncLogRepository'
    ].findAll({
      limit: 20,
    });

    return {
      data,
      count,
    };
  }

  @Post('orders/accept')
  @ApiOperation({ summary: 'Aceptar órdenes de WhatsApp' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        orderIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'IDs de las órdenes a aceptar',
        },
      },
      required: ['orderIds'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Órdenes aceptadas exitosamente',
    schema: {
      type: 'object',
      properties: {
        accepted: { type: 'number' },
        failed: { type: 'number' },
        message: { type: 'string' },
      },
    },
  })
  async acceptWhatsAppOrders(@Body() body: { orderIds: string[] }) {
    const result = await this.localSyncService.acceptWhatsAppOrders(
      body.orderIds,
    );

    return {
      ...result,
      message: `${result.accepted} órdenes aceptadas, ${result.failed} fallidas`,
    };
  }
}
