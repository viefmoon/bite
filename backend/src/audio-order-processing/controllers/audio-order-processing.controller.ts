import {
  Controller,
  Post,
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
}