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

  // Preset para configuraciones comunes
  preset?: 'dialog' | 'form' | 'fullscreen' | 'detail';

  // Dimensiones básicas (sobrescriben el preset)
  maxWidth?: number;
  maxHeightPercent?: number;

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

  // Deprecated props (para compatibilidad temporal)
  /** @deprecated Use preset instead */
  fullScreen?: boolean;
  /** @deprecated Title automatically shows header */
  showHeader?: boolean;
}

/**
 * ResponsiveModal - Modal responsivo y reutilizable
 *
 * @example
 * // Con footer personalizado
 * <ResponsiveModal
 *   visible={visible}
 *   onDismiss={onDismiss}
 *   title="Mi Modal"
 *   showHeader={true}
 *   footer={<CustomFooter />}
 * >
 *   <Content />
 * </ResponsiveModal>
 *
 * @example
 * // Con acciones estandarizadas
 * <ResponsiveModal
 *   visible={visible}
 *   onDismiss={onDismiss}
 *   title="Confirmar Acción"
 *   showHeader={true}
 *   actions={[
 *     { label: 'Cancelar', mode: 'text', onPress: onDismiss },
 *     { label: 'Guardar', mode: 'contained', onPress: handleSave, loading: isSaving }
 *   ]}
 * >
 *   <FormContent />
 * </ResponsiveModal>
 */

export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  visible,
  onDismiss,
  children,
  preset = 'form',
  maxWidth: maxWidthOverride,
  maxHeightPercent: maxHeightOverride,
  dismissable = true,
  isLoading = false,
  title,
  headerLeft,
  headerRight,
  showCloseButton = true,
  footer,
  actions,
  contentContainerStyle,
  // Deprecated props
  fullScreen = false,
  showHeader,
}) => {
  const responsive = useResponsive();
  const theme = useAppTheme();

  // Determinar el preset real considerando props deprecated
  const actualPreset = fullScreen ? 'fullscreen' : preset;

  // Configuración del preset
  const presetConfig = useMemo(() => {
    const { isSmallMobile, isTablet } = responsive;

    switch (actualPreset) {
      case 'dialog':
        return {
          maxWidth: isTablet ? 400 : 360,
          maxHeightPercent: 60,
          width: isSmallMobile ? '94%' : '90%',
          animationIn: 'zoomIn' as const,
          animationOut: 'zoomOut' as const,
        };
      case 'fullscreen':
        return {
          width: '100%',
          height: '100%',
          maxWidth: '100%',
          maxHeightPercent: 100,
          animationIn: 'slideInUp' as const,
          animationOut: 'slideOutDown' as const,
        };
      case 'detail':
        return {
          maxWidth: isTablet ? 600 : 480,
          maxHeightPercent: 90,
          width: isSmallMobile ? '94%' : isTablet ? '85%' : '92%',
          animationIn: 'fadeIn' as const,
          animationOut: 'fadeOut' as const,
        };
      case 'form':
      default:
        return {
          maxWidth: isTablet ? 520 : 480,
          maxHeightPercent: 85,
          width: isSmallMobile ? '94%' : isTablet ? '85%' : '92%',
          animationIn: 'fadeIn' as const,
          animationOut: 'fadeOut' as const,
        };
    }
  }, [actualPreset, responsive]);

  // Calcular dimensiones finales del modal
  const modalDimensions = useMemo(() => {
    const dims: ViewStyle = {
      width: presetConfig.width as any,
      height: presetConfig.height as any,
      maxWidth: (maxWidthOverride ?? presetConfig.maxWidth) as any,
      maxHeight:
        `${maxHeightOverride ?? presetConfig.maxHeightPercent}%` as any,
      minHeight: responsive.isSmallMobile ? 150 : 200,
    };

    if (actualPreset === 'fullscreen') {
      dims.minHeight = '100%' as any;
    }

    return dims;
  }, [
    presetConfig,
    maxWidthOverride,
    maxHeightOverride,
    responsive,
    actualPreset,
  ]);

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
      borderRadius: actualPreset === 'fullscreen' ? 0 : 16,
      borderWidth: actualPreset === 'fullscreen' ? 0 : 2,
      borderColor: theme.colors.primary + '40',
      ...modalDimensions,
      overflow: 'hidden',
      // Sombra adaptada al preset
      elevation: actualPreset === 'dialog' ? 4 : 8,
      shadowColor: theme.colors.primary,
      shadowOffset: {
        width: 0,
        height: actualPreset === 'dialog' ? 2 : 4,
      },
      shadowOpacity: actualPreset === 'dialog' ? 0.2 : 0.3,
      shadowRadius: actualPreset === 'dialog' ? 4 : 8,
    }),
    [theme, actualPreset, modalDimensions],
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

  // Contenido del modal
  const modalContent = (
    <View
      style={[
        styles.modalInner,
        {
          minHeight:
            actualPreset === 'fullscreen'
              ? '100%'
              : responsive.isSmallMobile
                ? 150
                : 200,
        },
      ]}
    >
      {/* Header - se muestra automáticamente si hay título */}
      {(title || (showHeader && (headerLeft || headerRight))) && (
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
    </View>
  );

  const ModalWrapper = Platform.OS === 'ios' ? KeyboardAvoidingView : View;
  const keyboardAvoidingProps =
    Platform.OS === 'ios'
      ? {
          behavior: 'padding' as const,
          keyboardVerticalOffset: actualPreset === 'fullscreen' ? 0 : 100,
        }
      : {};

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={dismissable && !isLoading ? onDismiss : undefined}
      onBackButtonPress={dismissable && !isLoading ? onDismiss : undefined}
      animationIn={presetConfig.animationIn}
      animationOut={presetConfig.animationOut}
      backdropOpacity={0.6}
      useNativeDriver={true}
      useNativeDriverForBackdrop={true}
      hideModalContentWhileAnimating={true}
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
  modalInner: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  scrollView: {
    flex: 1,
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
