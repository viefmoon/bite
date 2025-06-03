/**
 * Constantes para las claves utilizadas en el almacenamiento seguro (EncryptedStorage).
 */
export const STORAGE_KEYS = {
  /** Clave para almacenar las credenciales del usuario (email/username y password) en formato JSON string. */
  REMEMBERED_CREDENTIALS: 'user_credentials',

  /** Clave para almacenar la preferencia del usuario sobre si desea ser recordado ('true' o 'false'). */
  REMEMBER_ME_ENABLED: 'remember_me_preference',

  /** Clave existente para el token de autenticación. */
  AUTH_TOKEN: 'auth_token',
} as const;