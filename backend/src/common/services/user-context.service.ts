import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface UserContext {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

@Injectable()
export class UserContextService {
  private asyncLocalStorage = new AsyncLocalStorage<UserContext>();

  /**
   * Ejecuta una función con un contexto de usuario específico
   */
  async runWithUser<T>(user: UserContext, fn: () => Promise<T>): Promise<T> {
    return this.asyncLocalStorage.run(user, fn);
  }

  /**
   * Obtiene el usuario actual del contexto
   */
  getCurrentUser(): UserContext | undefined {
    return this.asyncLocalStorage.getStore();
  }

  /**
   * Obtiene el ID del usuario actual
   */
  getCurrentUserId(): string | undefined {
    const user = this.getCurrentUser();
    return user?.userId;
  }
}
