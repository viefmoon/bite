import { ReactNode, useMemo } from 'react';
import { Modal, Portal } from 'react-native-paper';
import {
  ScrollView,
  ViewStyle,
  StyleProp,
  View,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useResponsive } from '@/app/hooks/useResponsive';
import { useAppTheme } from '@/app/styles/theme';

interface ResponsiveModalProps {
  visible: boolean;
  onDismiss: () => void;
  children: ReactNode;

  // Dimensiones básicas
  maxWidth?: number | string;
  maxHeight?: number | string;
  
  // Comportamiento
  dismissable?: boolean;
  scrollable?: boolean;
  fullScreen?: boolean;
  position?: 'center' | 'bottom' | 'top';

  // Estilos
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  visible,
  onDismiss,
  children,
  maxWidth,
  maxHeight = '85%',
  dismissable = true,
  scrollable = true,
  fullScreen = false,
  position = 'center',
  contentContainerStyle,
}) => {
  const responsive = useResponsive();
  const theme = useAppTheme();

  // Calcular dimensiones del modal
  const modalDimensions = useMemo(() => {
    const dims: ViewStyle = {};

    if (fullScreen) {
      dims.width = '100%';
      dims.height = '100%';
      dims.maxWidth = '100%';
      dims.maxHeight = '100%';
    } else {
      // Ancho por defecto responsive
      dims.width = responsive.isTablet ? '80%' : '92%';
      dims.maxWidth = maxWidth as any || (responsive.isTablet ? 600 : '100%');
      
      // Altura - dejar que crezca con el contenido hasta maxHeight
      dims.maxHeight = maxHeight as any;
      
      // Mínimo para evitar modales microscópicos
      dims.minHeight = 100;
    }

    return dims;
  }, [fullScreen, responsive.isTablet, maxWidth, maxHeight]);

  // Estilos de posición
  const positionStyles = useMemo(() => {
    const styles: ViewStyle = {};
    switch (position) {
      case 'bottom':
        styles.justifyContent = 'flex-end';
        break;
      case 'top':
        styles.justifyContent = 'flex-start';
        break;
      default:
        styles.justifyContent = 'center';
        styles.alignItems = 'center';
    }
    return styles;
  }, [position]);

  // Padding del contenido
  const contentPadding = responsive.spacing(
    responsive.isTablet ? theme.spacing.l : theme.spacing.m
  );

  // Estilos del contenedor principal
  const containerStyles: ViewStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: fullScreen ? 0 : theme.roundness * 2,
    ...modalDimensions,
    overflow: 'hidden',
  };

  // Ajustes para posiciones bottom/top
  if (!fullScreen) {
    if (position === 'bottom') {
      containerStyles.borderBottomLeftRadius = 0;
      containerStyles.borderBottomRightRadius = 0;
      containerStyles.width = '100%';
      containerStyles.maxWidth = '100%';
    } else if (position === 'top') {
      containerStyles.borderTopLeftRadius = 0;
      containerStyles.borderTopRightRadius = 0;
      containerStyles.width = '100%';
      containerStyles.maxWidth = '100%';
    }
  }

  // Contenido del modal
  const modalContent = scrollable ? (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.scrollContent,
        { padding: contentPadding }
      ]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={{ padding: contentPadding }}>
      {children}
    </View>
  );

  const ModalWrapper = Platform.OS === 'ios' ? KeyboardAvoidingView : View;
  const keyboardAvoidingProps = Platform.OS === 'ios' 
    ? { behavior: 'padding' as const, keyboardVerticalOffset: fullScreen ? 0 : 100 }
    : {};

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        dismissable={dismissable}
        dismissableBackButton={dismissable}
        contentContainerStyle={positionStyles}
        style={fullScreen ? styles.fullScreenModal : undefined}
      >
        <ModalWrapper
          style={[containerStyles, contentContainerStyle]}
          {...keyboardAvoidingProps}
        >
          {modalContent}
        </ModalWrapper>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  fullScreenModal: {
    margin: 0,
  },
});

