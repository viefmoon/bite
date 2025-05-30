import { IBaseRepository } from '../domain/repositories/base.repository';
import { NullableType } from '../../utils/types/nullable.type';
import { NotFoundException } from '@nestjs/common'; 

export abstract class BaseCrudService<
  D extends { id: unknown },
  CreateDto,
  UpdateDto,
  FilterDto = Partial<D>,
> {
  protected constructor(
    protected readonly repo: IBaseRepository<D, FilterDto, CreateDto, UpdateDto>,
  ) {}

  async create(dto: CreateDto): Promise<D> {
    return this.repo.create(dto);
  }

  async findAll(filter?: FilterDto): Promise<D[]> {
    return this.repo.findAll(filter);
  }

  async findOne(id: D['id']): Promise<D> {
    const entity = await this.repo.findById(id);
    if (!entity) {
      // Lanzar NotFoundException si la entidad no se encuentra
      throw new NotFoundException(`${this.constructor.name.replace('Service', '')} with ID ${id} not found`);
    }
    return entity;
  }

  async update(id: D['id'], dto: UpdateDto): Promise<NullableType<D>> {
    // Podrías añadir una verificación aquí para lanzar NotFound si findById(id) es null antes de llamar a update
    return this.repo.update(id, dto);
  }

  async remove(id: D['id']): Promise<void> {
    // Podrías añadir una verificación aquí para lanzar NotFound si findById(id) es null antes de llamar a remove
    await this.repo.remove(id);
  }
}