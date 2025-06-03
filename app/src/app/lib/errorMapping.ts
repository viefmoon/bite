import { ApiError } from './errors';
import { ERROR_CODES, ApiErrorCode } from '../constants/apiErrorCodes';
import { AxiosError } from 'axios';

const errorCodeMessages: { [key in ApiErrorCode | string]?: string } = {
  [ERROR_CODES.AUTH_INVALID_CREDENTIALS]: "El correo/usuario o la contraseña son incorrectos.",
  [ERROR_CODES.AUTH_INCORRECT_PASSWORD]: "La contraseña es incorrecta.",
  [ERROR_CODES.AUTH_DUPLICATE_EMAIL]: "Este correo electrónico ya está registrado. Intenta iniciar sesión.",
  [ERROR_CODES.AUTH_DUPLICATE_USERNAME]: "Este nombre de usuario ya está en uso. Elige otro.",
  [ERROR_CODES.VALIDATION_ERROR]: "Por favor, revisa la información ingresada.",
  [ERROR_CODES.RESOURCE_NOT_FOUND]: "El recurso solicitado no se encontró.",
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: "Ocurrió un error en el servidor. Inténtalo de nuevo más tarde.",
  [ERROR_CODES.NETWORK_ERROR]: "Error de red. Verifica tu conexión e inténtalo de nuevo.",
  [ERROR_CODES.API_CLIENT_ERROR]: "Error al comunicar con el servidor.",
  [ERROR_CODES.AUTH_UNAUTHORIZED]: "No autorizado. Por favor, inicia sesión de nuevo.",
  [ERROR_CODES.AUTH_FORBIDDEN]: "No tienes permiso para realizar esta acción.",
  [ERROR_CODES.CONFLICT_ERROR]: "Hubo un conflicto al procesar tu solicitud.",
  [ERROR_CODES.UNKNOWN_API_ERROR]: "Ocurrió un error inesperado al procesar tu solicitud.",
  [ERROR_CODES.UNKNOWN_ERROR]: "Ocurrió un error desconocido.",
  [`status_401`]: "No autorizado. Por favor, inicia sesión de nuevo.",
  [`status_403`]: "No tienes permiso para realizar esta acción.",
  [`status_404`]: "No encontrado.",
  [`status_422`]: "Los datos enviados son inválidos o incompletos.",
  [`status_500`]: "Error interno del servidor.",
};

export function getApiErrorMessage(error: unknown): string {
  const defaultMessage = "Ocurrió un error inesperado.";

  if (error instanceof ApiError) {
    let message = errorCodeMessages[error.code];

    if (!message) {
      message = errorCodeMessages[`status_${error.status}`];
    }

    if (!message && error.originalMessage && error.code !== ERROR_CODES.UNKNOWN_API_ERROR) {
       message = error.originalMessage;
    }

    return message || defaultMessage;

  } else if (error instanceof AxiosError) {
    if (error.message === 'Network Error' || !error.response) {
      return errorCodeMessages[ERROR_CODES.NETWORK_ERROR] || "Error de red.";
    }
    if (error.response?.status) {
        const statusMessage = errorCodeMessages[`status_${error.response.status}`];
        if (statusMessage) return statusMessage;
    }
    return errorCodeMessages[ERROR_CODES.UNKNOWN_API_ERROR] || defaultMessage;

  } else if (error instanceof Error) {
     if (error.message.toLowerCase().includes('network request failed') ||
         error.message.toLowerCase().includes('failed to fetch')) {
       return errorCodeMessages[ERROR_CODES.NETWORK_ERROR] || "Error de red.";
     }
     return error.message && !error.message.toLowerCase().includes('undefined')
            ? error.message
            : defaultMessage;
  } else {
    return defaultMessage;
  }
}

