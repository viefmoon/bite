import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { UserContextService } from '../services/user-context.service';

@Injectable()
export class UserContextInterceptor implements NestInterceptor {
  constructor(private readonly userContextService: UserContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user) {
      // Si hay un usuario autenticado, ejecutar el handler con su contexto
      return new Observable((observer) => {
        this.userContextService
          .runWithUser(
            {
              userId: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
            },
            async () => {
              try {
                const result = await next.handle().toPromise();
                observer.next(result);
                observer.complete();
              } catch (error) {
                observer.error(error);
              }
            },
          )
          .catch((error) => observer.error(error));
      });
    }

    // Si no hay usuario, continuar normalmente
    return next.handle();
  }
}
