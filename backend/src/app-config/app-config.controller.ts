import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('App Config')
@Controller({
  path: 'app-config',
  version: '1',
})
export class AppConfigController {
  @Get()
  @ApiOkResponse({
    description: 'Get app configuration',
  })
  @HttpCode(HttpStatus.OK)
  getConfig() {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
    return {
      maps: {
        apiKey,
      },
    };
  }
}
