import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileEntity } from './entities/file.entity';
import { FileRelationalRepository } from './repositories/file.repository';
import { FileMapper } from './mappers/file.mapper';
import { FILE_REPOSITORY } from '../../../../common/tokens';

@Module({
  imports: [TypeOrmModule.forFeature([FileEntity])],
  providers: [
    {
      provide: FILE_REPOSITORY,
      useClass: FileRelationalRepository,
    },
    FileMapper,
  ],
  exports: [FILE_REPOSITORY, FileMapper],
})
export class RelationalFilePersistenceModule {}
