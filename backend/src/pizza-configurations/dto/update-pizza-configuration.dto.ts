import { PartialType } from '@nestjs/swagger';
import { CreatePizzaConfigurationDto } from './create-pizza-configuration.dto';

export class UpdatePizzaConfigurationDto extends PartialType(
  CreatePizzaConfigurationDto,
) {}