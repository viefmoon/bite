import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PreparationScreenEntity } from '../../../../preparation-screens/infrastructure/persistence/relational/entities/preparation-screen.entity';
import { UserEntity } from '../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { RoleEnum } from '../../../../roles/roles.enum';

@Injectable()
export class PreparationScreenSeedService {
  constructor(
    @InjectRepository(PreparationScreenEntity)
    private preparationScreenRepository: Repository<PreparationScreenEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async run() {
    // Get kitchen users
    const kitchenUsers = await this.userRepository.find({
      where: {
        role: {
          id: RoleEnum.kitchen,
        },
      },
      order: {
        username: 'ASC',
      },
    });

    if (kitchenUsers.length < 3) {
      return;
    }

    const preparationScreensData = [
      {
        name: 'Pizza',
        description: 'Pantalla de preparación para pizzas',
        user: kitchenUsers[0], // Pedro Cocinero (kitchen1)
      },
      {
        name: 'Hamburguesas',
        description: 'Pantalla de preparación para hamburguesas',
        user: kitchenUsers[1], // Rosa Chef (kitchen2)
      },
      {
        name: 'Bar',
        description: 'Pantalla de preparación para bebidas y bar',
        user: kitchenUsers[2], // Miguel Parrillero (kitchen3)
      },
    ];

    for (const screenData of preparationScreensData) {
      const existingScreen = await this.preparationScreenRepository.findOne({
        where: { name: screenData.name },
      });

      if (!existingScreen) {
        const screen = this.preparationScreenRepository.create({
          name: screenData.name,
          description: screenData.description,
          isActive: true,
          users: [screenData.user],
        });

        await this.preparationScreenRepository.save(screen);
      }
    }
  }
}
