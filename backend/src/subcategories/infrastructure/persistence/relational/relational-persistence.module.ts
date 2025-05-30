import { Module, forwardRef } from '@nestjs/common'; // Importar forwardRef
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubcategoryEntity } from './entities/subcategory.entity';
import { SubcategoriesRelationalRepository } from './repositories/subcategories.repository';
import { SubcategoryMapper } from './mappers/subcategory.mapper';
import { SUBCATEGORY_REPOSITORY } from '../../../../common/tokens';
import { CategoriesRelationalPersistenceModule } from '../../../../categories/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalFilePersistenceModule } from '../../../../files/infrastructure/persistence/relational/relational-persistence.module'; // Importar File Module
import { RelationalProductPersistenceModule } from '../../../../products/infrastructure/persistence/relational/relational-persistence.module'; // Importar Product Module

@Module({
  imports: [
    TypeOrmModule.forFeature([SubcategoryEntity]),
    forwardRef(() => CategoriesRelationalPersistenceModule),
    forwardRef(() => RelationalFilePersistenceModule),
    forwardRef(() => RelationalProductPersistenceModule),
  ],
  providers: [
    SubcategoryMapper,
    {
      provide: SUBCATEGORY_REPOSITORY,
      useClass: SubcategoriesRelationalRepository,
    },
  ],
  exports: [SUBCATEGORY_REPOSITORY, SubcategoryMapper],
})
export class RelationalSubcategoryPersistenceModule {}
