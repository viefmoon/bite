import { Module } from '@nestjs/common';
import { ProductModifiersService } from './product-modifiers.service';
import { ProductModifiersController } from './product-modifiers.controller';
import { RelationalProductModifierPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [RelationalProductModifierPersistenceModule, CommonModule],
  controllers: [ProductModifiersController],
  providers: [ProductModifiersService],
  exports: [ProductModifiersService],
})
export class ProductModifiersModule {}
