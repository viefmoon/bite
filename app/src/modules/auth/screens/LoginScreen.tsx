import React, { useState, useEffect } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  IconButton,
  Surface,
  TouchableRipple,
} from 'react-native-paper';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import EncryptedStorage from 'react-native-encrypted-storage';
import { STORAGE_KEYS } from '../../../app/constants/storageKeys';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../../app/styles/theme';
import { useSnackbarStore } from '../../../app/store/snackbarStore';
import { getApiErrorMessage } from '../../../app/lib/errorMapping';
import { useThemeStore } from '../../../app/store/themeStore';
import { useAuthStore } from '../../../app/store/authStore';
import { LoginFormInputs, LoginResponseDto } from '../schema/auth.schema';
import { authService } from '../services/authService';
import LoginForm from '../components/LoginForm';
import { ConnectionIndicator } from '../../../app/components/ConnectionIndicator';
import { useResponsive } from '../../../app/hooks/useResponsive';
import { ConnectionErrorModal } from '../../../app/components/ConnectionErrorModal';
import { useServerConnection } from '../../../app/hooks/useServerConnection';
import { RegisterModal } from '../components/RegisterForm';

const LoginScreen = () => {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const queryClient = useQueryClient();
  const navigation = useNavigation();
  const { showSnackbar } = useSnackbarStore();
  const { setThemePreference } = useThemeStore();
  const setTokens = useAuthStore((state) => state.setTokens);
  const {} = useServerConnection();

  const [initialEmailOrUsername, setInitialEmailOrUsername] = useState<
    string | undefined
  >(undefined);
  const [initialPassword, setInitialPassword] = useState<string | undefined>(
    undefined,
  );
  const [initialRememberMe, setInitialRememberMe] = useState(false);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

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
        } else {
          await EncryptedStorage.removeItem(
            STORAGE_KEYS.REMEMBERED_CREDENTIALS,
          );
          await EncryptedStorage.removeItem(STORAGE_KEYS.REMEMBER_ME_ENABLED);
        }

        showSnackbar({
          message: `¡Bienvenido!`,
          type: 'success',
        });
        queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      } catch (error: any) {
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
        } catch (cleanupError) {}
        showSnackbar({
          message: 'Error procesando el inicio de sesión.',
          type: 'error',
        });
      }
    },
    onError: (error: any) => {
      const errorMessage = getApiErrorMessage(error);

      // Si es un error de autenticación, mostrar snackbar
      if (
        errorMessage.includes('credenciales') ||
        errorMessage.includes('contraseña') ||
        errorMessage.includes('usuario') ||
        error.response?.status === 401
      ) {
        showSnackbar({
          message: errorMessage,
          type: 'error',
          duration: 5000,
        });
        return;
      }

      // Los errores de conexión serán manejados por el modal automáticamente
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
        setInitialRememberMe(false);
        setInitialEmailOrUsername('');
        setInitialPassword('');
        try {
          await EncryptedStorage.removeItem(
            STORAGE_KEYS.REMEMBERED_CREDENTIALS,
          );
          await EncryptedStorage.removeItem(STORAGE_KEYS.REMEMBER_ME_ENABLED);
        } catch (cleanupError) {}
      } finally {
        setIsLoadingCredentials(false);
      }
    };

    loadCredentials();
  }, []);

  const toggleTheme = () => {
    setThemePreference(theme.dark ? 'light' : 'dark');
  };

  const handleRegisterSuccess = (username: string, password: string) => {
    setInitialEmailOrUsername(username);
    setInitialPassword(password);
    setInitialRememberMe(false);
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
          padding: responsive.spacingPreset.l,
          justifyContent: 'space-between',
        },
        logoContainer: {
          alignItems: 'center',
          marginTop: responsive.spacingPreset.xl,
          marginBottom: responsive.spacingPreset.m,
        },
        logo: {
          width: 120,
          height: 120,
          marginBottom: 16,
          borderRadius: 60, // Hace el logo circular
          backgroundColor: 'transparent',
          overflow: 'hidden',
        },
        title: {
          fontSize: 32,
          fontWeight: 'bold',
          color: theme.colors.primary,
          marginBottom: 8,
          textAlign: 'center',
        },
        subtitle: {
          fontSize: responsive.fontSizePreset.m,
          color: theme.colors.onSurfaceVariant,
          marginBottom: responsive.spacingPreset.xl,
          textAlign: 'center',
          paddingHorizontal: responsive.spacingPreset.l,
        },
        formContainer: {
          backgroundColor: theme.colors.surface,
          borderRadius: 16,
          padding: responsive.spacingPreset.m,
          elevation: 2,
          marginBottom: responsive.spacingPreset.m,
          paddingVertical: responsive.spacingPreset.l,
        },
        registerContainer: {
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: responsive.spacingPreset.xl,
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
      <ConnectionErrorModal />
      <RegisterModal
        visible={showRegisterModal}
        onDismiss={() => setShowRegisterModal(false)}
        onRegisterSuccess={handleRegisterSuccess}
      />
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
              <View
                style={{
                  position: 'absolute',
                  top: -responsive.spacing.s,
                  right: -responsive.spacing.s,
                  zIndex: 1,
                }}
              >
                <ConnectionIndicator />
              </View>
              <View style={styles.logoContainer}>
                <Image
                  source={require('../../../../assets/icon.png')}
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
            </View>

            <View>
              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>¿No tienes una cuenta?</Text>
                <TouchableRipple
                  onPress={() => setShowRegisterModal(true)}
                >
                  <Text style={styles.registerLink}>Regístrate</Text>
                </TouchableRipple>
              </View>
              <View style={styles.bottomThemeToggleContainer}>
                <IconButton
                  icon={theme.dark ? 'weather-night' : 'weather-sunny'}
                  size={responsive.dimensions.iconSize.large}
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
