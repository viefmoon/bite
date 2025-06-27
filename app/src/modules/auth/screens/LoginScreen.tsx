import React, { useState, useEffect } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  IconButton,
  Surface,
  TouchableRipple,
  Button,
} from 'react-native-paper';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import EncryptedStorage from 'react-native-encrypted-storage';
import { STORAGE_KEYS } from '../../../app/constants/storageKeys';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../../app/styles/theme';
import { useSnackbarStore } from '../../../app/store/snackbarStore';
import { getApiErrorMessage } from '../../../app/lib/errorMapping';
import { ApiError } from '../../../app/lib/errors';
import { useThemeStore } from '../../../app/store/themeStore';
import { useAuthStore } from '../../../app/store/authStore';
import { LoginFormInputs, LoginResponseDto } from '../schema/auth.schema';
import { authService } from '../services/authService';
import LoginForm from '../components/LoginForm';
import {
  runNetworkDiagnostics,
  formatDiagnosticResult,
} from '../../../app/utils/networkDiagnostics';

const LoginScreen = () => {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const navigation = useNavigation();
  const { showSnackbar } = useSnackbarStore();
  const { setThemePreference } = useThemeStore();
  const setTokens = useAuthStore((state) => state.setTokens);

  const [initialEmailOrUsername, setInitialEmailOrUsername] = useState<
    string | undefined
  >(undefined);
  const [initialPassword, setInitialPassword] = useState<string | undefined>(
    undefined,
  );
  const [initialRememberMe, setInitialRememberMe] = useState(false);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(true);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [showNetworkError, setShowNetworkError] = useState(false);

  type LoginMutationVariables = LoginFormInputs & { rememberMe: boolean };

  const loginMutation = useMutation<
    LoginResponseDto,
    Error,
    LoginMutationVariables
  >({
    mutationFn: (variables) =>
      authService.login({
        emailOrUsername: variables.emailOrUsername,
        password: variables.password,
      }),
    onSuccess: async (data, variables) => {
      try {
        // Verificar si el usuario está activo antes de guardar los tokens
        if (data.user && !data.user.isActive) {
          showSnackbar({
            message: 'Tu cuenta está inactiva. Contacta al administrador.',
            type: 'error',
          });
          return;
        }
        
        await setTokens(data.token, data.refreshToken, data.user ?? null);
        const { emailOrUsername, password, rememberMe } = variables;

        if (rememberMe) {
          const credentialsToSave = JSON.stringify({
            emailOrUsername,
            password,
          });
          await EncryptedStorage.setItem(
            STORAGE_KEYS.REMEMBERED_CREDENTIALS,
            credentialsToSave,
          );
          await EncryptedStorage.setItem(
            STORAGE_KEYS.REMEMBER_ME_ENABLED,
            'true',
          );
          console.log('Credenciales guardadas.');
        } else {
          await EncryptedStorage.removeItem(
            STORAGE_KEYS.REMEMBERED_CREDENTIALS,
          );
          await EncryptedStorage.removeItem(STORAGE_KEYS.REMEMBER_ME_ENABLED);
          console.log(
            "Preferencia 'Recordarme' desactivada, credenciales eliminadas.",
          );
        }

        showSnackbar({
          message: `¡Bienvenido!`,
          type: 'success',
        });
        queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      } catch (error: any) {
        console.error(
          'Error al procesar post-login o guardar credenciales:',
          error,
        );
        
        // Si el error es por usuario inactivo, mostrar mensaje específico
        if (error.message === 'Usuario inactivo') {
          showSnackbar({
            message: 'Tu cuenta está inactiva. Contacta al administrador.',
            type: 'error',
          });
        }
        
        try {
          await EncryptedStorage.removeItem(
            STORAGE_KEYS.REMEMBERED_CREDENTIALS,
          );
          await EncryptedStorage.removeItem(STORAGE_KEYS.REMEMBER_ME_ENABLED);
        } catch (cleanupError) {
          console.error(
            'Error al limpiar credenciales durante el manejo de error:',
            cleanupError,
          );
        }
        showSnackbar({
          message: 'Error procesando el inicio de sesión.',
          type: 'error',
        });
      }
    },
    onError: (error: unknown) => {
      const userMessage = getApiErrorMessage(error);
      showSnackbar({
        message: userMessage,
        type: 'error',
        duration: 5000,
      });
      console.error('Login failed:', error);
      if (error instanceof ApiError) {
        console.error('API Error Details:', {
          code: error.code,
          status: error.status,
          details: error.details,
        });

        // Mostrar opción de diagnóstico en errores de red
        if (error.code === 'NETWORK_ERROR' || error.status === 0) {
          setShowNetworkError(true);
        }
      }
    },
  });

  const handleLoginSubmit = (data: LoginFormInputs, rememberMe: boolean) => {
    loginMutation.mutate({ ...data, rememberMe });
  };

  useEffect(() => {
    const loadCredentials = async () => {
      setIsLoadingCredentials(true);
      try {
        const rememberEnabled = await EncryptedStorage.getItem(
          STORAGE_KEYS.REMEMBER_ME_ENABLED,
        );
        if (rememberEnabled === 'true') {
          const storedCredentialsJson = await EncryptedStorage.getItem(
            STORAGE_KEYS.REMEMBERED_CREDENTIALS,
          );
          if (storedCredentialsJson) {
            const storedCredentials = JSON.parse(storedCredentialsJson);
            setInitialEmailOrUsername(storedCredentials.emailOrUsername);
            setInitialPassword(storedCredentials.password);
            setInitialRememberMe(true);
          } else {
            setInitialRememberMe(false);
            setInitialEmailOrUsername('');
            setInitialPassword('');
            await EncryptedStorage.removeItem(STORAGE_KEYS.REMEMBER_ME_ENABLED);
          }
        } else {
          setInitialRememberMe(false);
          setInitialEmailOrUsername('');
          setInitialPassword('');
        }
      } catch (error) {
        console.error('Error al cargar credenciales recordadas:', error);
        setInitialRememberMe(false);
        setInitialEmailOrUsername('');
        setInitialPassword('');
        try {
          await EncryptedStorage.removeItem(
            STORAGE_KEYS.REMEMBERED_CREDENTIALS,
          );
          await EncryptedStorage.removeItem(STORAGE_KEYS.REMEMBER_ME_ENABLED);
        } catch (cleanupError) {
          console.error(
            'Error al limpiar credenciales durante manejo de error de carga:',
            cleanupError,
          );
        }
      } finally {
        setIsLoadingCredentials(false);
      }
    };

    loadCredentials();
  }, []);

  const toggleTheme = () => {
    setThemePreference(theme.dark ? 'light' : 'dark');
  };

  const handleRunDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    try {
      const result = await runNetworkDiagnostics();
      const formattedResult = formatDiagnosticResult(result);

      Alert.alert(
        'Diagnóstico de Red',
        formattedResult,
        [
          { text: 'Copiar', onPress: () => console.log('Copiar resultado') },
          { text: 'Cerrar', style: 'cancel' },
        ],
        { cancelable: true },
      );
    } catch (error) {
      console.error('Error ejecutando diagnóstico:', error);
      showSnackbar({
        message: 'Error al ejecutar el diagnóstico de red',
        type: 'error',
      });
    } finally {
      setIsRunningDiagnostics(false);
      setShowNetworkError(false);
    }
  };

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        scrollView: {
          flexGrow: 1,
        },
        container: {
          flex: 1,
          padding: 24,
          justifyContent: 'space-between',
        },
        logoContainer: {
          alignItems: 'center',
          marginTop: 30,
          marginBottom: 5,
        },
        logo: {
          width: 120,
          height: 120,
          marginBottom: 16,
        },
        title: {
          fontSize: 32,
          fontWeight: 'bold',
          color: theme.colors.primary,
          marginBottom: 8,
          textAlign: 'center',
        },
        subtitle: {
          fontSize: 16,
          color: theme.colors.onSurfaceVariant,
          marginBottom: 20,
          textAlign: 'center',
          paddingHorizontal: 20,
        },
        formContainer: {
          backgroundColor: theme.colors.surface,
          borderRadius: 16,
          padding: 24,
          elevation: 2,
          marginBottom: 16,
        },
        forgotPassword: {
          color: theme.colors.primary,
          textAlign: 'right',
          marginTop: 8,
          marginBottom: 16,
        },
        registerContainer: {
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 20,
        },
        registerText: {
          color: theme.colors.onSurfaceVariant,
          marginRight: 8,
        },
        registerLink: {
          color: theme.colors.primary,
          fontWeight: 'bold',
        },
        bottomThemeToggleContainer: {
          alignItems: 'center',
          marginTop: 20,
          marginBottom: 16,
        },
      }),
    [theme],
  );

  if (isLoadingCredentials) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollView}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <View>
              <View style={styles.logoContainer}>
                <Image
                  source={require('../../../assets/logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <Text style={styles.title}>¡Bienvenido!</Text>
                <Text style={styles.subtitle}>
                  Inicia sesión para gestionar tus pedidos
                </Text>
              </View>

              <Surface style={styles.formContainer}>
                <LoginForm
                  onSubmit={handleLoginSubmit}
                  isLoading={loginMutation.isPending}
                  initialEmailOrUsername={initialEmailOrUsername}
                  initialPassword={initialPassword}
                  initialRememberMe={initialRememberMe}
                />
              </Surface>

              <TouchableRipple
                onPress={() => console.log('Olvidé mi contraseña')}
              >
                <Text style={styles.forgotPassword}>
                  ¿Olvidaste tu contraseña?
                </Text>
              </TouchableRipple>

              {showNetworkError && (
                <Button
                  mode="outlined"
                  onPress={handleRunDiagnostics}
                  loading={isRunningDiagnostics}
                  disabled={isRunningDiagnostics}
                  icon="wifi-alert"
                  style={{ marginTop: 16 }}
                >
                  Diagnosticar problemas de red
                </Button>
              )}
            </View>

            <View>
              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>¿No tienes una cuenta?</Text>
                <TouchableRipple
                  onPress={() => navigation.navigate('Register')}
                >
                  <Text style={styles.registerLink}>Regístrate</Text>
                </TouchableRipple>
              </View>
              <View style={styles.bottomThemeToggleContainer}>
                <IconButton
                  icon={theme.dark ? 'weather-night' : 'weather-sunny'}
                  size={28}
                  onPress={toggleTheme}
                  iconColor={theme.colors.onSurfaceVariant}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
