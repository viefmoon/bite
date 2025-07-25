import React, { ReactNode, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Modal, Portal } from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import { useResponsive } from '@/app/hooks/useResponsive';

interface AdaptiveModalProps {
  visible: boolean;
  onDismiss: () => void;
  children: ReactNode;
  contentContainerStyle?: any;
  maxWidth?: number | string;
  minHeight?: number;
  maxHeight?: string | number;
  dismissable?: boolean;
  dismissableBackButton?: boolean;
  scrollable?: boolean;
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
  const screenHeight = Dimensions.get('window').height;

  const maxHeightPixels = useMemo(() => {
    if (typeof maxHeight === 'string' && maxHeight.endsWith('%')) {
      const percentage = parseInt(maxHeight) / 100;
      return screenHeight * percentage;
    }
    return typeof maxHeight === 'number' ? maxHeight : screenHeight * 0.9;
  }, [maxHeight, screenHeight]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        modalContainer: {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.roundness * 2,
          width: '90%',
          maxWidth: maxWidth || (responsive.isTablet ? 600 : 500),
          minHeight: minHeight,
          maxHeight: maxHeightPixels,
          alignSelf: 'center',
          overflow: 'hidden',
          elevation: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.58,
          shadowRadius: 16.0,
        },
        scrollView: {
          maxHeight: maxHeightPixels - (footer ? 100 : 20),
        },
        scrollContent: {
          padding: responsive.isTablet
            ? responsive.spacing.l
            : responsive.spacing.m,
        },
        contentPadding: {
          padding: responsive.isTablet
            ? responsive.spacing.l
            : responsive.spacing.m,
          flex: 1,
        },
        footer: {
          borderTopWidth: 1,
          borderTopColor: theme.colors.surfaceVariant,
          padding: responsive.spacing.m,
          backgroundColor: theme.colors.surface,
        },
      }),
    [theme, responsive, minHeight, maxHeightPixels, maxWidth, footer],
  );

  const modalContent = (
    <View style={styles.modalContainer}>
      {scrollable ? (
        <>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              contentContainerStyle,
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
          {stickyFooter && footer && (
            <View style={styles.footer}>{footer}</View>
          )}
        </>
      ) : (
        <>
          <View style={[styles.contentPadding, contentContainerStyle]}>
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
        onDismiss={onDismiss}
        dismissable={dismissable}
        dismissableBackButton={dismissableBackButton}
        contentContainerStyle={{
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1,
        }}
      >
        {Platform.OS === 'ios' ? (
          <KeyboardAvoidingView behavior="position" keyboardVerticalOffset={20}>
            {modalContent}
          </KeyboardAvoidingView>
        ) : (
          modalContent
        )}
      </Modal>
    </Portal>
  );
};

export default AdaptiveModal;
