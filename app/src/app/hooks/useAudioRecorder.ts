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

  const audioRecorder = useExpoAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    android: {
      ...RecordingPresets.HIGH_QUALITY.android,
      extension: '.mp4',
      outputFormat: 'mpeg4',
      audioEncoder: 'aac',
      sampleRate: 16000,
    },
    ios: {
      ...RecordingPresets.HIGH_QUALITY.ios,
      extension: '.m4a',
      sampleRate: 16000,
    },
  });

  const [currentTranscription, setCurrentTranscription] = useState<string>('');
  const currentTranscriptionRef = useRef<string>('');
  const isTranscribing = useRef(false);
  const isMounted = useRef(true);

  useEffect(() => {
    if (audioRecorder && typeof audioRecorder.record === 'function') {
      setIsInitialized(true);
    }
  }, [audioRecorder]);

  const isStopping = useRef(false);

  useSpeechRecognitionEvent('result', (event) => {
    if (!isMounted.current) return;

    const results = event.results;
    if (results && results.length > 0) {
      const bestResult = results[0];
      if (bestResult && bestResult.transcript) {
        const newTranscript = bestResult.transcript;
        currentTranscriptionRef.current = newTranscript;
        setCurrentTranscription(newTranscript);

        if (event.isFinal) {
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

      const audioPermission =
        await AudioModule.requestRecordingPermissionsAsync();
      if (!audioPermission.granted) {
        throw new Error('Se requiere permiso para grabar audio');
      }

      const speechPermissions =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!speechPermissions.granted) {
        throw new Error('Se requiere permiso para reconocimiento de voz');
      }

      isTranscribing.current = true;
      setCurrentTranscription('');

      try {
        await ExpoSpeechRecognitionModule.start({
          lang: 'es-MX',
          interimResults: true,
          continuous: true,
          maxAlternatives: 1,
        });
      } catch (speechError) {}

      await new Promise((resolve) => setTimeout(resolve, 300));

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

    if (isStopping.current) {
      return;
    }

    try {
      const isCurrentlyRecording = audioRecorder.isRecording;
      if (!isCurrentlyRecording) {
        return;
      }

      isStopping.current = true;

      setIsProcessing(true);
      setIsRecording(false);

      if (isTranscribing.current) {
        try {
          await ExpoSpeechRecognitionModule.stop();
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
        } finally {
          isTranscribing.current = false;
        }
      }

      let uri: string | undefined;
      try {
        await audioRecorder.stop();
        uri = audioRecorder.uri || undefined;
      } catch (audioError) {
        if ((audioError as Error)?.message?.includes('stop failed')) {
          uri = audioRecorder.uri || undefined;
        } else {
          throw audioError;
        }
      }

      if (!uri) {
        throw new Error('No se pudo obtener el archivo de audio');
      }

      if (isMounted.current) {
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

    if (isTranscribing.current) {
      try {
        ExpoSpeechRecognitionModule.stop();
      } catch (_err) {}
      isTranscribing.current = false;
    }

    if (audioRecorder && audioRecorder.isRecording) {
      try {
        audioRecorder.stop();
      } catch (err) {}
    }

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

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;

      if (isTranscribing.current) {
        isTranscribing.current = false;
        try {
          ExpoSpeechRecognitionModule.stop();
        } catch (err) {}
      }
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
