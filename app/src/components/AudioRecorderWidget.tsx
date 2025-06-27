import React, { useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import LottieView from 'lottie-react-native';

interface AudioRecorderWidgetProps {
  onRecordingComplete: (audioUri: string, transcription: string) => void;
  onError: (error: string) => void;
}

const { width } = Dimensions.get('window');

export const AudioRecorderWidget: React.FC<AudioRecorderWidgetProps> = ({
  onRecordingComplete,
  onError,
}) => {
  const theme = useTheme();
  const {
    isRecording,
    isPreparing,
    isProcessing,
    audioUri,
    transcription,
    startRecording,
    stopRecording,
    resetRecording,
    error,
  } = useAudioRecorder();

  // Animaciones
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Animación de pulsación cuando está grabando
  useEffect(() => {
    if (isRecording) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 1000,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  // Animación de rotación cuando está procesando
  useEffect(() => {
    if (isProcessing || isPreparing) {
      const rotationAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      rotationAnimation.start();
      return () => {
        rotationAnimation.stop();
        rotateAnim.setValue(0);
      };
    }
  }, [isProcessing, isPreparing, rotateAnim]);

  // Estado para evitar llamadas duplicadas
  const hasCompletedRef = useRef(false);
  
  // Efecto cuando se completa la grabación
  useEffect(() => {
    if (audioUri && transcription && !isProcessing && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      
      // Guardar valores antes de resetear
      const uri = audioUri;
      const trans = transcription;
      
      // Reset primero para evitar loops
      resetRecording();
      
      // Luego llamar a onRecordingComplete
      onRecordingComplete(uri, trans);
      
      // Resetear el flag después de un tiempo
      setTimeout(() => {
        hasCompletedRef.current = false;
      }, 1000);
    }
  }, [audioUri, transcription, isProcessing, onRecordingComplete, resetRecording]);

  // Efecto para manejar errores
  useEffect(() => {
    if (error) {
      onError(error);
    }
  }, [error, onError]);
  
  // Cleanup al desmontar el componente
  useEffect(() => {
    return () => {
      // El hook maneja su propia limpieza, no necesitamos forzarla aquí
    };
  }, []);

  const handlePress = async () => {
    // Prevenir múltiples clics mientras procesa
    if (isProcessing || isPreparing) {
      return;
    }
    
    // Animación de presión
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      if (isRecording) {
        await stopRecording();
      } else {
        await startRecording();
      }
    } catch (err) {
      console.error('Error en handlePress:', err);
    }
  };


  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getIconName = () => {
    if (isProcessing || isPreparing) return 'hourglass-empty';
    if (isRecording) return 'stop';
    return 'mic';
  };

  const getBackgroundColor = () => {
    if (isProcessing || isPreparing) return theme.colors.tertiary;
    if (isRecording) return theme.colors.error;
    return theme.colors.primary;
  };

  return (
    <View style={styles.container}>
      {/* Círculos de onda cuando está grabando */}
      {isRecording && (
        <>
          <Animated.View
            style={[
              styles.pulseCircle,
              {
                backgroundColor: theme.colors.primary,
                transform: [{ scale: pulseAnim }],
                opacity: fadeAnim.interpolate({
                  inputRange: [1, 1.3],
                  outputRange: [0.3, 0],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.pulseCircle,
              styles.pulseCircleSecond,
              {
                backgroundColor: theme.colors.primary,
                transform: [{ scale: Animated.multiply(pulseAnim, 0.8) }],
                opacity: fadeAnim.interpolate({
                  inputRange: [1, 1.3],
                  outputRange: [0.2, 0],
                }),
              },
            ]}
          />
        </>
      )}

      <TouchableOpacity
        onPress={handlePress}
        disabled={isProcessing || isPreparing}
        activeOpacity={0.8}
      >
        <Animated.View
          style={[
            styles.button,
            {
              backgroundColor: getBackgroundColor(),
              transform: [
                { scale: scaleAnim },
                { rotate: rotateInterpolate },
              ],
              shadowColor: theme.colors.primary,
            },
          ]}
        >
          <MaterialIcons
            name={getIconName()}
            size={32}
            color="white"
          />
        </Animated.View>
      </TouchableOpacity>

      {/* Indicador de grabación */}
      {isRecording && (
        <View style={[styles.recordingIndicator, { backgroundColor: theme.colors.error }]}>
          <View style={styles.recordingDot} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  pulseCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  pulseCircleSecond: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  recordingIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
});