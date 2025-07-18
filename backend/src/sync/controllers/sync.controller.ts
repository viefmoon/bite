import {
  Controller,
  Post,
  Get,
  HttpStatus,
  Body,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LocalSyncService } from '../services/local-sync.service';
import { PullChangesResponseDto } from '../dto/pull-changes-response.dto';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { UpdateOrderStatusResponseDto } from '../dto/update-order-status-response.dto';
import { SyncActivityEntity } from '../infrastructure/persistence/relational/entities/sync-activity.entity';
import { PullChangesRequestDto } from '../dto/pull-changes-request.dto';

@ApiTags('Sync')
@ApiBearerAuth()
@Controller({
  path: 'sync-local',
  version: '1',
})
export class SyncController {
  constructor(
    private readonly localSyncService: LocalSyncService,
  ) {}


  @Get('status')
  @ApiOperation({ summary: 'Obtener información del servicio de sincronización' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estado del servicio de sincronización',
    schema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        webSocketEnabled: { type: 'boolean' },
        remoteUrl: { type: 'string', nullable: true },
        mode: { type: 'string', example: 'pull' },
      },
    },
  })
  async getSyncStatus() {
    const syncConfig = this.localSyncService['syncConfig'];
    const webSocketStatus = this.localSyncService.getWebSocketStatus();
    
    return {
      enabled: syncConfig.enabled,
      webSocketEnabled: syncConfig.webSocketEnabled,
      webSocketConnected: webSocketStatus.connected,
      webSocketFailed: webSocketStatus.failed,
      remoteUrl: syncConfig.cloudApiUrl || null,
      mode: 'pull',
      intervalMinutes: syncConfig.intervalMinutes,
      stats: {
        pullCount: this.localSyncService['pullCount'],
        successfulPulls: this.localSyncService['successfulPulls'],
        failedPulls: this.localSyncService['failedPulls'],
        lastPullTime: this.localSyncService['lastPullTime'],
        nextPullTime: this.localSyncService['nextPullTime']
      }
    };
  }


  @Post('pull-changes')
  @ApiOperation({ 
    summary: 'Obtener cambios pendientes y confirmar procesados',
    description: 'Obtiene pedidos pendientes y clientes actualizados. Opcionalmente confirma IDs procesados exitosamente del pull anterior.'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cambios pendientes obtenidos exitosamente',
    type: PullChangesResponseDto,
  })
  async pullChanges(@Body() confirmDto: PullChangesRequestDto): Promise<PullChangesResponseDto> {
    return await this.localSyncService.pullChanges(confirmDto);
  }

  @Post('order-status')
  @ApiOperation({ 
    summary: 'Notificar cambio de estado de orden a la nube',
    description: 'Notifica al backend en la nube cuando el restaurante acepta, rechaza o actualiza el estado de un pedido'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estado actualizado exitosamente en la nube',
    type: UpdateOrderStatusResponseDto,
  })
  async updateOrderStatus(
    @Body() updateDto: UpdateOrderStatusDto,
  ): Promise<UpdateOrderStatusResponseDto> {
    return await this.localSyncService.updateOrderStatus(updateDto);
  }


  @Get('activity')
  @ApiOperation({ 
    summary: 'Obtener actividad reciente de sincronización',
    description: 'Devuelve las últimas 20 actividades de sincronización ordenadas por fecha descendente'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Actividades de sincronización obtenidas exitosamente',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          type: { type: 'string', enum: ['PULL_CHANGES', 'RESTAURANT_DATA', 'ORDER_STATUS'] },
          direction: { type: 'string', enum: ['IN', 'OUT'] },
          success: { type: 'boolean' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  async getSyncActivity(): Promise<SyncActivityEntity[]> {
    return await this.localSyncService.getRecentActivity();
  }
}
