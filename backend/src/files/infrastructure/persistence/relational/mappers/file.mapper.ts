import { Injectable } from '@nestjs/common';
import { FileType } from '../../../../domain/file';
import { FileEntity } from '../entities/file.entity';
import { BaseMapper } from '../../../../../common/mappers/base.mapper';

@Injectable()
export class FileMapper extends BaseMapper<FileEntity, FileType> {
  override toDomain(entity: FileEntity): FileType | null {
    if (!entity) return null;
    const domain = new FileType();
    domain.id = entity.id;
    domain.path = entity.path;
    return domain;
  }

  override toEntity(domain: FileType): FileEntity | null {
    if (!domain) return null;
    const entity = new FileEntity();
    entity.id = domain.id;
    entity.path = domain.path;
    return entity;
  }
}
