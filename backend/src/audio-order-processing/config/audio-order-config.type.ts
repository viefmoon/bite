export type AudioOrderConfig = {
  enabled: boolean;
  cloudApiUrl: string;
  cloudApiKey: string;
  maxAudioSizeMb: number;
  supportedFormats: string[];
  timeout: number;
};
