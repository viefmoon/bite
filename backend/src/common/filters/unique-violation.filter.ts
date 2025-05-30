import { ArgumentsHost, Catch, ConflictException, ExceptionFilter, Logger, HttpStatus } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { ERROR_CODES } from '../constants/error-codes.constants'; // Asegúrate que la ruta sea correcta

// Interfaz para mejorar el tipado de la excepción de TypeORM/Postgres
interface PostgresQueryFailedError extends QueryFailedError {
  code?: string;
  constraint?: string;
  detail?: string;
}

@Catch(QueryFailedError)
export class UniqueViolationFilter implements ExceptionFilter {
  private readonly logger = new Logger(UniqueViolationFilter.name);

  catch(exception: PostgresQueryFailedError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse(); // Necesario para enviar la respuesta HTTP

    // Código de error específico de PostgreSQL para violación de UNIQUE constraint
    const PG_UNIQUE_VIOLATION_CODE = '23505';

    if (exception.code === PG_UNIQUE_VIOLATION_CODE) {
      // Mapeo de nombres de restricciones a códigos de error y mensajes
      const map: Record<string, { code: string; message: (d?: string) => string }> = {
        uq_customer_email: { // Nombre del índice/restricción para email
          code: ERROR_CODES.AUTH_DUPLICATE_EMAIL, // Usar código existente si aplica
          message: (d) => `El correo electrónico ya está registrado${d ? `: ${d}` : ''}.`,
        },
        uq_customer_phone: { // Nombre del índice/restricción para teléfono
          code: 'CUSTOMER_DUPLICATE_PHONE', // Código específico
          message: (d) => `El número de teléfono ya está registrado${d ? `: ${d}` : ''}.`,
        },
        // Añadir aquí mapeos para otras restricciones UNIQUE si es necesario
      };

      const constraint = exception.constraint;
      const meta = constraint ? map[constraint] : undefined;

      if (meta) {
        const conflictResponse = {
          statusCode: HttpStatus.CONFLICT,
          code: meta.code,
          message: meta.message(this.extractValue(exception.detail)), // Extraer valor si es posible
          // Puedes añadir más detalles si lo deseas
        };
        // Enviar la respuesta HTTP directamente
        response.status(HttpStatus.CONFLICT).json(conflictResponse);
        return; // Detener la ejecución aquí
      } else {
        // Si la restricción violada no está mapeada, lanzar un error genérico de conflicto
        this.logger.warn(`Unhandled UNIQUE constraint violation: ${constraint}`, exception.detail);
        const genericConflictResponse = {
            statusCode: HttpStatus.CONFLICT,
            code: ERROR_CODES.CONFLICT_ERROR, // Código genérico de conflicto
            message: 'Conflicto de datos: un valor único ya existe.',
            detail: `Constraint: ${constraint}`, // Incluir el nombre de la constraint para debugging
        };
        response.status(HttpStatus.CONFLICT).json(genericConflictResponse);
        return; // Detener la ejecución aquí
      }
    }

    // Si no es el error 23505, relanzar la excepción para que otros filtros la manejen
    // (Importante: Asegúrate de que AllExceptionsFilter esté registrado DESPUÉS de este filtro si quieres que capture otros errores)
    throw exception;
  }

  /**
   * Intenta extraer el valor duplicado del mensaje de detalle de Postgres.
   * Ejemplo: "Key (email)=(test@example.com) already exists." -> "test@example.com"
   */
  private extractValue(detail?: string): string | undefined {
    if (!detail) return undefined;
    // La regex busca patrones como (column_name)=(value)
    const match = detail.match(/\(([^)]+)\)=\(([^)]+)\)/);
    return match?.[2]; // El segundo grupo capturado es el valor
  }
}