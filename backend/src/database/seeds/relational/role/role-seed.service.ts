import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleEntity } from '../../../../roles/infrastructure/persistence/relational/entities/role.entity';
import { RoleEnum } from '../../../../roles/roles.enum';

@Injectable()
export class RoleSeedService {
  constructor(
    @InjectRepository(RoleEntity)
    private repository: Repository<RoleEntity>,
  ) {}

  async run() {
    const roles = [
      { id: RoleEnum.admin, name: 'Admin' },
      { id: RoleEnum.manager, name: 'Manager' },
      { id: RoleEnum.cashier, name: 'Cashier' },
      { id: RoleEnum.waiter, name: 'Waiter' },
      { id: RoleEnum.kitchen, name: 'Kitchen' },
      { id: RoleEnum.delivery, name: 'Delivery' },
    ];

    console.log('Starting role seeding...');
    console.log('Roles to seed:', roles);

    for (const role of roles) {
      console.log(`Checking role ${role.name} with id ${role.id}...`);
      const count = await this.repository.count({
        where: { id: role.id },
      });
      console.log(`Count for role ${role.name}: ${count}`);

      if (!count) {
        try {
          await this.repository.save(
            this.repository.create(role),
          );
          console.log(`✅ Role ${role.name} created successfully`);
        } catch (error) {
          console.error(`❌ Error creating role ${role.name}:`, error);
        }
      } else {
        console.log(`ℹ️ Role ${role.name} already exists`);
      }
    }
    
    // Verificar todos los roles al final
    const allRoles = await this.repository.find();
    console.log('All roles in database:', allRoles);
  }
}
