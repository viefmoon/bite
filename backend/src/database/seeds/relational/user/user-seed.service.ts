import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { RoleEnum } from '../../../../roles/roles.enum';
import { UserEntity } from '../../../../users/infrastructure/persistence/relational/entities/user.entity';

@Injectable()
export class UserSeedService {
  constructor(
    @InjectRepository(UserEntity)
    private repository: Repository<UserEntity>,
  ) {}

  async run() {
    const countAdmin = await this.repository.count({
      where: {
        role: {
          id: RoleEnum.admin,
        },
      },
    });

    if (!countAdmin) {
      const salt = await bcrypt.genSalt();
      const password = await bcrypt.hash('secret', salt);

      await this.repository.save(
        this.repository.create({
          firstName: 'Super',
          lastName: 'Admin',
          email: 'admin@example.com',
          username: 'admin',
          password,
          role: {
            id: RoleEnum.admin,
            name: 'Admin',
          },
          isActive: true,
        }),
      );
    }

    const countManager = await this.repository.count({
      where: {
        role: {
          id: RoleEnum.manager,
        },
      },
    });

    if (!countManager) {
      const salt = await bcrypt.genSalt();
      const password = await bcrypt.hash('secret', salt);

      await this.repository.save(
        this.repository.create({
          firstName: 'John',
          lastName: 'Manager',
          email: 'manager@example.com',
          username: 'manager',
          password,
          role: {
            id: RoleEnum.manager,
            name: 'Manager',
          },
          isActive: true,
        }),
      );
    }
  }
}
