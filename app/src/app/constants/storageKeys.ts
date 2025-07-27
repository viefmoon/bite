/**
 * Constantes para las claves utilizadas en el almacenamiento seguro (EncryptedStorage).
 */
export const STORAGE_KEYS = {
  /** Clave para almacenar las credenciales del usuario (email/username y password) en formato JSON string. */
  REMEMBERED_CREDENTIALS: 'user_credentials',

  /** Clave para almacenar la preferencia del usuario sobre si desea ser recordado ('true' o 'false'). */
  REMEMBER_ME_ENABLED: 'remember_me_preference',

  /** Clave para el token de autenticación. */
  AUTH_TOKEN: 'auth_token',

  /** Clave para el refresh token. */
  REFRESH_TOKEN: 'refresh_token',

  /** Clave para la información del usuario. */
  USER_INFO: 'user_info',

  /** Clave para las preferencias de filtros de cocina. */
  KITCHEN_FILTERS_PREFERENCES: 'kitchen_filters_preferences',

  /** Clave para la preferencia de tema de la aplicación. */
  THEME_PREFERENCE: 'app_theme_preference',

  /** Clave para la última URL conocida del API. */
  LAST_KNOWN_API_URL: 'last_known_api_url',

  /** Clave para el modo de conexión. */
  CONNECTION_MODE: 'connection_mode',

  /** Clave para la URL manual del servidor. */
  MANUAL_URL: 'manual_url',
} as const;
