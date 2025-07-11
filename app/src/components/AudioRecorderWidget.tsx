import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  Text,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import {
  audioServiceHealth,
  type AudioServiceHealthStatus,
} from '@/services/audioServiceHealth';

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

  // Estado para el tiempo de grabación
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);

  // Estado de disponibilidad del servicio
  const [serviceHealth, setServiceHealth] = useState<AudioServiceHealthStatus>(
    audioServiceHealth.getStatus(),
  );
  const [isServiceAvailable, setIsServiceAvailable] = useState(false);

  // Animaciones
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const waveAnim1 = useRef(new Animated.Value(0.8)).current;
  const waveAnim2 = useRef(new Animated.Value(0.8)).current;
  const waveAnim3 = useRef(new Animated.Value(0.8)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Suscribirse a cambios en el estado del servicio
  useEffect(() => {
    const unsubscribe = audioServiceHealth.subscribe((status) => {
      setServiceHealth(status);
      setIsServiceAvailable(status.isAvailable);
    });

    // Iniciar verificación periódica solo cuando este componente está montado
    audioServiceHealth.startPeriodicCheck();

    return () => {
      unsubscribe();
      // IMPORTANTE: Detener verificaciones periódicas cuando el componente se desmonte
      audioServiceHealth.stopPeriodicCheck();
    };
  }, []);

  // Animación de entrada del widget (siempre visible)
  useEffect(() => {
    Animated.spring(bounceAnim, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  // Animación de ondas cuando está grabando
  useEffect(() => {
    if (isRecording) {
      // Iniciar contador de tiempo
      recordingInterval.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // Animaciones de onda
      const wave1 = Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim1, {
            toValue: 1.5,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim1, {
            toValue: 0.8,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );

      const wave2 = Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim2, {
            toValue: 1.8,
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim2, {
            toValue: 0.8,
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );

      const wave3 = Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim3, {
            toValue: 2.1,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim3, {
            toValue: 0.8,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );

      // Animación de brillo
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );

      wave1.start();
      wave2.start();
      wave3.start();
      glow.start();

      // Fade in de las ondas
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      return () => {
        wave1.stop();
        wave2.stop();
        wave3.stop();
        glow.stop();
        if (recordingInterval.current) {
          clearInterval(recordingInterval.current);
        }
        setRecordingTime(0);
      };
    } else {
      // Fade out de las ondas
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      waveAnim1.setValue(0.8);
      waveAnim2.setValue(0.8);
      waveAnim3.setValue(0.8);
      glowAnim.setValue(0);
    }
  }, [isRecording]);

  // Animación de procesamiento
  useEffect(() => {
    if (isProcessing || isPreparing) {
      const spin = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.bezier(0.645, 0.045, 0.355, 1),
          useNativeDriver: true,
        }),
      );
      spin.start();
      return () => {
        spin.stop();
        rotateAnim.setValue(0);
      };
    }
  }, [isProcessing, isPreparing]);

  // Estado para evitar llamadas duplicadas
  const hasCompletedRef = useRef(false);

  // Efecto cuando se completa la grabación
  useEffect(() => {
    if (
      audioUri &&
      transcription &&
      !isProcessing &&
      !hasCompletedRef.current
    ) {
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
  }, [
    audioUri,
    transcription,
    isProcessing,
    onRecordingComplete,
    resetRecording,
  ]);

  // Efecto para manejar errores
  useEffect(() => {
    if (error) {
      onError(error);
    }
  }, [error, onError]);

  const handlePress = async () => {
    // Verificar disponibilidad del servicio
    if (!isServiceAvailable) {
      // Animación de "shake" para indicar que no está disponible
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      onError(serviceHealth.message || 'Servicio de voz no disponible');
      return;
    }

    // Prevenir múltiples clics mientras procesa
    if (isProcessing || isPreparing) {
      return;
    }

    // Animación de presión más suave
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.85,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      if (isRecording) {
        await stopRecording();
      } else {
        await startRecording();
      }
    } catch (err) {}
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getIcon = () => {
    if (isRecording) {
      return <MaterialIcons name="stop" size={30} color="white" />;
    }
    return <MaterialIcons name="mic" size={30} color="white" />;
  };

  const getBackgroundColor = () => {
    if (!isServiceAvailable) return '#B0B0B0'; // Gris más suave
    if (isProcessing || isPreparing) return theme.colors.secondary;
    if (isRecording) return '#FF3B30'; // Rojo vibrante
    return theme.colors.primary;
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            {
              translateY: bounceAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [100, 0],
              }),
            },
            { scale: bounceAnim },
          ],
          opacity: bounceAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, isServiceAvailable ? 1 : 0.8],
          }),
        },
      ]}
    >
      {/* Ondas animadas de fondo */}
      {isRecording && (
        <View style={styles.wavesContainer}>
          <Animated.View
            style={[
              styles.wave,
              {
                transform: [{ scale: waveAnim1 }],
                opacity: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.1],
                }),
                backgroundColor: theme.colors.primary,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.wave,
              {
                transform: [{ scale: waveAnim2 }],
                opacity: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.15],
                }),
                backgroundColor: theme.colors.primary,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.wave,
              {
                transform: [{ scale: waveAnim3 }],
                opacity: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.2],
                }),
                backgroundColor: theme.colors.primary,
              },
            ]}
          />
        </View>
      )}

      {/* Contador de tiempo */}
      {isRecording && (
        <Animated.View
          style={[
            styles.timerContainer,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={[styles.timerBadge, { backgroundColor: '#FF3B30' }]}>
            <View style={styles.recordingDot} />
            <Text style={styles.timerText}>{formatTime(recordingTime)}</Text>
          </View>
        </Animated.View>
      )}

      {/* Indicador de servicio no disponible */}
      {!isServiceAvailable && (
        <View
          style={[
            styles.disabledIndicator,
            { backgroundColor: theme.colors.error },
          ]}
        >
          <MaterialIcons name="cloud-off" size={14} color="white" />
        </View>
      )}

      <TouchableOpacity
        onPress={handlePress}
        disabled={isProcessing || isPreparing || !isServiceAvailable}
        activeOpacity={0.9}
      >
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Brillo de fondo cuando graba */}
          {isRecording && (
            <Animated.View
              style={[
                styles.glowEffect,
                {
                  backgroundColor: '#FF3B30',
                  opacity: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 0.6],
                  }),
                  transform: [
                    {
                      scale: glowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.2],
                      }),
                    },
                  ],
                },
              ]}
            />
          )}

          <View
            style={[
              styles.button,
              {
                backgroundColor: getBackgroundColor(),
                shadowColor: !isServiceAvailable
                  ? 'transparent'
                  : isRecording
                    ? '#FF3B30'
                    : theme.colors.primary,
                shadowOpacity: !isServiceAvailable
                  ? 0
                  : isRecording
                    ? 0.4
                    : 0.25,
              },
            ]}
          >
            {isProcessing || isPreparing ? (
              <Animated.View
                style={{
                  transform: [{ rotate: rotateInterpolate }],
                }}
              >
                <MaterialCommunityIcons name="brain" size={30} color="white" />
              </Animated.View>
            ) : (
              getIcon()
            )}
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
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
  wavesContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wave: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    zIndex: 10,
  },
  glowEffect: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    zIndex: 5,
  },
  timerContainer: {
    position: 'absolute',
    top: -45,
    alignItems: 'center',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  recordingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
    opacity: 0.9,
  },
  timerText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  disabledIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    elevation: 12,
    borderWidth: 2,
    borderColor: 'white',
  },
});
