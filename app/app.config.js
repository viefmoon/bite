export default {
  expo: {
    name: 'CloudBite',
    slug: 'cloudbite',
    version: '1.0.0',
    orientation: 'default',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'cover',
      backgroundColor: '#ffffff',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    assetBundlePatterns: ['**/*'],
    extra: {
      eas: {
        projectId: '556b2536-af8e-4b1c-8013-20f9e876d57e',
      },
    },
    plugins: [
      'expo-speech-recognition',
      'expo-audio',
      [
        'expo-build-properties',
        {
          android: {
            compileSdkVersion: 35,
            targetSdkVersion: 34,
            buildToolsVersion: '35.0.0',
            usesCleartextTraffic:
              process.env.EAS_BUILD_PROFILE !== 'production',
            newArchEnabled: true,
          },
          ios: {
            newArchEnabled: true,
          },
        },
      ],
    ],
    android: {
      permissions: [
        'android.permission.INTERNET',
        'android.permission.ACCESS_NETWORK_STATE',
        'android.permission.ACCESS_WIFI_STATE',
        'android.permission.RECORD_AUDIO',
        'android.permission.MODIFY_AUDIO_SETTINGS',
      ],
      package: 'com.viefmoon.cloudbite',
      icon: './assets/icon.png',
      supportsTablet: true,
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON
        ? './google-services.json'
        : undefined,
      networkSecurityConfig:
        './android/app/src/main/res/xml/network_security_config.xml',
    },
    ios: {
      infoPlist: {
        NSSpeechRecognitionUsageDescription:
          'Allow CloudBite to use speech recognition for voice orders.',
        NSMicrophoneUsageDescription:
          'Allow CloudBite to use the microphone for voice orders.',
      },
      bundleIdentifier: 'com.viefmoon.cloudbite',
      supportsTablet: true,
      icon: './assets/icon.png',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    owner: 'viefmoon',
  },
};
