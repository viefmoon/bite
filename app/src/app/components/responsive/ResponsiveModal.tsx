import { ReactNode, useMemo } from 'react';
import { Modal, Portal, Text, IconButton } from 'react-native-paper';
import {
  ScrollView,
  ViewStyle,
  StyleProp,
  View,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '@/app/hooks/useResponsive';
import { useAppTheme } from '@/app/styles/theme';

interface ResponsiveModalProps {
  visible: boolean;
  onDismiss: () => void;
  children: ReactNode;

  // Header configuration
  title?: string;
  hideCloseButton?: boolean;
  headerActions?: ReactNode;
  headerStyle?: StyleProp<ViewStyle>;

  // Estilo
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;

  // Dimensiones responsive
  width?: number | string;
  widthMobile?: number | string;
  widthTablet?: number | string;

  maxWidth?: number | string;
  maxWidthMobile?: number | string;
  maxWidthTablet?: number | string;

  height?: number | string;
  heightMobile?: number | string;
  heightTablet?: number | string;

  maxHeight?: number | string;
  maxHeightMobile?: number | string;
  maxHeightTablet?: number | string;

  // Padding responsive
  padding?: number;
  paddingMobile?: number;
  paddingTablet?: number;

  // Comportamiento
  dismissable?: boolean;
  dismissableBackButton?: boolean;
  scrollable?: boolean;
  keyboardAvoiding?: boolean;
  fullScreen?: boolean;
  fullScreenMobile?: boolean;

  // Posición
  position?: 'center' | 'bottom' | 'top';
  positionMobile?: 'center' | 'bottom' | 'top';
  positionTablet?: 'center' | 'bottom' | 'top';

  // Animación
  animationType?: 'fade' | 'slide' | 'none';

  // Footer opcional
  footer?: ReactNode;
  footerStyle?: StyleProp<ViewStyle>;
  stickyFooter?: boolean;
}

export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  visible,
  onDismiss,
  children,

  // Header
  title,
  hideCloseButton = false,
  headerActions,
  headerStyle,

  // Estilo
  contentContainerStyle,
  style,

  // Dimensiones
  width,
  widthMobile,
  widthTablet,
  maxWidth,
  maxWidthMobile,
  maxWidthTablet,
  height,
  heightMobile,
  heightTablet,
  maxHeight,
  maxHeightMobile,
  maxHeightTablet,

  // Padding
  padding,
  paddingMobile,
  paddingTablet,

  // Comportamiento
  dismissable = true,
  dismissableBackButton = true,
  scrollable = true,
  keyboardAvoiding = true,
  fullScreen = false,
  fullScreenMobile = false,

  // Posición
  position = 'center',
  positionMobile,
  positionTablet,

  // Footer
  footer,
  footerStyle,
  stickyFooter = true,
}) => {
  const responsive = useResponsive();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  // Determinar si debe ser fullscreen
  const isFullScreen =
    responsive.isMobile && fullScreenMobile ? true : fullScreen;

  // Calcular posición responsive
  const modalPosition = responsive.isTablet
    ? positionTablet || position
    : positionMobile || position;

  // Calcular dimensiones responsive
  const modalDimensions = useMemo(() => {
    const dims: ViewStyle = {};

    // Width
    if (responsive.isTablet) {
      dims.width = (widthTablet ||
        width ||
        responsive.dimensions.modalWidth) as any;
      dims.maxWidth = (maxWidthTablet || maxWidth || '90%') as any;
    } else {
      dims.width = (widthMobile ||
        width ||
        (isFullScreen ? '100%' : '95%')) as any;
      dims.maxWidth = (maxWidthMobile || maxWidth || '100%') as any;
    }

    // Height
    if (height || heightMobile || heightTablet) {
      dims.height = (
        responsive.isTablet ? heightTablet || height : heightMobile || height
      ) as any;
    }

    if (maxHeight || maxHeightMobile || maxHeightTablet) {
      dims.maxHeight = (
        responsive.isTablet
          ? maxHeightTablet || maxHeight || '95%'
          : maxHeightMobile || maxHeight || '92%'
      ) as any;
    } else {
      // Default max height
      dims.maxHeight = responsive.isTablet ? '95%' : '92%';
    }

    // Si es fullscreen, ajustar dimensiones
    if (isFullScreen) {
      dims.width = '100%';
      dims.height = '100%';
      dims.maxWidth = '100%';
      dims.maxHeight = '100%';
    }

    return dims;
  }, [
    responsive,
    width,
    widthMobile,
    widthTablet,
    maxWidth,
    maxWidthMobile,
    maxWidthTablet,
    height,
    heightMobile,
    heightTablet,
    maxHeight,
    maxHeightMobile,
    maxHeightTablet,
    isFullScreen,
  ]);

  // Calcular padding responsive
  const modalPadding = useMemo(() => {
    if (isFullScreen) return 0;

    if (responsive.isTablet) {
      return paddingTablet || padding || responsive.spacingPreset.l;
    } else {
      return paddingMobile || padding || responsive.spacingPreset.m;
    }
  }, [responsive, padding, paddingMobile, paddingTablet, isFullScreen]);

  // Estilos del modal según posición
  const positionStyles = useMemo(() => {
    const styles: ViewStyle = {};

    switch (modalPosition) {
      case 'bottom':
        styles.justifyContent = 'flex-end';
        break;
      case 'top':
        styles.justifyContent = 'flex-start';
        break;
      case 'center':
      default:
        styles.justifyContent = 'center';
        styles.alignItems = 'center';
        break;
    }

    return styles;
  }, [modalPosition]);

  // Estilos del contenedor
  const containerStyles = useMemo(() => {
    const baseStyles: ViewStyle = {
      backgroundColor: theme.colors.surface,
      borderRadius: isFullScreen ? 0 : theme.roundness * 2,
      overflow: 'hidden',
      ...modalDimensions,
    };

    // Ajustes según posición
    if (modalPosition === 'bottom' && !isFullScreen) {
      baseStyles.borderBottomLeftRadius = 0;
      baseStyles.borderBottomRightRadius = 0;
      baseStyles.width = '100%';
      baseStyles.maxWidth = '100%';
    }

    if (modalPosition === 'top' && !isFullScreen) {
      baseStyles.borderTopLeftRadius = 0;
      baseStyles.borderTopRightRadius = 0;
      baseStyles.width = '100%';
      baseStyles.maxWidth = '100%';
    }

    // Safe area para fullscreen
    if (isFullScreen) {
      baseStyles.paddingTop = insets.top;
      baseStyles.paddingBottom = insets.bottom;
    }

    return [baseStyles, contentContainerStyle];
  }, [
    theme,
    modalDimensions,
    modalPosition,
    isFullScreen,
    insets,
    contentContainerStyle,
  ]);

  // Estilos del header
  const headerStyles = useMemo(
    () => ({
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: modalPadding,
      paddingVertical: modalPadding * 0.75,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
    }),
    [theme, modalPadding],
  );

  // Header del modal
  const modalHeader = (title || headerActions || !hideCloseButton) && (
    <View style={[headerStyles, headerStyle]}>
      {title && (
        <Text
          variant="titleLarge"
          style={[styles.titleText, { color: theme.colors.onSurface }]}
          numberOfLines={1}
        >
          {title}
        </Text>
      )}
      <View style={styles.headerActions}>
        {headerActions}
        {!hideCloseButton && (
          <IconButton
            icon="close"
            size={24}
            onPress={onDismiss}
            style={{ marginRight: -responsive.spacingPreset.s }}
          />
        )}
      </View>
    </View>
  );

  // Contenido del modal
  const modalContent = (
    <View
      style={[
        styles.contentContainer,
        scrollable && styles.contentContainerScrollable,
        title && styles.contentContainerNoPadding,
        !title && { padding: modalPadding },
      ]}
    >
      {title && modalHeader}
      <View
        style={[
          styles.innerContent,
          scrollable && styles.innerContentScrollable,
          !title && styles.innerContentNoPadding,
          title && { padding: modalPadding },
        ]}
      >
        {scrollable ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        ) : (
          children
        )}
      </View>
    </View>
  );

  // Footer handling
  const modalFooter = footer && (
    <View
      style={[
        styles.footerContainer,
        {
          padding: modalPadding,
          paddingTop: modalPadding / 2,
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.surfaceVariant,
        },
        footerStyle,
      ]}
    >
      {footer}
    </View>
  );

  return (
    <>
      {visible && (
        <Portal>
          <Modal
            visible={visible}
            onDismiss={onDismiss}
            dismissable={dismissable}
            dismissableBackButton={dismissableBackButton}
            contentContainerStyle={[positionStyles, style]}
            style={[
              styles.modalContainer,
              isFullScreen && styles.modalContainerFullScreen,
            ]}
          >
            {keyboardAvoiding && Platform.OS === 'ios' ? (
              <KeyboardAvoidingView
                behavior="padding"
                style={containerStyles}
                keyboardVerticalOffset={isFullScreen ? 0 : 100}
              >
                {modalContent}
                {stickyFooter && modalFooter}
              </KeyboardAvoidingView>
            ) : (
              <View style={containerStyles}>
                {modalContent}
                {stickyFooter && modalFooter}
              </View>
            )}
          </Modal>
        </Portal>
      )}
    </>
  );
};

// Componente helper para modales de confirmación
interface ResponsiveConfirmModalProps
  extends Omit<ResponsiveModalProps, 'children'> {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  destructive?: boolean;
}

export const ResponsiveConfirmModal: React.FC<ResponsiveConfirmModalProps> = ({
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  destructive = false,
  ...modalProps
}) => {
  const theme = useAppTheme();
  const responsive = useResponsive();

  const handleCancel = () => {
    onCancel?.();
    modalProps.onDismiss();
  };

  const handleConfirm = () => {
    onConfirm();
    modalProps.onDismiss();
  };

  return (
    <ResponsiveModal
      {...modalProps}
      scrollable={false}
      maxWidthTablet={400}
      position="center"
    >
      <View style={{ paddingVertical: responsive.spacingPreset.m }}>
        <Text
          style={[
            theme.fonts.headlineSmall,
            {
              color: theme.colors.onSurface,
              marginBottom: responsive.spacingPreset.m,
            },
          ]}
        >
          {title}
        </Text>
        <Text
          style={[
            theme.fonts.bodyMedium,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          {message}
        </Text>
      </View>
      <View style={styles.buttonContainer}>
        <Button
          mode="text"
          onPress={handleCancel}
          style={styles.buttonMinWidth}
        >
          {cancelText}
        </Button>
        <Button
          mode="contained"
          onPress={handleConfirm}
          buttonColor={destructive ? theme.colors.error : undefined}
          style={styles.buttonMinWidth}
        >
          {confirmText}
        </Button>
      </View>
    </ResponsiveModal>
  );
};

// Estilos compartidos
const styles = StyleSheet.create({
  titleText: {
    fontWeight: '600',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // responsive.spacingPreset.s equivale a 8
  },
  contentContainer: {
    // Estilos base para el contenedor de contenido
  },
  contentContainerScrollable: {
    flex: 1,
  },
  contentContainerNoPadding: {
    padding: 0,
  },
  innerContent: {
    // Estilos base para el contenido interno
  },
  innerContentScrollable: {
    flex: 1,
  },
  innerContentNoPadding: {
    padding: 0,
  },
  scrollContent: {
    flexGrow: 1,
  },
  footerContainer: {
    borderTopWidth: 1,
  },
  modalContainer: {
    // Estilos base para el modal
  },
  modalContainerFullScreen: {
    margin: 0,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8, // responsive.spacingPreset.s
    marginTop: 24, // responsive.spacingPreset.l
  },
  buttonMinWidth: {
    minWidth: 80,
  },
});

// Imports necesarios para los componentes de React Native Paper
import { Button } from 'react-native-paper';
