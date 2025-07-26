// Configuración para Google Maps
export const GOOGLE_MAPS_CONFIG = {
  // Centro por defecto para México
  defaultCenter: {
    lat: 23.6345,
    lng: -102.5528,
  },

  // Configuración de zoom
  defaultZoom: 5,
  locationZoom: 16,

  // Opciones del mapa
  mapOptions: {
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    scaleControl: false,
    streetViewControl: false,
    rotateControl: false,
    fullscreenControl: false,
    clickableIcons: false,
  },
};
