import { RestaurantConfig } from '../../domain/restaurant-config';

export abstract class RestaurantConfigRepository {
  abstract findFirst(): Promise<RestaurantConfig | null>;

  abstract create(data: RestaurantConfig): Promise<RestaurantConfig>;

  abstract update(
    id: string,
    data: Partial<RestaurantConfig>,
  ): Promise<RestaurantConfig | null>;
}
