import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AudioOrderProcessingService } from '../services/audio-order-processing.service';
import {
  ProcessAudioOrderDto,
  AudioOrderResponseDto,
} from '../dto/process-audio-order.dto';

@ApiTags('Audio Orders')
@Controller('audio-orders')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AudioOrderProcessingController {
  constructor(
    private readonly audioOrderProcessingService: AudioOrderProcessingService,
  ) {}

  @Post('process')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Process audio order',
    description:
      'Processes an audio recording with its transcription to create or modify orders',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Audio processed successfully',
    type: AudioOrderResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid audio data or processing error',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async processAudioOrder(
    @Body() dto: ProcessAudioOrderDto,
  ): Promise<AudioOrderResponseDto> {
    return this.audioOrderProcessingService.processAudioOrder(dto);
  }

  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check audio service availability',
    description:
      'Verifies if the audio processing service is available and can connect to the remote AI service',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service is available',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        available: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Audio processing service is available' },
        timestamp: { type: 'string', example: '2024-01-20T12:00:00Z' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'Service is not available',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'error' },
        available: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Cannot connect to audio processing service' },
        timestamp: { type: 'string', example: '2024-01-20T12:00:00Z' },
      },
    },
  })
  async checkHealth(): Promise<{
    status: string;
    available: boolean;
    message: string;
    timestamp: string;
  }> {
    return this.audioOrderProcessingService.checkServiceHealth();
  }
}