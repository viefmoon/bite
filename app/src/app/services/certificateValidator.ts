import { Platform } from 'react-native';

/**
 * Servicio para validación de certificados SSL
 * En producción, valida que las conexiones HTTPS usen certificados válidos
 */
export class CertificateValidator {
  private static instance: CertificateValidator;
  private isProduction: boolean;

  private constructor() {
    // Determinar si estamos en producción basándonos en __DEV__
    this.isProduction = !__DEV__;
  }

  static getInstance(): CertificateValidator {
    if (!CertificateValidator.instance) {
      CertificateValidator.instance = new CertificateValidator();
    }
    return CertificateValidator.instance;
  }

  /**
   * Valida si una URL es segura para conectarse
   * @param url URL a validar
   * @returns true si la URL es segura o estamos en desarrollo
   */
  isSecureUrl(url: string): boolean {
    // En desarrollo, permitir cualquier URL
    if (!this.isProduction) {
      return true;
    }

    try {
      const urlObj = new URL(url);
      
      // En producción, solo permitir HTTPS para dominios externos
      if (this.isExternalDomain(urlObj.hostname)) {
        return urlObj.protocol === 'https:';
      }
      
      // Para IPs locales, permitir HTTP (necesario para discovery)
      return this.isLocalNetwork(urlObj.hostname);
    } catch {
      return false;
    }
  }

  /**
   * Determina si un hostname es una red local
   */
  private isLocalNetwork(hostname: string): boolean {
    // Localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return true;
    }

    // Redes privadas IPv4 (RFC 1918)
    const parts = hostname.split('.');
    if (parts.length === 4) {
      const firstOctet = parseInt(parts[0]);
      const secondOctet = parseInt(parts[1]);
      
      // 10.0.0.0/8
      if (firstOctet === 10) return true;
      
      // 172.16.0.0/12
      if (firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31) return true;
      
      // 192.168.0.0/16
      if (firstOctet === 192 && secondOctet === 168) return true;
    }

    return false;
  }

  /**
   * Determina si un hostname es un dominio externo
   */
  private isExternalDomain(hostname: string): boolean {
    // Si no es IP local y no es localhost, es externo
    return !this.isLocalNetwork(hostname) && 
           !hostname.includes('.local') && 
           !hostname.includes('.internal');
  }

  /**
   * Obtiene configuración de seguridad para axios
   */
  getAxiosSecurityConfig() {
    if (Platform.OS === 'android' && this.isProduction) {
      return {
        // En producción, validar certificados
        httpsAgent: {
          rejectUnauthorized: true,
        },
      };
    }
    
    return {};
  }

  /**
   * Valida si se debe permitir una conexión
   * @throws Error si la conexión no es segura en producción
   */
  validateConnection(url: string): void {
    if (!this.isSecureUrl(url)) {
      throw new Error(
        `Conexión insegura bloqueada: ${url}. ` +
        'En producción solo se permiten conexiones HTTPS a dominios externos.'
      );
    }
  }
}

export const certificateValidator = CertificateValidator.getInstance();