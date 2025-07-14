import React, { ReactNode, useMemo } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { Portal } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/app/styles/theme';
import { useResponsive } from '@/app/hooks/useResponsive';

interface AdaptiveModalProps {
  visible: boolean;
  onDismiss: () => void;
  children: ReactNode;

  // Estilo
  contentContainerStyle?: any;

  // Dimensiones
  maxWidth?: number | string;
  minHeight?: number;
  maxHeight?: string;

  // Comportamiento
  dismissable?: boolean;
  dismissableBackButton?: boolean;
  scrollable?: boolean;

  // Footer
  footer?: ReactNode;
  stickyFooter?: boolean;
}

export const AdaptiveModal: React.FC<AdaptiveModalProps> = ({
  visible,
  onDismiss,
  children,
  contentContainerStyle,
  maxWidth,
  minHeight = 200,
  maxHeight = '90%',
  dismissable = true,
  dismissableBackButton = true,
  scrollable = true,
  footer,
  stickyFooter = true,
}) => {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const _insets = useSafeAreaInsets();

  const screenHeight = Dimensions.get('window').height;

  // Calcular altura máxima en píxeles
  const maxHeightPixels = useMemo(() => {
    if (typeof maxHeight === 'string' && maxHeight.endsWith('%')) {
      const percentage = parseInt(maxHeight) / 100;
      return screenHeight * percentage;
    }
    return maxHeight;
  }, [maxHeight, screenHeight]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: responsive.spacing.m,
          paddingVertical: responsive.spacing.m,
        },
        modalContainer: {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.roundness * 2,
          width: '100%',
          maxWidth: maxWidth || (responsive.isTablet ? 800 : 500),
          minWidth: responsive.isTablet ? 600 : 350,
          minHeight: minHeight,
          maxHeight: maxHeightPixels,
          overflow: 'hidden',
          elevation: 24,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 12,
          },
          shadowOpacity: 0.58,
          shadowRadius: 16.0,
        },
        scrollView: {
          flexGrow: 0,
          flexShrink: 1,
        },
        scrollContent: {
          flexGrow: 1,
        },
        contentContainer: {
          padding: responsive.isTablet
            ? responsive.spacing.xl
            : responsive.spacing.m,
        },
        footer: {
          borderTopWidth: 1,
          borderTopColor: theme.colors.surfaceVariant,
          padding: responsive.spacing.m,
          paddingTop: responsive.spacing.m,
          backgroundColor: theme.colors.surface,
        },
      }),
    [theme, responsive, minHeight, maxHeightPixels, maxWidth],
  );

  const handleBackdropPress = () => {
    if (dismissable) {
      onDismiss();
    }
  };

  const modalContent = (
    <View style={styles.modalContainer}>
      {scrollable ? (
        <>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.contentContainer, contentContainerStyle]}>
              {children}
            </View>
            {!stickyFooter && footer}
          </ScrollView>
          {stickyFooter && footer && (
            <View style={styles.footer}>{footer}</View>
          )}
        </>
      ) : (
        <>
          <View style={[styles.contentContainer, contentContainerStyle]}>
            {children}
          </View>
          {footer && <View style={styles.footer}>{footer}</View>}
        </>
      )}
    </View>
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={dismissableBackButton ? onDismiss : undefined}
      >
        <Pressable style={styles.backdrop} onPress={handleBackdropPress}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            {Platform.OS === 'ios' ? (
              <KeyboardAvoidingView behavior="padding">
                {modalContent}
              </KeyboardAvoidingView>
            ) : (
              modalContent
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </Portal>
  );
};

export default AdaptiveModal;
