import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RestaurantConfigEntity } from '../../../../restaurant-config/infrastructure/persistence/relational/entities/restaurant-config.entity';
import { BusinessHoursEntity } from '../../../../restaurant-config/infrastructure/persistence/relational/entities/business-hours.entity';

@Injectable()
export class RestaurantConfigSeedService {
  constructor(
    @InjectRepository(RestaurantConfigEntity)
    private repository: Repository<RestaurantConfigEntity>,
    @InjectRepository(BusinessHoursEntity)
    private businessHoursRepository: Repository<BusinessHoursEntity>,
  ) {}

  async run() {
    const countConfig = await this.repository.count();

    if (!countConfig) {
      // Crear configuración del restaurante
      const restaurantConfig = await this.repository.save(
        this.repository.create({
          restaurantName: 'La Leña',
          phoneMain: '3919160126',
          phoneSecondary: '3338423316',
          address: 'C. Ogazón Sur 36, Centro',
          city: 'Tototlán',
          state: 'Jalisco',
          postalCode: '47730',
          country: 'México',
          acceptingOrders: true,
          estimatedPickupTime: 20,
          estimatedDeliveryTime: 40,
          estimatedDineInTime: 30,
          openingGracePeriod: 30,
          closingGracePeriod: 30,
          timeZone: 'America/Mexico_City',
          deliveryCoverageArea: [
            { lat: 20.552083014344916, lng: -102.80691765951832 },
            { lat: 20.533011128610994, lng: -102.80691765951832 },
            { lat: 20.533011128610994, lng: -102.78047795060189 },
            { lat: 20.552083014344916, lng: -102.78047795060189 },
            { lat: 20.552083014344916, lng: -102.80691765951832 },
          ],
        }),
      );

      // Crear horarios de negocio
      const businessHours = [
        {
          dayOfWeek: 0,
          openingTime: '14:00',
          closingTime: '21:00',
          isClosed: false,
        }, // Domingo
        {
          dayOfWeek: 1,
          openingTime: '04:00',
          closingTime: '23:00',
          isClosed: false,
        }, // Lunes
        {
          dayOfWeek: 2,
          openingTime: '04:00',
          closingTime: '22:00',
          isClosed: false,
        }, // Martes
        {
          dayOfWeek: 3,
          openingTime: '04:00',
          closingTime: '23:00',
          isClosed: false,
        }, // Miércoles
        {
          dayOfWeek: 4,
          openingTime: '04:00',
          closingTime: '22:00',
          isClosed: false,
        }, // Jueves
        {
          dayOfWeek: 5,
          openingTime: '04:00',
          closingTime: '22:00',
          isClosed: false,
        }, // Viernes
        {
          dayOfWeek: 6,
          openingTime: '04:00',
          closingTime: '22:00',
          isClosed: false,
        }, // Sábado
      ];

      for (const hours of businessHours) {
        await this.businessHoursRepository.save(
          this.businessHoursRepository.create({
            ...hours,
            restaurantConfig: restaurantConfig,
          }),
        );
      }
    }
  }
}
