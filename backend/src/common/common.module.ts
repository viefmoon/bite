import { Module, Global } from '@nestjs/common';
import { UserContextService } from './services/user-context.service';

@Global()
@Module({
  providers: [UserContextService],
  exports: [UserContextService],
})
export class CommonModule {}
