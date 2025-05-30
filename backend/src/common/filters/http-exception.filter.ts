import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ERROR_CODES } from '../constants/error-codes.constants';

// Interfaz para la respuesta de error estandarizada
interface StandardErrorResponse {
  statusCode: number;
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  path: string;
}

@Catch() // Captura todas las excepciones si no se especifica un tipo
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let code: string;
    let message: string;
    let details: any | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        // Intentar mapear el mensaje a un código si es posible, o usar uno genérico
        code = this.mapHttpExceptionToCode(exception, message);
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        // Manejar la estructura de UnprocessableEntityException de class-validator
        if (
          status === HttpStatus.UNPROCESSABLE_ENTITY &&
          (exceptionResponse as any).errors
        ) {
          code = ERROR_CODES.VALIDATION_ERROR;
          message = (exceptionResponse as any).message || 'Error de validación';
          details = (exceptionResponse as any).errors; // Usar la estructura de errores existente
        } else {
          // Intentar extraer 'code', 'message', 'details' si la excepción ya tiene una estructura similar
          code =
            (exceptionResponse as any).code ||
            this.mapHttpExceptionToCode(exception);
          message = (exceptionResponse as any).message || exception.message;
          details =
            (exceptionResponse as any).details ||
            (exceptionResponse as any).error; // Capturar detalles o error genérico
        }
      } else {
        message = exception.message;
        code = this.mapHttpExceptionToCode(exception);
      }
    } else if (exception instanceof Error) {
      // Errores inesperados del servidor
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Ocurrió un error interno en el servidor.';
      code = ERROR_CODES.INTERNAL_SERVER_ERROR;
      this.logger.error(
        `Error no controlado: ${exception.message}`,
        exception.stack,
      ); // Loguear el error completo
    } else {
      // Caso extremadamente raro: no es ni HttpException ni Error
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Ocurrió un error desconocido.';
      code = ERROR_CODES.UNKNOWN_ERROR;
      this.logger.error('Excepción desconocida capturada:', exception);
    }

    const errorResponse: StandardErrorResponse = {
      statusCode: status,
      code: code || ERROR_CODES.UNKNOWN_ERROR, // Fallback por si acaso
      message: message, // Mantener el mensaje original para logs o fallback
      details: details,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }

  // Helper para mapear excepciones HTTP estándar a códigos si no se proporciona uno
  private mapHttpExceptionToCode(
    exception: HttpException,
    specificMessage?: string,
  ): string {
    const status = exception.getStatus();
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ERROR_CODES.VALIDATION_ERROR; // O un código más específico si se puede inferir
      case HttpStatus.UNAUTHORIZED:
        return ERROR_CODES.AUTH_UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ERROR_CODES.AUTH_FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        // Podrías intentar hacer esto más específico basado en el mensaje
        if (specificMessage?.includes('not found'))
          return ERROR_CODES.RESOURCE_NOT_FOUND;
        return ERROR_CODES.RESOURCE_NOT_FOUND; // Genérico 404
      case HttpStatus.CONFLICT:
        // Podrías intentar hacer esto más específico basado en el mensaje
        if (specificMessage?.includes('already exists'))
          return ERROR_CODES.CONFLICT_ERROR;
        return ERROR_CODES.CONFLICT_ERROR; // Genérico 409
      case HttpStatus.UNPROCESSABLE_ENTITY:
        // Usualmente, el código debería venir de la lógica de negocio antes de lanzar esto
        // (ej., AUTH_DUPLICATE_EMAIL)
        return ERROR_CODES.VALIDATION_ERROR; // O un código de lógica de negocio fallida
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return ERROR_CODES.INTERNAL_SERVER_ERROR;
      default:
        return ERROR_CODES.UNKNOWN_ERROR;
    }
  }
}
