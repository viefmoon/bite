import { ApiProperty } from '@nestjs/swagger';

export class Paginated<T> {
  @ApiProperty({ isArray: true })
  items: T[];

  @ApiProperty({ type: Number, example: 100 })
  total: number;

  @ApiProperty({ type: Number, example: 1 })
  page: number;

  @ApiProperty({ type: Number, example: 10 })
  limit: number;

  @ApiProperty({ type: Boolean })
  hasNextPage: boolean;

  @ApiProperty({ type: Boolean })
  hasPrevPage: boolean;

  constructor(items: T[], total: number, page: number, limit: number) {
    this.items = items;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.hasNextPage = page * limit < total;
    this.hasPrevPage = page > 1;
  }
}