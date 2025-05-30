import { Allow } from 'class-validator';

const idType = Number;

export class Role {
  @Allow()
  id: number | string;

  @Allow()
  name: string | null;
}
