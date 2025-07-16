import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

interface DiscoveryResponse {
  type: string;
  name: string;
  version: string;
  port: number;
  features: string[];
  timestamp: number;
  remoteUrl?: string;
  tunnelEnabled?: boolean;
}

@ApiTags('Discovery')
@Controller({
  path: 'discovery',
  version: '1',
})
export class DiscoveryController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  @ApiOperation({
    summary: 'Service discovery endpoint',
    description: 'Returns service identification for auto-discovery',
  })
  @ApiResponse({
    status: 200,
    description: 'Service information',
    schema: {
      type: 'object',
      properties: {
        type: { type: 'string', example: 'cloudbite-api' },
        name: { type: 'string', example: 'CloudBite Restaurant API' },
        version: { type: 'string', example: '1.0.0' },
        port: { type: 'number', example: 3737 },
        features: {
          type: 'array',
          items: { type: 'string' },
          example: ['orders', 'thermal-printing', 'voice-orders', 'sync'],
        },
        timestamp: { type: 'number', example: 1234567890123 },
        remoteUrl: { type: 'string', example: 'https://api.ejemplo.com' },
        tunnelEnabled: { type: 'boolean', example: true },
      },
      required: ['type', 'name', 'version', 'port', 'features', 'timestamp'],
    },
  })
  identify(): DiscoveryResponse {
    const remoteUrl = this.configService.get('app.remoteUrl');
    const tunnelEnabled = !!remoteUrl;

    return {
      type: 'cloudbite-api',
      name: this.configService.get('app.name', 'CloudBite Restaurant API'),
      version: '1.0.0',
      port: this.configService.get('app.port', 3737),
      features: [
        'orders',
        'products',
        'thermal-printing',
        'voice-orders',
        'payments',
        'customers',
        'tables',
        'sync',
      ],
      timestamp: Date.now(),
      ...(tunnelEnabled && { remoteUrl, tunnelEnabled }),
    };
  }
}
