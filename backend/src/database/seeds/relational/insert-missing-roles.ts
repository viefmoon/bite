import { DataSource } from 'typeorm';
import { RoleEntity } from '../../../roles/infrastructure/persistence/relational/entities/role.entity';
import { RoleEnum } from '../../../roles/roles.enum';
import * as dotenv from 'dotenv';

dotenv.config();

async function insertMissingRoles() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'secret',
    database: process.env.DATABASE_NAME || 'nestjs-boilerplate',
    entities: [RoleEntity],
    synchronize: false,
  });

  try {
    await dataSource.initialize();

    const roleRepository = dataSource.getRepository(RoleEntity);

    const rolesToInsert = [
      { id: RoleEnum.admin, name: 'Admin' },
      { id: RoleEnum.manager, name: 'Manager' },
      { id: RoleEnum.cashier, name: 'Cashier' },
      { id: RoleEnum.waiter, name: 'Waiter' },
      { id: RoleEnum.kitchen, name: 'Kitchen' },
      { id: RoleEnum.delivery, name: 'Delivery' },
    ];

    for (const role of rolesToInsert) {
      try {
        const exists = await roleRepository.findOne({ where: { id: role.id } });
        if (!exists) {
          await roleRepository.save(role);
        } else {
        }
      } catch {}
    }

    await dataSource.destroy();
  } catch {
    process.exit(1);
  }
}

void insertMissingRoles();
