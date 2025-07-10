import { NestFactory } from '@nestjs/core';
import { RoleSeedService } from './role/role-seed.service';
import { SeedModule } from './seed.module';
import { UserSeedService } from './user/user-seed.service';
import { RestaurantConfigSeedService } from './restaurant-config/restaurant-config-seed.service';
import { ProductSeedService } from './product/product-seed.service';
import { PreparationScreenSeedService } from './preparation-screen/preparation-screen-seed.service';
import { AreaSeedService } from './area/area-seed.service';
import { TableSeedService } from './table/table-seed.service';

const runSeed = async () => {
  const app = await NestFactory.create(SeedModule);

  // run
  await app.get(RoleSeedService).run();
  await app.get(UserSeedService).run();
  await app.get(RestaurantConfigSeedService).run();
  await app.get(PreparationScreenSeedService).run();
  await app.get(AreaSeedService).run();
  await app.get(TableSeedService).run();
  await app.get(ProductSeedService).run();

  await app.close();
};

void runSeed();
