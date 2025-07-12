import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShiftEntity } from './entities/shift.entity';
import { ShiftRepository } from '../shift.repository';
import { ShiftRelationalRepository } from './repositories/shift.repository';
import { ShiftMapper } from './mappers/shift.mapper';
import { UsersModule } from '../../../../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([ShiftEntity]), UsersModule],
  providers: [
    {
      provide: ShiftRepository,
      useClass: ShiftRelationalRepository,
    },
    ShiftMapper,
  ],
  exports: [ShiftRepository],
})
export class RelationalShiftPersistenceModule {}
