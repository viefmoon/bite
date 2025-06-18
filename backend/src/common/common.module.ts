import { Module, Global } from '@nestjs/common';
import { UserContextService } from './services/user-context.service';
import { CustomIdService } from './services/custom-id.service';

@Global()
@Module({
  providers: [UserContextService, CustomIdService],
  exports: [UserContextService, CustomIdService],
})
export class CommonModule {}
