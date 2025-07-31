import { type PaymentMethod } from '../../modules/orders/schema/payment.schema';

/**
 * Constantes relacionadas con la interfaz de usuario
 */

/**
 * Blurhash por defecto para imágenes de productos y categorías
 */
export const DEFAULT_IMAGE_BLURHASH =
  '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

/**
 * Métodos de pago temporalmente deshabilitados
 */
export const DISABLED_PAYMENT_METHODS: PaymentMethod[] = ['CARD', 'TRANSFER'];
