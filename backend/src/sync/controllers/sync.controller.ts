import { Controller, Get, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LocalSyncService } from '../services/local-sync.service';
import { SyncActivityEntity } from '../infrastructure/persistence/relational/entities/sync-activity.entity';

@ApiTags('Sync')
@ApiBearerAuth()
@Controller({
  path: 'sync-local',
  version: '1',
})
export class SyncController {
  constructor(private readonly localSyncService: LocalSyncService) {}

  @Get('status')
  @ApiOperation({
    summary: 'Obtener información del servicio de sincronización',
  })
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
        nextPullTime: this.localSyncService['nextPullTime'],
      },
    };
  }

  @Get('activity')
  @ApiOperation({
    summary: 'Obtener actividad reciente de sincronización',
    description:
      'Devuelve las últimas 20 actividades de sincronización ordenadas por fecha descendente',
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
          type: {
            type: 'string',
            enum: ['PULL_CHANGES', 'RESTAURANT_DATA', 'ORDER_STATUS'],
          },
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
