import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { IconButton } from 'react-native-paper';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import AnimatedLabelInput from './AnimatedLabelInput';
import { useAppTheme } from '../../styles/theme';

// Clase para manejar instancias de reconocimiento de forma aislada
class RecognitionInstance {
  private static instances = new Map<string, RecognitionInstance>();
  private static activeInstanceId: string | null = null;

  public readonly id: string;
  private isActive: boolean = false;
  private onResultCallback: ((text: string) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private onStartCallback: (() => void) | null = null;
  private onEndCallback: (() => void) | null = null;

  constructor(id: string) {
    this.id = id;
    RecognitionInstance.instances.set(id, this);
  }

  static getInstance(id: string): RecognitionInstance {
    if (!RecognitionInstance.instances.has(id)) {
      new RecognitionInstance(id);
    }
    return RecognitionInstance.instances.get(id)!;
  }

  static removeInstance(id: string) {
    const instance = RecognitionInstance.instances.get(id);
    if (instance && instance.isActive) {
      instance.stop();
    }
    RecognitionInstance.instances.delete(id);
  }

  static getActiveInstance(): RecognitionInstance | null {
    if (RecognitionInstance.activeInstanceId) {
      return (
        RecognitionInstance.instances.get(
          RecognitionInstance.activeInstanceId,
        ) || null
      );
    }
    return null;
  }

  setCallbacks(callbacks: {
    onResult?: (text: string) => void;
    onError?: (error: string) => void;
    onStart?: () => void;
    onEnd?: () => void;
  }) {
    this.onResultCallback = callbacks.onResult || null;
    this.onErrorCallback = callbacks.onError || null;
    this.onStartCallback = callbacks.onStart || null;
    this.onEndCallback = callbacks.onEnd || null;
  }

  async start(lang: string) {
    // Si hay otra instancia activa, detenerla primero
    const activeInstance = RecognitionInstance.getActiveInstance();
    if (activeInstance && activeInstance.id !== this.id) {
      await activeInstance.stop();
    }

    try {
      const permissions =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permissions.granted) {
        this.onErrorCallback?.('Permiso de micrófono denegado');
        return;
      }

      RecognitionInstance.activeInstanceId = this.id;
      this.isActive = true;

      await ExpoSpeechRecognitionModule.start({
        lang,
        interimResults: false,
        continuous: false,
      });

      this.onStartCallback?.();
    } catch (error: any) {
      this.isActive = false;
      RecognitionInstance.activeInstanceId = null;
      this.onErrorCallback?.(
        error.message || 'Error al iniciar reconocimiento',
      );
    }
  }

  async stop() {
    if (this.isActive) {
      try {
        await ExpoSpeechRecognitionModule.stop();
      } catch (error) {
        // Ignorar errores al detener
      } finally {
        this.isActive = false;
        if (RecognitionInstance.activeInstanceId === this.id) {
          RecognitionInstance.activeInstanceId = null;
        }
        this.onEndCallback?.();
      }
    }
  }

  handleResult(transcript: string) {
    if (this.isActive && RecognitionInstance.activeInstanceId === this.id) {
      this.onResultCallback?.(transcript);
    }
  }

  handleError(error: string) {
    if (this.isActive && RecognitionInstance.activeInstanceId === this.id) {
      this.isActive = false;
      RecognitionInstance.activeInstanceId = null;
      this.onErrorCallback?.(error);
    }
  }

  handleEnd() {
    if (this.isActive && RecognitionInstance.activeInstanceId === this.id) {
      this.isActive = false;
      RecognitionInstance.activeInstanceId = null;
      this.onEndCallback?.();
    }
  }
}

interface SpeechRecognitionInputProps
  extends Omit<
    React.ComponentProps<typeof AnimatedLabelInput>,
    'value' | 'onChangeText'
  > {
  value: string;
  onChangeText: (text: string) => void;
  label: string;
  speechLang?: string;
  clearOnStart?: boolean;
  replaceContent?: boolean;
  onError?: (error: string) => void;
}

const SpeechRecognitionInput: React.FC<SpeechRecognitionInputProps> = ({
  value,
  onChangeText,
  label,
  speechLang = 'es-MX',
  clearOnStart = false,
  replaceContent = true,
  onError,
  error,
  errorColor,
  activeBorderColor,
  containerStyle,
  inputStyle,
  labelStyle,
  style,
  ...rest
}) => {
  const theme = useAppTheme();
  const [isRecognizingSpeech, setIsRecognizingSpeech] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const instanceId = useRef(
    `speech-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
  ).current;
  const recognitionInstance = useRef<RecognitionInstance | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const lastProcessedValue = useRef(value);
  const isUpdatingFromSpeech = useRef(false);

  // Sincronizar valor externo con valor local solo cuando cambia externamente
  useEffect(() => {
    if (!isUpdatingFromSpeech.current && value !== lastProcessedValue.current) {
      setLocalValue(value);
      lastProcessedValue.current = value;
    }
  }, [value]);

  // Configurar la instancia de reconocimiento
  useEffect(() => {
    recognitionInstance.current = RecognitionInstance.getInstance(instanceId);

    recognitionInstance.current.setCallbacks({
      onStart: () => {
        setIsRecognizingSpeech(true);
        if (clearOnStart) {
          setLocalValue('');
          lastProcessedValue.current = '';
          onChangeText('');
        }
      },
      onEnd: () => {
        setIsRecognizingSpeech(false);
      },
      onResult: (transcript: string) => {
        let newValue: string;

        if (replaceContent) {
          if (rest.keyboardType === 'phone-pad') {
            newValue = transcript.replace(/\D/g, '');
          } else {
            newValue = transcript;
          }
        } else {
          // Usar el valor local más actualizado
          newValue = localValue ? localValue + ' ' + transcript : transcript;
        }

        isUpdatingFromSpeech.current = true;
        setLocalValue(newValue);
        lastProcessedValue.current = newValue;
        onChangeText(newValue);

        // Resetear flag después de un breve delay
        setTimeout(() => {
          isUpdatingFromSpeech.current = false;
        }, 100);
      },
      onError: (errorMsg: string) => {
        setIsRecognizingSpeech(false);
        onError?.(errorMsg);
      },
    });

    return () => {
      RecognitionInstance.removeInstance(instanceId);
    };
  }, [
    instanceId,
    clearOnStart,
    onChangeText,
    replaceContent,
    rest.keyboardType,
    onError,
    localValue,
  ]);

  // Animación del botón
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isRecognizingSpeech ? 1.2 : 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  }, [isRecognizingSpeech, scaleAnim]);

  // Event listeners globales - solo procesan si la instancia activa coincide
  useSpeechRecognitionEvent('start', () => {
    // El evento start ya se maneja en el método start() de RecognitionInstance
  });

  useSpeechRecognitionEvent('end', () => {
    const activeInstance = RecognitionInstance.getActiveInstance();
    if (activeInstance?.id === instanceId) {
      activeInstance.handleEnd();
    }
  });

  useSpeechRecognitionEvent('result', (event) => {
    const activeInstance = RecognitionInstance.getActiveInstance();
    if (activeInstance?.id === instanceId && event.results?.[0]) {
      activeInstance.handleResult(event.results[0].transcript);
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    const activeInstance = RecognitionInstance.getActiveInstance();
    if (activeInstance?.id === instanceId) {
      activeInstance.handleError(
        event.message || event.error || 'Error desconocido',
      );
    }
  });

  const toggleRecognition = async () => {
    if (!recognitionInstance.current) return;

    if (isRecognizingSpeech) {
      await recognitionInstance.current.stop();
    } else {
      await recognitionInstance.current.start(speechLang);
    }
  };

  const micIconColor = isRecognizingSpeech
    ? theme.colors.error
    : theme.colors.primary;

  // Manejar cambios de texto desde el teclado
  const handleTextChange = useCallback(
    (text: string) => {
      // Actualizar estado local inmediatamente
      setLocalValue(text);
      lastProcessedValue.current = text;

      // Notificar al padre
      onChangeText(text);
    },
    [onChangeText],
  );

  return (
    <View style={styles.wrapper}>
      <AnimatedLabelInput
        label={label}
        value={localValue}
        onChangeText={handleTextChange}
        error={error}
        errorColor={errorColor}
        activeBorderColor={activeBorderColor}
        containerStyle={[containerStyle, { flex: 1 }]}
        inputStyle={inputStyle}
        labelStyle={labelStyle}
        style={style}
        {...rest}
      />
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <IconButton
          key={isRecognizingSpeech ? 'mic-active' : 'mic-inactive'}
          icon={isRecognizingSpeech ? 'microphone-off' : 'microphone'}
          size={24}
          iconColor={micIconColor}
          onPress={toggleRecognition}
          style={styles.iconButton}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 8,
    marginVertical: 0,
    padding: 0,
  },
});

export default SpeechRecognitionInput;
