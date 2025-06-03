import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { IconButton } from 'react-native-paper';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
  ExpoSpeechRecognitionResultEvent,
  ExpoSpeechRecognitionErrorEvent,
} from 'expo-speech-recognition';
import AnimatedLabelInput from './AnimatedLabelInput';
import { useAppTheme } from '../../styles/theme';

let activeRecognizerId: string | null = null;

interface SpeechRecognitionInputProps extends Omit<React.ComponentProps<typeof AnimatedLabelInput>, 'value' | 'onChangeText'> {
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
  const isMounted = useRef(true);
  const instanceId = useRef(Math.random().toString(36).substring(2)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (activeRecognizerId === instanceId) {
        try {
          ExpoSpeechRecognitionModule.stop();
        } catch (err) {
            console.error("Error stopping on unmount:", err);
        } finally {
            activeRecognizerId = null;
        }
      }
    };
  }, []);

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isRecognizingSpeech ? 1.2 : 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  }, [isRecognizingSpeech, scaleAnim]);

  const handleRecognitionStart = useCallback(() => {
    if (isMounted.current && activeRecognizerId === instanceId) {
      if (!isRecognizingSpeech) {
          setIsRecognizingSpeech(true);
          if (clearOnStart) {
            onChangeText('');
          }
      }
    }
  }, [clearOnStart, onChangeText, instanceId, isRecognizingSpeech]);

  const handleRecognitionEnd = useCallback(() => {
    if (isMounted.current && activeRecognizerId === instanceId) {
      setIsRecognizingSpeech(false);
      activeRecognizerId = null;
    }
  }, [instanceId]);

  const handleRecognitionResult = useCallback((event: ExpoSpeechRecognitionResultEvent) => {
    if (isMounted.current && activeRecognizerId === instanceId && event.results && event.results[0]) {
      const transcript = event.results[0].transcript;
      if (replaceContent) {
        if (rest.keyboardType === 'phone-pad') {
            const numericTranscript = transcript.replace(/\D/g, '');
            onChangeText(numericTranscript);
        } else {
            onChangeText(transcript);
        }
      } else {
        const newValue = value ? value + ' ' + transcript : transcript;
        onChangeText(newValue);
      }
    }
  }, [instanceId, onChangeText, replaceContent, rest.keyboardType, value]);

  const handleRecognitionError = useCallback((event: ExpoSpeechRecognitionErrorEvent) => {
    if (isMounted.current && activeRecognizerId === instanceId) {
      console.error("Speech recognition error:", event.error, event.message);
      setIsRecognizingSpeech(false);
      activeRecognizerId = null;
      onError?.(event.message || event.error || 'Unknown recognition error');
    }
  }, [instanceId, onError]);

  useSpeechRecognitionEvent("start", handleRecognitionStart);
  useSpeechRecognitionEvent("end", handleRecognitionEnd);
  useSpeechRecognitionEvent("result", handleRecognitionResult);
  useSpeechRecognitionEvent("error", handleRecognitionError);

  const toggleRecognition = async () => {
    if (activeRecognizerId === instanceId) {
      try {
        await ExpoSpeechRecognitionModule.stop();
      } catch (err) {
        console.error("Failed to stop speech recognition:", err);
      } finally {
        if (isMounted.current) {
          setIsRecognizingSpeech(false);
        }
        if (activeRecognizerId === instanceId) {
             activeRecognizerId = null;
        }
      }
    } else if (!activeRecognizerId) {
      const permissions = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permissions.granted) {
        console.warn("Permissions not granted for speech recognition");
        onError?.("Permiso de micrófono denegado");
        return;
      }
      try {
        activeRecognizerId = instanceId;
        if (isMounted.current) {
            setIsRecognizingSpeech(true);
        }
        await ExpoSpeechRecognitionModule.start({
          lang: speechLang,
          interimResults: false,
          continuous: false,
        });
      } catch (err: any) {
        console.error("Failed to start speech recognition:", err);
         if (isMounted.current) {
            setIsRecognizingSpeech(false);
         }
         if (activeRecognizerId === instanceId) {
             activeRecognizerId = null;
         }
         onError?.(err.message || 'Error al iniciar');
      }
    } else {
      console.log(`Recognizer ${activeRecognizerId} is already active. Cannot start ${instanceId}.`);
      onError?.('Otro micrófono ya está activo');
    }
  };

  const micIconColor = isRecognizingSpeech ? theme.colors.error : theme.colors.primary;

  return (
    <View style={styles.wrapper}>
      <AnimatedLabelInput
        label={label}
        value={value}
        onChangeText={onChangeText}
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
          icon={isRecognizingSpeech ? "microphone-off" : "microphone"}
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