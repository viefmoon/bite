import React, { ReactNode, useMemo } from 'react';
import Modal from 'react-native-modal';
import {
  ScrollView,
  ViewStyle,
  StyleProp,
  View,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import {
  Text,
  IconButton,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { useResponsive } from '@/app/hooks/useResponsive';
import { useAppTheme } from '@/app/styles/theme';
import { ActionButtons, ActionButton } from '../common/ActionButtons';

interface ResponsiveModalProps {
  visible: boolean;
  onDismiss: () => void;
  children: ReactNode;

  // Dimensiones simples usando solo porcentajes
  maxWidthPercent?: number; // Porcentaje del ancho de pantalla (ej: 90 para 90%)
  maxHeightPercent?: number; // Porcentaje de la altura de pantalla (ej: 85 para 85%)

  // Comportamiento
  dismissable?: boolean;
  isLoading?: boolean;

  // Diseño - Header
  title?: string; // Si tiene valor, el header se muestra automáticamente
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  showCloseButton?: boolean;

  // Diseño - Footer
  footer?: ReactNode; // Footer personalizado (tiene prioridad sobre actions)
  actions?: ActionButton[]; // Botones de acción estandarizados

  // Estilos
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * ResponsiveModal - Modal responsivo y reutilizable con dimensiones basadas en porcentajes
 * 
 * Características:
 * - Dimensiones responsivas automáticas según el dispositivo
 * - Sistema de acciones estandarizado
 * - Header y footer opcionales
 * - Scroll automático del contenido
 * - Animaciones suaves
 * - Soporte para loading state
 *
 * Valores por defecto responsivos:
 * - Móvil pequeño: 94% ancho
 * - Tablet: 80% ancho  
 * - Otros dispositivos: 85% ancho
 * - Altura: 85% por defecto
 *
 * @example
 * // Modal de confirmación pequeño
 * <ResponsiveModal
 *   visible={visible}
 *   onDismiss={onDismiss}
 *   title="Confirmar Acción"
 *   maxWidthPercent={60}
 *   maxHeightPercent={40}
 *   actions={[
 *     { label: 'Cancelar', mode: 'outlined', onPress: onDismiss },
 *     { label: 'Confirmar', mode: 'contained', onPress: handleConfirm }
 *   ]}
 * >
 *   <Text>¿Estás seguro de realizar esta acción?</Text>
 * </ResponsiveModal>
 *
 * @example
 * // Modal para formularios (usa valores por defecto)
 * <ResponsiveModal
 *   visible={visible}
 *   onDismiss={onDismiss}
 *   title="Editar Usuario"
 *   actions={[
 *     { label: 'Cancelar', mode: 'outlined', onPress: onDismiss },
 *     { label: 'Guardar', mode: 'contained', onPress: handleSave, loading: isSaving }
 *   ]}
 * >
 *   <UserForm />
 * </ResponsiveModal>
 *
 * @example
 * // Modal de solo lectura sin acciones
 * <ResponsiveModal
 *   visible={visible}
 *   onDismiss={onDismiss}
 *   title="Historial de Orden"
 *   maxWidthPercent={90}
 *   maxHeightPercent={90}
 * >
 *   <OrderHistory />
 * </ResponsiveModal>
 *
 * @example
 * // Modal con footer personalizado
 * <ResponsiveModal
 *   visible={visible}
 *   onDismiss={onDismiss}
 *   title="Configuración Avanzada"
 *   footer={<CustomFooterWithMultipleButtons />}
 * >
 *   <AdvancedSettings />
 * </ResponsiveModal>
 */

export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  visible,
  onDismiss,
  children,
  maxWidthPercent,
  maxHeightPercent,
  dismissable = true,
  isLoading = false,
  title,
  headerLeft,
  headerRight,
  showCloseButton = true,
  footer,
  actions,
  contentContainerStyle,
}) => {
  const responsive = useResponsive();
  const theme = useAppTheme();

  // Calcular dimensiones finales del modal
  const modalDimensions = useMemo(() => {
    const { isSmallMobile, isTablet } = responsive;
    
    // Porcentajes por defecto según el dispositivo
    const defaultMaxWidthPercent = isSmallMobile ? 94 : isTablet ? 80 : 85;
    const defaultMaxHeightPercent = 85;

    // Usar los porcentajes proporcionados o los por defecto
    const finalMaxWidthPercent = maxWidthPercent ?? defaultMaxWidthPercent;
    const finalMaxHeightPercent = maxHeightPercent ?? defaultMaxHeightPercent;

    return {
      width: `${finalMaxWidthPercent}%` as const,
      maxWidth: `${finalMaxWidthPercent}%` as const,
      maxHeight: `${finalMaxHeightPercent}%` as const,
      // No incluir height para casos normales, permitir ajuste automático
    };
  }, [responsive, maxWidthPercent, maxHeightPercent]);

  // Padding del contenido responsivo
  const contentPadding = useMemo(() => {
    if (responsive.isSmallMobile) {
      return responsive.spacing(theme.spacing.s);
    } else if (responsive.isTablet) {
      return responsive.spacing(theme.spacing.l);
    } else {
      return responsive.spacing(theme.spacing.xl);
    }
  }, [responsive, theme.spacing]);

  // Estilos del contenedor principal
  const containerStyles: ViewStyle = useMemo(
    () => ({
      backgroundColor: theme.colors.background,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: theme.colors.primary + '40',
      width: modalDimensions.width,
      maxWidth: modalDimensions.maxWidth,
      maxHeight: modalDimensions.maxHeight,
      overflow: 'hidden',
      // Sombra
      elevation: 8,
      shadowColor: theme.colors.primary,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    }),
    [theme, modalDimensions],
  );

  // Construir el footer del modal basado en props
  const modalFooter = useMemo(() => {
    if (footer) {
      return footer; // Priorizar el footer personalizado si se proporciona
    }
    if (actions && actions.length > 0) {
      return (
        <ActionButtons buttons={actions} compact={responsive.isSmallMobile} />
      );
    }
    return null;
  }, [footer, actions, responsive.isSmallMobile]);

  // Animación moderna estilo iOS
  const animationConfig = useMemo(() => {
    return {
      animationIn: 'zoomIn' as const,
      animationOut: 'zoomOut' as const,
      animationInTiming: 180,
      animationOutTiming: 150,
    };
  }, []);

  // Contenido del modal
  const modalContent = (
    <>
      {/* Header - se muestra automáticamente si hay título */}
      {(title || headerLeft || headerRight) && (
        <>
          <View
            style={[
              styles.header,
              {
                paddingHorizontal: responsive.spacing(theme.spacing.l),
                paddingVertical: responsive.spacing(theme.spacing.m),
              },
            ]}
          >
            {headerLeft && <View style={styles.headerLeft}>{headerLeft}</View>}
            {title && (
              <Text
                style={[styles.headerTitle, { color: theme.colors.onSurface }]}
                numberOfLines={1}
              >
                {title}
              </Text>
            )}
            {headerRight ? (
              <View style={styles.headerRight}>{headerRight}</View>
            ) : (
              showCloseButton && (
                <IconButton
                  icon="close"
                  size={24}
                  onPress={onDismiss}
                  style={styles.closeIcon}
                />
              )
            )}
          </View>
          <Divider style={{ backgroundColor: theme.colors.outlineVariant }} />
        </>
      )}

      {/* Contenido principal con scroll */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { padding: contentPadding },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>

      {/* Footer fijo en la parte inferior */}
      {modalFooter && (
        <>
          <Divider style={{ backgroundColor: theme.colors.outlineVariant }} />
          <View
            style={[
              styles.footerContainer,
              {
                paddingHorizontal: responsive.spacing(theme.spacing.m),
                paddingVertical: responsive.spacing(theme.spacing.s),
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            {modalFooter}
          </View>
        </>
      )}
    </>
  );

  const ModalWrapper = Platform.OS === 'ios' ? KeyboardAvoidingView : View;
  const keyboardAvoidingProps =
    Platform.OS === 'ios'
      ? {
          behavior: 'padding' as const,
          keyboardVerticalOffset: 100,
        }
      : {};

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={dismissable && !isLoading ? onDismiss : undefined}
      onBackButtonPress={dismissable && !isLoading ? onDismiss : undefined}
      animationIn={animationConfig.animationIn}
      animationOut={animationConfig.animationOut}
      animationInTiming={animationConfig.animationInTiming}
      animationOutTiming={animationConfig.animationOutTiming}
      backdropOpacity={0.6}
      useNativeDriver={true}
      useNativeDriverForBackdrop={true}
      hideModalContentWhileAnimating={false}
      style={styles.modal}
    >
      <ModalWrapper
        style={[containerStyles, contentContainerStyle]}
        {...keyboardAvoidingProps}
      >
        {modalContent}
        {isLoading && (
          <View
            style={[
              styles.loadingOverlay,
              { backgroundColor: `${theme.colors.background}E6` },
            ]}
          >
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}
      </ModalWrapper>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  closeIcon: {
    margin: -8,
  },
  headerLeft: {
    marginRight: 12,
  },
  headerRight: {
    marginLeft: 12,
  },
  footerContainer: {
    backgroundColor: 'transparent',
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
});
