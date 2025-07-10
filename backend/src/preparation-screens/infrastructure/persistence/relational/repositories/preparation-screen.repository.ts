import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PreparationScreenEntity } from '../entities/preparation-screen.entity';
import { PreparationScreenRepository } from '../../preparation-screen.repository';
import { PreparationScreen } from '../../../../domain/preparation-screen';
import { PreparationScreenMapper } from '../mappers/preparation-screen.mapper';
import { Paginated } from '../../../../../common/types/paginated.type';
import { UserAssignmentDto } from '../../../../dto/assign-users.dto';

@Injectable()
export class PreparationScreensRelationalRepository
  implements PreparationScreenRepository
{
  constructor(
    @InjectRepository(PreparationScreenEntity)
    private readonly preparationScreenRepository: Repository<PreparationScreenEntity>,
    private readonly preparationScreenMapper: PreparationScreenMapper,
  ) {}

  async create(data: PreparationScreen): Promise<PreparationScreen> {
    const entity = this.preparationScreenMapper.toEntity(data);
    if (!entity) {
      throw new InternalServerErrorException(
        'Error creating preparation screen entity',
      );
    }
    const savedEntity = await this.preparationScreenRepository.save(entity);
    const domainResult = this.preparationScreenMapper.toDomain(savedEntity);
    if (!domainResult) {
      throw new InternalServerErrorException(
        'Error mapping saved preparation screen entity to domain',
      );
    }
    return domainResult;
  }

  async findOne(id: string): Promise<PreparationScreen> {
    const entity = await this.preparationScreenRepository.findOne({
      where: { id },
      relations: ['products', 'users', 'users.role'],
    });

    if (!entity) {
      throw new NotFoundException(`Preparation screen with ID ${id} not found`);
    }

    const domainResult = this.preparationScreenMapper.toDomain(entity);
    if (!domainResult) {
      throw new InternalServerErrorException(
        'Error mapping preparation screen entity to domain',
      );
    }
    return domainResult;
  }

  async findAll(options?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
  }): Promise<Paginated<PreparationScreen>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.preparationScreenRepository
      .createQueryBuilder('preparationScreen')
      .leftJoinAndSelect('preparationScreen.products', 'products')
      .leftJoinAndSelect('preparationScreen.users', 'users')
      .leftJoinAndSelect('users.role', 'role')
      .skip(skip)
      .take(limit)
      .orderBy('preparationScreen.name', 'ASC');

    if (options?.isActive !== undefined) {
      queryBuilder.andWhere('preparationScreen.isActive = :isActive', {
        isActive: options.isActive,
      });
    }

    const [entities, count] = await queryBuilder.getManyAndCount();

    const domainResults = entities
      .map((entity) => this.preparationScreenMapper.toDomain(entity))
      .filter((item): item is PreparationScreen => item !== null);

    return new Paginated(domainResults, count, page, limit);
  }

  async update(
    id: string,
    data: PreparationScreen,
  ): Promise<PreparationScreen> {
    const entity = this.preparationScreenMapper.toEntity(data);
    if (!entity) {
      throw new InternalServerErrorException(
        'Error creating preparation screen entity for update',
      );
    }

    await this.preparationScreenRepository.update(id, entity);

    const updatedEntity = await this.preparationScreenRepository.findOne({
      where: { id },
      relations: ['products'],
    });

    if (!updatedEntity) {
      throw new NotFoundException(`Preparation screen with ID ${id} not found`);
    }

    const domainResult = this.preparationScreenMapper.toDomain(updatedEntity);
    if (!domainResult) {
      throw new InternalServerErrorException(
        'Error mapping updated preparation screen entity to domain',
      );
    }

    return domainResult;
  }

  async softDelete(id: string): Promise<void> {
    const result = await this.preparationScreenRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Preparation screen with ID ${id} not found`);
    }
  }

  async findByIds(ids: string[]): Promise<PreparationScreen[]> {
    if (!ids || ids.length === 0) {
      return [];
    }

    const entities = await this.preparationScreenRepository.find({
      where: { id: In(ids) },
      relations: ['products'],
    });

    const domainResults = entities
      .map((entity) => this.preparationScreenMapper.toDomain(entity))
      .filter((item): item is PreparationScreen => item !== null);

    return domainResults;
  }

  // Métodos simplificados ya que ahora la relación se maneja desde User
  async getUsersByScreenId(screenId: string): Promise<any[]> {
    const screen = await this.preparationScreenRepository.findOne({
      where: { id: screenId },
      relations: ['users', 'users.role'],
    });

    if (!screen) return [];

    return (
      screen.users?.map((user) => ({
        userId: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      })) || []
    );
  }

  async assignUsers(
    screenId: string,
    userAssignments: UserAssignmentDto[],
  ): Promise<void> {
    // Este método ya no se usa, la asignación se hace desde UserRepository
    throw new Error('Use UserRepository.updatePreparationScreen instead');
  }

  async getUsers(screenId: string): Promise<any[]> {
    return this.getUsersByScreenId(screenId);
  }

  async removeUsers(screenId: string, userIds: string[]): Promise<void> {
    // Este método ya no se usa, la desasignación se hace desde UserRepository
    throw new Error('Use UserRepository.updatePreparationScreen instead');
  }
}
