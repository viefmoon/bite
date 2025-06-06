import { ConflictException } from '@nestjs/common';

export class CustomConflictException extends ConflictException {
  constructor(message: string, code: string) {
    super({
      message,
      code,
    });
  }
}