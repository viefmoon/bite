import { Strategy } from 'passport-anonymous';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

@Injectable()
export class AnonymousStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super();
  }

  public validate(_payload: any, request: any): any {
    return request;
  }
}
