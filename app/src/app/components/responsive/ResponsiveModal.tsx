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
  
  // Diseño
  showHeader?: boolean;
  title?: string;
  headerRight?: ReactNode;

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
  showHeader = false,
  title,
  headerRight,
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
      // Ancho responsive
      dims.width = responsive.isTablet ? '80%' : '92%';
      dims.maxWidth = (maxWidth || (responsive.isTablet ? 600 : '100%')) as any;
      
      dims.minHeight = 300;
      dims.maxHeight = maxHeight as any;
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
    borderRadius: fullScreen ? 0 : theme.roundness * 3,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    ...modalDimensions,
    overflow: 'hidden',
    // Sombra para separación visual
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
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
  const modalContent = (
    <View style={styles.modalInner}>
      {/* Header opcional */}
      {showHeader && (title || headerRight) && (
        <View style={[styles.headerContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
          <View style={[styles.header, { paddingHorizontal: contentPadding }]}>
            {title && (
              <Text variant="titleLarge" style={styles.headerTitle} numberOfLines={1}>
                {title}
              </Text>
            )}
            {headerRight || (
              <IconButton
                icon="close"
                size={22}
                onPress={onDismiss}
                style={styles.closeIcon}
              />
            )}
          </View>
        </View>
      )}

      {/* Contenido principal */}
      {scrollable ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { padding: contentPadding }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, { padding: contentPadding }]}>
          {children}
        </View>
      )}
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
  modalInner: {
    maxHeight: '100%',
  },
  scrollView: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  content: {
    paddingBottom: 10,
  },
  fullScreenModal: {
    margin: 0,
  },
  headerContainer: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    minHeight: 48,
  },
  headerTitle: {
    flex: 1,
    fontWeight: '600',
  },
  closeIcon: {
    margin: -6,
  },
});

