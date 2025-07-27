export interface Country {
  code: string;
  name: string;
  prefix: string;
  flag: string;
}

// Lista de países más comunes en América
// IMPORTANTE: Ordenados con prefijos más largos primero para evitar conflictos
export const COUNTRIES: Country[] = [
  // Países con prefijos de 4 dígitos
  { code: 'DO', name: 'Rep. Dominicana', prefix: '+1809', flag: '🇩🇴' },
  { code: 'PR', name: 'Puerto Rico', prefix: '+1787', flag: '🇵🇷' },

  // Países con prefijos de 3 dígitos
  { code: 'EC', name: 'Ecuador', prefix: '+593', flag: '🇪🇨' },
  { code: 'BO', name: 'Bolivia', prefix: '+591', flag: '🇧🇴' },
  { code: 'PY', name: 'Paraguay', prefix: '+595', flag: '🇵🇾' },
  { code: 'UY', name: 'Uruguay', prefix: '+598', flag: '🇺🇾' },
  { code: 'GT', name: 'Guatemala', prefix: '+502', flag: '🇬🇹' },
  { code: 'SV', name: 'El Salvador', prefix: '+503', flag: '🇸🇻' },
  { code: 'HN', name: 'Honduras', prefix: '+504', flag: '🇭🇳' },
  { code: 'NI', name: 'Nicaragua', prefix: '+505', flag: '🇳🇮' },
  { code: 'CR', name: 'Costa Rica', prefix: '+506', flag: '🇨🇷' },
  { code: 'PA', name: 'Panamá', prefix: '+507', flag: '🇵🇦' },

  // Países con prefijos de 2 dígitos
  { code: 'MX', name: 'México', prefix: '+52', flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina', prefix: '+54', flag: '🇦🇷' },
  { code: 'BR', name: 'Brasil', prefix: '+55', flag: '🇧🇷' },
  { code: 'CL', name: 'Chile', prefix: '+56', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia', prefix: '+57', flag: '🇨🇴' },
  { code: 'PE', name: 'Perú', prefix: '+51', flag: '🇵🇪' },
  { code: 'VE', name: 'Venezuela', prefix: '+58', flag: '🇻🇪' },
  { code: 'CU', name: 'Cuba', prefix: '+53', flag: '🇨🇺' },
  { code: 'ES', name: 'España', prefix: '+34', flag: '🇪🇸' },

  // Países con prefijo de 1 dígito (al final)
  { code: 'US', name: 'Estados Unidos', prefix: '+1', flag: '🇺🇸' },
  { code: 'CA', name: 'Canadá', prefix: '+1', flag: '🇨🇦' },
];
