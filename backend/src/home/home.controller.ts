import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { HomeService } from './home.service';

@ApiTags('Home')
@Controller({
  path: '/',
  version: '1',
})
export class HomeController {
  constructor(private service: HomeService) {}

  @Get()
  appInfo() {
    return this.service.appInfo();
  }
}
