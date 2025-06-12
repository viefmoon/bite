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
  ) {}

  async findFirst(): Promise<RestaurantConfig | null> {
    const entity = await this.restaurantConfigRepository.findOne({
      where: {},
      order: { createdAt: 'ASC' },
    });

    return entity ? RestaurantConfigMapper.toDomain(entity) : null;
  }

  async create(data: RestaurantConfig): Promise<RestaurantConfig> {
    const persistenceModel = RestaurantConfigMapper.toPersistence(data);
    const newEntity = await this.restaurantConfigRepository.save(
      this.restaurantConfigRepository.create(persistenceModel),
    );
    return RestaurantConfigMapper.toDomain(newEntity);
  }

  async update(
    id: string,
    data: Partial<RestaurantConfig>,
  ): Promise<RestaurantConfig | null> {
    await this.restaurantConfigRepository.update(id, data);

    const entity = await this.restaurantConfigRepository.findOne({
      where: { id },
    });

    return entity ? RestaurantConfigMapper.toDomain(entity) : null;
  }
}
