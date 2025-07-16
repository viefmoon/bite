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
import { Text, IconButton, Surface, TouchableRipple } from 'react-native-paper';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import EncryptedStorage from '@/app/services/secureStorageService';
import { STORAGE_KEYS } from '../../../app/constants/storageKeys';
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
import { OrientationTransition } from '../../../app/components/OrientationTransition';
import * as ScreenOrientation from 'expo-screen-orientation';

const LoginScreen = () => {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbarStore();
  const { setThemePreference } = useThemeStore();
  const setTokens = useAuthStore((state) => state.setTokens);
  const { isConnected, serverUrl } = useServerConnection();

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
        if (error.message === 'Usuario inactivo') {
          showSnackbar({
            message: 'Tu cuenta está inactiva. Contacta al administrador.',
            type: 'error',
          });
        }

        try {
          await EncryptedStorage.removeItem(STORAGE_KEYS.REMEMBERED_CREDENTIALS);
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

  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && responsive.dimensions.width >= 1024;
  const isTablet = isWeb && responsive.dimensions.width >= 768 && responsive.dimensions.width < 1024;

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
        webContainer: {
          flex: 1,
          flexDirection: isDesktop ? 'row' : 'column',
          minHeight: '100vh',
          width: '100%',
        },
        webLeftPanel: {
          flex: isDesktop ? 1 : undefined,
          backgroundColor: theme.dark ? theme.colors.primaryContainer : theme.colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
          padding: responsive.spacingPreset.xl,
          ...(isTablet && {
            paddingVertical: responsive.spacingPreset.xxl,
          }),
        },
        webRightPanel: {
          flex: isDesktop ? 1 : undefined,
          justifyContent: 'center',
          alignItems: 'center',
          padding: responsive.spacingPreset.xl,
          backgroundColor: theme.colors.background,
          minHeight: isDesktop ? '100vh' : undefined,
          width: '100%',
        },
        webBrandingContainer: {
          alignItems: 'center',
          marginBottom: responsive.spacingPreset.xl,
        },
        webBrandingLogo: {
          width: isDesktop ? 200 : 150,
          height: isDesktop ? 200 : 150,
          marginBottom: responsive.spacingPreset.l,
          borderRadius: isDesktop ? 100 : 75,
          backgroundColor: theme.colors.surface,
          overflow: 'hidden',
          borderWidth: theme.dark ? 2 : 0,
          borderColor: theme.dark ? theme.colors.outline : 'transparent',
        },
        webBrandingTitle: {
          fontSize: isDesktop ? 48 : 36,
          fontWeight: 'bold',
          color: theme.dark ? theme.colors.onPrimaryContainer : theme.colors.onPrimary,
          marginBottom: responsive.spacingPreset.m,
          textAlign: 'center',
        },
        webBrandingSubtitle: {
          fontSize: isDesktop ? 20 : 18,
          color: theme.dark ? theme.colors.onPrimaryContainer : theme.colors.onPrimary,
          opacity: theme.dark ? 0.8 : 0.9,
          textAlign: 'center',
          maxWidth: 400,
          lineHeight: 28,
        },
        webFormWrapper: {
          width: '100%',
          maxWidth: isDesktop ? 450 : 400,
          alignItems: 'center',
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
          width: 160,
          height: 160,
          marginBottom: 16,
          borderRadius: 80,
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
          ...(isWeb && {
            width: '100%',
            shadowColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 1,
            shadowRadius: 8,
            borderWidth: theme.dark ? 1 : 0,
            borderColor: theme.dark ? theme.colors.surfaceVariant : 'transparent',
          }),
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
        webThemeToggle: {
          position: 'absolute',
          top: responsive.spacingPreset.l,
          right: responsive.spacingPreset.l,
          zIndex: 10,
        },
      }),
    [theme, isDesktop, isTablet],
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

  const webContent = (
    <View style={{ flex: 1, height: '100vh', backgroundColor: theme.colors.background }}>
      <ConnectionErrorModal />
      <RegisterModal
        visible={showRegisterModal}
        onDismiss={() => setShowRegisterModal(false)}
        onRegisterSuccess={handleRegisterSuccess}
      />
      
      {/* Theme toggle button */}
      <View style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
        <IconButton
          icon={theme.dark ? 'weather-night' : 'weather-sunny'}
          size={30}
          onPress={toggleTheme}
          iconColor={theme.colors.onSurfaceVariant}
        />
      </View>

      <ScrollView 
        contentContainerStyle={{ 
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
      >
        <View style={{
          width: '100%',
          maxWidth: 380,
          alignItems: 'center',
        }}>
          {/* Logo */}
          <Image
            source={require('../../../../assets/icon.png')}
            style={{
              width: 200,
              height: 200,
              borderRadius: 100,
              marginBottom: 30,
            }}
            resizeMode="cover"
          />

          {/* Login form card */}
          <View style={{
            width: '100%',
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
            padding: 24,
            shadowColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 1,
            shadowRadius: 12,
            elevation: 4,
            borderWidth: theme.dark ? 1 : 0,
            borderColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'transparent',
          }}>
            <Text style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: theme.colors.onSurface,
              marginBottom: 8,
              textAlign: 'center',
            }}>Iniciar Sesión</Text>
            <Text style={{
              fontSize: 14,
              color: theme.colors.onSurfaceVariant,
              marginBottom: 20,
              textAlign: 'center',
            }}>
              Ingresa tus credenciales para continuar
            </Text>
            
            <LoginForm
              onSubmit={handleLoginSubmit}
              isLoading={loginMutation.isPending}
              initialEmailOrUsername={initialEmailOrUsername}
              initialPassword={initialPassword}
              initialRememberMe={initialRememberMe}
            />
            
            <View style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 16,
            }}>
              <Text style={{ 
                color: theme.colors.onSurfaceVariant,
                fontSize: 14,
              }}>
                ¿No tienes una cuenta?
              </Text>
              <TouchableRipple
                onPress={() => setShowRegisterModal(true)}
                style={{ marginLeft: 5 }}
              >
                <Text style={{
                  color: theme.colors.primary,
                  fontWeight: 'bold',
                  fontSize: 14,
                }}>Regístrate</Text>
              </TouchableRipple>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  const mobileContent = (
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
                resizeMode="cover"
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
              <TouchableRipple onPress={() => setShowRegisterModal(true)}>
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

  const content = isWeb ? webContent : mobileContent;

  return Platform.OS === 'web' ? content : (
    <OrientationTransition targetOrientation={ScreenOrientation.OrientationLock.PORTRAIT_UP}>
      {content}
    </OrientationTransition>
  );
};

export default LoginScreen;
