import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RestaurantConfigEntity } from '../entities/restaurant-config.entity';
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
    
    // Actualizar los campos directos
    if (Object.keys(updateData).length > 0) {
      await this.restaurantConfigRepository.update(id, updateData);
    }
    
    // TODO: Manejar actualización de businessHours si es necesario
    // Por ahora, solo retornamos la entidad actualizada
    
    const entity = await this.restaurantConfigRepository.findOne({
      where: { id },
      relations: ['businessHours'],
    });

    return entity ? this.restaurantConfigMapper.toDomain(entity) : null;
  }
}
