import { useState, useCallback, useRef, useEffect } from 'react';
import {
  useAudioRecorder as useExpoAudioRecorder,
  AudioModule,
  RecordingPresets,
} from 'expo-audio';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

interface UseAudioRecorderReturn {
  isRecording: boolean;
  isPreparing: boolean;
  isProcessing: boolean;
  audioUri: string | null;
  transcription: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  resetRecording: () => void;
  error: string | null;
}

export const useAudioRecorder = (): UseAudioRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Usar el hook de expo-audio con configuración de alta calidad para voz
  const audioRecorder = useExpoAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    android: {
      ...RecordingPresets.HIGH_QUALITY.android,
      extension: '.mp4',
      outputFormat: 'mpeg4',
      audioEncoder: 'aac',
      sampleRate: 16000, // Optimizado para reconocimiento de voz
      numberOfChannels: 1,
      bitRate: 64000,
    },
    ios: {
      ...RecordingPresets.HIGH_QUALITY.ios,
      extension: '.m4a',
      sampleRate: 16000,
      numberOfChannels: 1,
      bitRate: 64000,
    },
  });

  const [currentTranscription, setCurrentTranscription] = useState<string>('');
  const currentTranscriptionRef = useRef<string>('');
  const isTranscribing = useRef(false);
  const isMounted = useRef(true);

  // Verificar que el audio recorder esté listo
  useEffect(() => {
    if (audioRecorder && typeof audioRecorder.record === 'function') {
      setIsInitialized(true);
    }
  }, [audioRecorder]);

  // Estado interno para rastrear si estamos en proceso de detener
  const isStopping = useRef(false);

  // Eventos de reconocimiento de voz
  useSpeechRecognitionEvent('result', (event) => {
    if (!isMounted.current) return;

    const results = event.results;
    if (results && results.length > 0) {
      const bestResult = results[0];
      if (bestResult && bestResult.transcript) {
        const newTranscript = bestResult.transcript;
        currentTranscriptionRef.current = newTranscript;
        setCurrentTranscription(newTranscript);

        if (event.isFinal || bestResult.isFinal) {
          setTranscription(newTranscript);
        }
      }
    }
  });

  useSpeechRecognitionEvent('end', () => {
    if (!isMounted.current) return;
    isTranscribing.current = false;
  });

  const startRecording = useCallback(async () => {
    if (!isMounted.current) return;
    if (!isInitialized || !audioRecorder) {
      setError('El grabador de audio no está listo');
      return;
    }

    try {
      setError(null);
      setIsPreparing(true);
      setCurrentTranscription('');
      currentTranscriptionRef.current = '';
      setTranscription('');

      // Solicitar permisos de audio
      const audioPermission =
        await AudioModule.requestRecordingPermissionsAsync();
      if (!audioPermission.granted) {
        throw new Error('Se requiere permiso para grabar audio');
      }

      // Solicitar permisos de reconocimiento de voz
      const speechPermissions =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!speechPermissions.granted) {
        throw new Error('Se requiere permiso para reconocimiento de voz');
      }

      // Iniciar reconocimiento de voz ANTES de la grabación
      isTranscribing.current = true;
      setCurrentTranscription('');

      try {
        await ExpoSpeechRecognitionModule.start({
          lang: 'es-MX',
          interimResults: true,
          continuous: true,
          maxAlternatives: 1,
        });
      } catch (speechError) {
        // Continuar sin reconocimiento si falla
      }

      // Esperar un momento para que se establezca el reconocimiento
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Preparar y comenzar la grabación de audio
      await audioRecorder.prepareToRecordAsync();
      await audioRecorder.record();

      if (isMounted.current) {
        setIsRecording(true);
        setIsPreparing(false);
      }
    } catch (err) {
      if (isMounted.current) {
        setIsPreparing(false);
        const errorMessage =
          err instanceof Error ? err.message : 'Error al iniciar grabación';
        setError(errorMessage);
      }
    }
  }, [audioRecorder, isInitialized]);

  const stopRecording = useCallback(async () => {
    if (!isMounted.current) return;

    // Prevenir múltiples llamadas simultáneas
    if (isStopping.current) {
      return;
    }

    try {
      // Verificar si realmente está grabando
      const isCurrentlyRecording = audioRecorder.isRecording;
      if (!isCurrentlyRecording) {
        return;
      }

      isStopping.current = true;

      setIsProcessing(true);
      setIsRecording(false);

      // Primero detener el reconocimiento de voz
      if (isTranscribing.current) {
        try {
          await ExpoSpeechRecognitionModule.stop();
          // Esperar un momento para asegurar que se capture la transcripción final
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          // Error al detener reconocimiento de voz
        } finally {
          isTranscribing.current = false;
        }
      }

      // Detener grabación de audio
      let uri: string | undefined;
      try {
        await audioRecorder.stop();
        uri = audioRecorder.uri;
      } catch (audioError) {
        // Si el error es "stop failed", intentar obtener el URI de todas formas
        if (audioError?.message?.includes('stop failed')) {
          uri = audioRecorder.uri;
        } else {
          throw audioError;
        }
      }

      if (!uri) {
        throw new Error('No se pudo obtener el archivo de audio');
      }

      if (isMounted.current) {
        // Usar la transcripción que se capturó durante la grabación
        const finalTranscription =
          currentTranscriptionRef.current ||
          currentTranscription ||
          transcription ||
          '';

        if (finalTranscription) {
          setTranscription(finalTranscription);
        } else {
          setTranscription('');
        }

        // Establecer el URI del audio al final
        setAudioUri(uri);
        setIsProcessing(false);
      }
    } catch (err) {
      if (isMounted.current) {
        setIsProcessing(false);
        const errorMessage =
          err instanceof Error ? err.message : 'Error al detener grabación';
        setError(errorMessage);
      }
    } finally {
      isStopping.current = false;
    }
  }, [audioRecorder, currentTranscription, transcription]);

  const resetRecording = useCallback(() => {
    if (!isMounted.current) return;

    // Detener reconocimiento si está activo
    if (isTranscribing.current) {
      try {
        const stopPromise = ExpoSpeechRecognitionModule.stop();
        if (stopPromise && typeof stopPromise.catch === 'function') {
          stopPromise.catch((_err) => {});
        }
      } catch (_err) {}
      isTranscribing.current = false;
    }

    // Detener grabación si está activa
    if (audioRecorder && audioRecorder.isRecording) {
      try {
        const stopPromise = audioRecorder.stop();
        if (stopPromise && typeof stopPromise.catch === 'function') {
          stopPromise.catch((_err) => {
            // Ignorar el error "stop failed" ya que es esperado cuando se resetea rápidamente
          });
        }
      } catch (err) {
        // Ignorar el error "stop failed"
      }
    }

    // Limpiar estados
    setAudioUri(null);
    setTranscription(null);
    setCurrentTranscription('');
    currentTranscriptionRef.current = '';
    setError(null);
    setIsRecording(false);
    setIsProcessing(false);
    setIsPreparing(false);
    isStopping.current = false;
  }, [audioRecorder]);

  // Limpiar al desmontar
  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;

      // Limpiar el reconocimiento de voz
      if (isTranscribing.current) {
        isTranscribing.current = false;
        try {
          const stopPromise = ExpoSpeechRecognitionModule.stop();
          if (stopPromise && typeof stopPromise.catch === 'function') {
            stopPromise.catch(() => {});
          }
        } catch (err) {
          // Ignorar errores en cleanup
        }
      }

      // No intentar detener el audio recorder aquí porque puede causar el error
      // El hook de expo-audio maneja su propia limpieza
    };
  }, []);

  return {
    isRecording,
    isPreparing,
    isProcessing,
    audioUri,
    transcription,
    startRecording,
    stopRecording,
    resetRecording,
    error,
  };
};
