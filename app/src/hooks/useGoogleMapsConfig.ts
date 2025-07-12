import { useState, useEffect } from 'react';
import { appConfigService } from '@/services/appConfig';
import { GOOGLE_MAPS_CONFIG } from '@/modules/customers/constants/maps.config';

export interface GoogleMapsConfigWithApiKey {
  apiKey: string;
  defaultCenter: {
    lat: number;
    lng: number;
  };
  defaultZoom: number;
  locationZoom: number;
  mapOptions: {
    disableDefaultUI: boolean;
    zoomControl: boolean;
    mapTypeControl: boolean;
    scaleControl: boolean;
    streetViewControl: boolean;
    rotateControl: boolean;
    fullscreenControl: boolean;
    clickableIcons: boolean;
  };
}

export function useGoogleMapsConfig() {
  const [config, setConfig] = useState<GoogleMapsConfigWithApiKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        const apiKey = await appConfigService.getMapsApiKey();
        setConfig({
          ...GOOGLE_MAPS_CONFIG,
          apiKey,
        });
      } catch (err) {
        setError('No se pudo cargar la configuración de mapas');
      } finally {
        setLoading(false);
      }
    }

    loadConfig();
  }, []);

  return { config, loading, error };
}