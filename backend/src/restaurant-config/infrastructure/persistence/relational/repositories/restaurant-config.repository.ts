import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RestaurantConfigEntity } from '../entities/restaurant-config.entity';
import { BusinessHoursEntity } from '../entities/business-hours.entity';
import { RestaurantConfigRepository } from '../../restaurant-config.repository';
import { RestaurantConfig } from '../../../../domain/restaurant-config';
import { RestaurantConfigMapper } from '../mappers/restaurant-config.mapper';

@Injectable()
export class RestaurantConfigRelationalRepository
  implements RestaurantConfigRepository
{
  constructor(
    @InjectRepository(RestaurantConfigEntity)
    private readonly restaurantConfigRepository: Repository<RestaurantConfigEntity>,
    @InjectRepository(BusinessHoursEntity)
    private readonly businessHoursRepository: Repository<BusinessHoursEntity>,
    private readonly restaurantConfigMapper: RestaurantConfigMapper,
  ) {}

  async findFirst(): Promise<RestaurantConfig | null> {
    const entity = await this.restaurantConfigRepository.findOne({
      where: {},
      order: { createdAt: 'ASC' },
      relations: ['businessHours'],
    });

    return entity ? this.restaurantConfigMapper.toDomain(entity) : null;
  }

  async create(data: RestaurantConfig): Promise<RestaurantConfig> {
    const persistenceModel = this.restaurantConfigMapper.toPersistence(data);
    const newEntity = await this.restaurantConfigRepository.save(
      this.restaurantConfigRepository.create(persistenceModel),
    );

    // Recargar con relaciones
    const entityWithRelations = await this.restaurantConfigRepository.findOne({
      where: { id: newEntity.id },
      relations: ['businessHours'],
    });

    return this.restaurantConfigMapper.toDomain(entityWithRelations!);
  }

  async update(
    id: string,
    data: Partial<RestaurantConfig>,
  ): Promise<RestaurantConfig | null> {
    // Separar businessHours del resto de los datos
    const { businessHours, ...updateData } = data;

    // Actualizar solo los campos que no son relaciones
    if (Object.keys(updateData).length > 0) {
      await this.restaurantConfigRepository.update(id, updateData);
    }

    // Actualizar businessHours si se proporcionaron
    if (businessHours && businessHours.length > 0) {
      // Eliminar los horarios existentes
      await this.businessHoursRepository.delete({ restaurantConfigId: id });

      // Crear los nuevos horarios
      const newBusinessHours = businessHours.map(hour => 
        this.businessHoursRepository.create({
          ...hour,
          restaurantConfigId: id,
        })
      );
      
      await this.businessHoursRepository.save(newBusinessHours);
    }

    const entity = await this.restaurantConfigRepository.findOne({
      where: { id },
      relations: ['businessHours'],
    });

    return entity ? this.restaurantConfigMapper.toDomain(entity) : null;
  }
}
