import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseArrayPipe,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { RolesGuard } from '../roles/roles.guard';
import { ThermalPrintersService } from './thermal-printers.service';
import { CreateThermalPrinterDto } from './dto/create-thermal-printer.dto';
import { UpdateThermalPrinterDto } from './dto/update-thermal-printer.dto';
import { FindAllThermalPrintersDto } from './dto/find-all-thermal-printers.dto';
import { DiscoveryService } from './discovery.service';
import { DiscoveredPrinterDto } from './dto/discovered-printer.dto';
import { ThermalPrinter } from './domain/thermal-printer';
import { InfinityPaginationResponseDto } from '../utils/dto/infinity-pagination-response.dto';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { infinityPagination } from '../utils/infinity-pagination';

@ApiTags('Thermal Printers')
@Controller({
  path: 'thermal-printers',
  version: '1',
})
export class ThermalPrintersController {
  constructor(
    private readonly thermalPrintersService: ThermalPrintersService,
    private readonly discoveryService: DiscoveryService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una nueva impresora térmica' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Impresora creada exitosamente.',
    type: ThermalPrinter,
  })
  create(
    @Body() createThermalPrinterDto: CreateThermalPrinterDto,
  ): Promise<ThermalPrinter> {
    return this.thermalPrintersService.create(createThermalPrinterDto);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener lista paginada de impresoras térmicas' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de impresoras obtenida.',
    type: InfinityPaginationResponseDto,
  })
  async findAll(
    @Query() query: FindAllThermalPrintersDto,
  ): Promise<InfinityPaginationResponseDto<ThermalPrinter>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }
    const paginationOptions: IPaginationOptions = {
      page,
      limit,
    };
    const [data] = await this.thermalPrintersService.findAll(
      query,
      paginationOptions,
    );

    return infinityPagination(data, paginationOptions);
  }

  @Get('/discover')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Descubrir impresoras térmicas en la red (TCP Scan + ARP)',
  })
  @ApiQuery({
    name: 'scanTimeout',
    required: false,
    description: 'Timeout por puerto TCP (ms)',
    type: Number,
    example: 500,
  })
  @ApiQuery({
    name: 'maxConcurrency',
    required: false,
    description: 'Concurrencia TCP',
    type: Number,
    example: 100,
  })
  @ApiQuery({
    name: 'ports',
    required: false,
    description: 'Puertos TCP a escanear (separados por coma)',
    type: String,
    example: '9100,631,515',
  })
  @ApiQuery({
    name: 'subnet',
    required: false,
    description: 'Subred a escanear (ej: 192.168.1.0/24, auto si se omite)',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de impresoras descubiertas.',
    type: [DiscoveredPrinterDto],
  })
  async discoverPrinters(
    @Query('scanTimeout', new DefaultValuePipe(500), ParseIntPipe)
    scanTimeout?: number,
    @Query('maxConcurrency', new DefaultValuePipe(100), ParseIntPipe)
    maxConcurrency?: number,
    @Query(
      'ports',
      new DefaultValuePipe('9100,631,515'),
      new ParseArrayPipe({ items: Number, separator: ',', optional: true }),
    )
    ports?: number[],
    @Query('subnet') subnet?: string,
  ): Promise<DiscoveredPrinterDto[]> {
    const options = {
      scanTimeout,
      maxConcurrency,
      ports,
      subnet: subnet || null,
    };
    return this.discoveryService.discoverPrinters(options);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener detalles de una impresora térmica por ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Detalles de la impresora.',
    type: ThermalPrinter,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Impresora no encontrada.',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ThermalPrinter> {
    return this.thermalPrintersService.findOne(id);
  }

  @Get(':id/ping')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar conexión con una impresora térmica (ping)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resultado de la prueba de conexión.',
    schema: { example: { status: 'online' } },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Impresora no encontrada.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'La prueba de ping no aplica para este tipo de conexión.',
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'No se pudo conectar a la impresora.',
  })
  async pingPrinter(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ status: string }> {
    return this.thermalPrintersService.pingPrinter(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar una impresora térmica por ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Impresora actualizada.',
    type: ThermalPrinter,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Impresora no encontrada.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateThermalPrinterDto: UpdateThermalPrinterDto,
  ): Promise<ThermalPrinter> {
    return this.thermalPrintersService.update(id, updateThermalPrinterDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una impresora térmica por ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Impresora eliminada.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Impresora no encontrada.',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.thermalPrintersService.remove(id);
  }
}
