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
    // Default password for all seed users
    const salt = await bcrypt.genSalt();
    const defaultPassword = await bcrypt.hash('secret', salt);

    // Admin user
    const countAdmin = await this.repository.count({
      where: {
        role: {
          id: RoleEnum.admin,
        },
      },
    });

    if (!countAdmin) {
      await this.repository.save(
        this.repository.create({
          firstName: 'Carlos',
          lastName: 'Administrador',
          email: 'admin@example.com',
          username: 'admin',
          password: defaultPassword,
          role: {
            id: RoleEnum.admin,
            name: 'Admin',
          },
          isActive: true,
        }),
      );
    }

    // Manager user
    const countManager = await this.repository.count({
      where: {
        role: {
          id: RoleEnum.manager,
        },
      },
    });

    if (!countManager) {
      await this.repository.save(
        this.repository.create({
          firstName: 'María',
          lastName: 'Gerente',
          email: 'manager@example.com',
          username: 'manager',
          password: defaultPassword,
          role: {
            id: RoleEnum.manager,
            name: 'Manager',
          },
          isActive: true,
        }),
      );
    }

    // Cashier user
    const countCashier = await this.repository.count({
      where: {
        role: {
          id: RoleEnum.cashier,
        },
      },
    });

    if (!countCashier) {
      await this.repository.save(
        this.repository.create({
          firstName: 'Ana',
          lastName: 'Cajera',
          email: 'cashier@example.com',
          username: 'cashier',
          password: defaultPassword,
          role: {
            id: RoleEnum.cashier,
            name: 'Cashier',
          },
          isActive: true,
        }),
      );
    }

    // Waiter user
    const countWaiter = await this.repository.count({
      where: {
        role: {
          id: RoleEnum.waiter,
        },
      },
    });

    if (!countWaiter) {
      await this.repository.save(
        this.repository.create({
          firstName: 'Luis',
          lastName: 'Mesero',
          email: 'waiter@example.com',
          username: 'waiter',
          password: defaultPassword,
          role: {
            id: RoleEnum.waiter,
            name: 'Waiter',
          },
          isActive: true,
        }),
      );
    }

    // Kitchen users (3 different users)
    const countKitchen = await this.repository.count({
      where: {
        role: {
          id: RoleEnum.kitchen,
        },
      },
    });

    if (!countKitchen) {
      // Kitchen user 1
      await this.repository.save(
        this.repository.create({
          firstName: 'Pedro',
          lastName: 'Cocinero',
          email: 'kitchen1@example.com',
          username: 'kitchen1',
          password: defaultPassword,
          role: {
            id: RoleEnum.kitchen,
            name: 'Kitchen',
          },
          isActive: true,
        }),
      );

      // Kitchen user 2
      await this.repository.save(
        this.repository.create({
          firstName: 'Rosa',
          lastName: 'Chef',
          email: 'kitchen2@example.com',
          username: 'kitchen2',
          password: defaultPassword,
          role: {
            id: RoleEnum.kitchen,
            name: 'Kitchen',
          },
          isActive: true,
        }),
      );

      // Kitchen user 3
      await this.repository.save(
        this.repository.create({
          firstName: 'Miguel',
          lastName: 'Parrillero',
          email: 'kitchen3@example.com',
          username: 'kitchen3',
          password: defaultPassword,
          role: {
            id: RoleEnum.kitchen,
            name: 'Kitchen',
          },
          isActive: true,
        }),
      );
    }

    // Delivery user
    const countDelivery = await this.repository.count({
      where: {
        role: {
          id: RoleEnum.delivery,
        },
      },
    });

    if (!countDelivery) {
      await this.repository.save(
        this.repository.create({
          firstName: 'Juan',
          lastName: 'Repartidor',
          email: 'delivery@example.com',
          username: 'delivery',
          password: defaultPassword,
          role: {
            id: RoleEnum.delivery,
            name: 'Delivery',
          },
          isActive: true,
        }),
      );
    }
  }
}
