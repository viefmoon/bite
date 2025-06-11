import { ApiError } from './errors';
import { ERROR_CODES, ApiErrorCode } from '../constants/apiErrorCodes';
import { AxiosError } from 'axios';

const errorCodeMessages: { [key in ApiErrorCode | string]?: string } = {
  // Errores de autenticación
  [ERROR_CODES.AUTH_INVALID_CREDENTIALS]:
    'El correo/usuario o la contraseña son incorrectos.',
  [ERROR_CODES.AUTH_INCORRECT_PASSWORD]: 'La contraseña es incorrecta.',
  [ERROR_CODES.AUTH_DUPLICATE_EMAIL]:
    'Este correo electrónico ya está registrado. Intenta iniciar sesión.',
  [ERROR_CODES.AUTH_DUPLICATE_USERNAME]:
    'Este nombre de usuario ya está en uso. Elige otro.',
  [ERROR_CODES.AUTH_UNAUTHORIZED]:
    'No autorizado. Por favor, inicia sesión de nuevo.',
  [ERROR_CODES.AUTH_FORBIDDEN]: 'No tienes permiso para realizar esta acción.',
  [ERROR_CODES.REFRESH_FAILED]:
    'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',

  // Errores de validación
  [ERROR_CODES.VALIDATION_ERROR]: 'Por favor, revisa la información ingresada.',

  // Errores de recursos
  [ERROR_CODES.RESOURCE_NOT_FOUND]: 'El recurso solicitado no se encontró.',
  [ERROR_CODES.CONFLICT_ERROR]: 'Hubo un conflicto al procesar tu solicitud.',
  [ERROR_CODES.PRODUCT_NAME_EXISTS]:
    'Ya existe un producto con ese nombre. Por favor, elige otro nombre.',

  // Errores de red y servidor
  [ERROR_CODES.NETWORK_ERROR]:
    'Error de red. Verifica tu conexión e inténtalo de nuevo.',
  [ERROR_CODES.API_CLIENT_ERROR]: 'Error al comunicar con el servidor.',
  [ERROR_CODES.INTERNAL_SERVER_ERROR]:
    'Ocurrió un error en el servidor. Inténtalo de nuevo más tarde.',
  [ERROR_CODES.UNKNOWN_API_ERROR]:
    'Ocurrió un error inesperado al procesar tu solicitud.',
  [ERROR_CODES.UNKNOWN_ERROR]: 'Ocurrió un error desconocido.',

  // Mensajes por código de estado HTTP
  [`status_400`]: 'La solicitud contiene datos inválidos.',
  [`status_401`]: 'No autorizado. Por favor, inicia sesión de nuevo.',
  [`status_403`]: 'No tienes permiso para realizar esta acción.',
  [`status_404`]: 'El recurso solicitado no se encontró.',
  [`status_409`]: 'Existe un conflicto con el estado actual del recurso.',
  [`status_422`]: 'Los datos enviados son inválidos o incompletos.',
  [`status_500`]: 'Error interno del servidor. Por favor, intenta más tarde.',
  [`status_502`]: 'Error de conexión con el servidor.',
  [`status_503`]: 'El servicio no está disponible temporalmente.',

  // Códigos específicos del backend - Autenticación
  AUTH_USER_NOT_FOUND: 'Usuario no encontrado.',
  AUTH_EMAIL_NOT_CONFIRMED:
    'Por favor, confirma tu correo electrónico antes de iniciar sesión.',
  AUTH_ACCOUNT_LOCKED:
    'Tu cuenta ha sido bloqueada. Contacta al administrador.',
  AUTH_SESSION_EXPIRED:
    'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',

  // Códigos específicos del backend - Validación
  VALIDATION_FAILED: 'Error de validación. Revisa los datos ingresados.',
  DUPLICATE_ENTRY: 'Ya existe un registro con estos datos.',
  INVALID_INPUT: 'Los datos ingresados no son válidos.',
  MISSING_REQUIRED_FIELD: 'Faltan campos obligatorios.',

  // Códigos específicos del backend - Permisos
  INSUFFICIENT_PERMISSIONS:
    'No tienes permisos suficientes para realizar esta acción.',
  RATE_LIMIT_EXCEEDED:
    'Has realizado demasiadas solicitudes. Intenta más tarde.',

  // Códigos específicos del backend - Órdenes
  ORDER_NOT_FOUND: 'La orden no fue encontrada.',
  ORDER_ALREADY_COMPLETED: 'Esta orden ya fue completada.',
  ORDER_CANNOT_BE_MODIFIED:
    'Esta orden no puede ser modificada en su estado actual.',
  TABLE_ALREADY_OCCUPIED: 'La mesa seleccionada ya está ocupada.',
  INVALID_ORDER_TYPE: 'Tipo de orden inválido.',
  NO_ITEMS_IN_ORDER: 'La orden debe contener al menos un producto.',

  // Códigos específicos del backend - Productos
  PRODUCT_NOT_FOUND: 'El producto no fue encontrado.',
  PRODUCT_NOT_AVAILABLE: 'El producto no está disponible en este momento.',
  PRODUCT_OUT_OF_STOCK: 'El producto está agotado.',
  INVALID_PRODUCT_VARIANT: 'La variante del producto no es válida.',
  INVALID_MODIFIER: 'El modificador seleccionado no es válido.',

  // Códigos específicos del backend - Mesas y Áreas
  TABLE_NOT_FOUND: 'La mesa no fue encontrada.',
  AREA_NOT_FOUND: 'El área no fue encontrada.',
  TABLE_IN_USE: 'La mesa está siendo utilizada en otra orden.',

  // Códigos específicos del backend - Impresoras
  PRINTER_NOT_FOUND: 'La impresora no fue encontrada.',
  PRINTER_OFFLINE: 'La impresora no está disponible.',
  PRINT_FAILED: 'Error al imprimir. Verifica la conexión de la impresora.',

  // Códigos específicos del backend - Categorías
  CATEGORY_NOT_FOUND: 'La categoría no fue encontrada.',
  SUBCATEGORY_NOT_FOUND: 'La subcategoría no fue encontrada.',
  CATEGORY_HAS_PRODUCTS:
    'No se puede eliminar la categoría porque tiene productos asociados.',

  // Errores de archivos
  [ERROR_CODES.UPLOAD_FAILED]:
    'Error al subir el archivo. Por favor, intenta nuevamente.',
  [ERROR_CODES.FILE_TOO_LARGE]:
    'El archivo es demasiado grande. El tamaño máximo permitido es 10MB.',
  cantUploadFileType:
    'El tipo de archivo no está permitido. Solo se permiten imágenes (JPG, JPEG, PNG, GIF).',
};

export function getApiErrorMessage(error: unknown): string {
  const defaultMessage = 'Ocurrió un error inesperado.';

  if (error instanceof ApiError) {
    // Primero intentamos con el código específico
    let message = errorCodeMessages[error.code];

    // Si no hay mensaje para el código, intentamos con el código de estado
    if (!message) {
      message = errorCodeMessages[`status_${error.status}`];
    }

    // Si aún no hay mensaje y tenemos un mensaje original del backend, lo usamos
    if (
      !message &&
      error.originalMessage &&
      error.code !== ERROR_CODES.UNKNOWN_API_ERROR
    ) {
      message = error.originalMessage;
    }

    return message || defaultMessage;
  } else if (error instanceof AxiosError) {
    if (error.message === 'Network Error' || !error.response) {
      return errorCodeMessages[ERROR_CODES.NETWORK_ERROR] || 'Error de red.';
    }
    if (error.response?.status) {
      const statusMessage =
        errorCodeMessages[`status_${error.response.status}`];
      if (statusMessage) return statusMessage;
    }
    return errorCodeMessages[ERROR_CODES.UNKNOWN_API_ERROR] || defaultMessage;
  } else if (error instanceof Error) {
    if (
      error.message.toLowerCase().includes('network request failed') ||
      error.message.toLowerCase().includes('failed to fetch')
    ) {
      return errorCodeMessages[ERROR_CODES.NETWORK_ERROR] || 'Error de red.';
    }
    return error.message && !error.message.toLowerCase().includes('undefined')
      ? error.message
      : defaultMessage;
  } else {
    return defaultMessage;
  }
}
