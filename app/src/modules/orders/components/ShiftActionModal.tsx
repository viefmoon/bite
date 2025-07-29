import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/app/styles/theme';
import { ResponsiveModal } from '@/app/components/responsive/ResponsiveModal';
import { useResponsive } from '@/app/hooks/useResponsive';
import type { Shift } from '@/app/schemas/domain/shift.schema';
import { useShiftAction } from '../hooks/useShiftAction';
import { ShiftSummaryCard } from './ShiftSummaryCard';
import { ShiftActionForm } from './ShiftActionForm';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type ShiftActionMode = 'open' | 'close';

interface ShiftActionModalProps {
  visible: boolean;
  onDismiss: () => void;
  mode: ShiftActionMode;
  shift?: Shift | null;
  onShiftOpened?: () => void;
  onShiftClosed?: () => void;
}

export const ShiftActionModal: React.FC<ShiftActionModalProps> = ({
  visible,
  onDismiss,
  mode,
  shift,
  onShiftOpened,
  onShiftClosed,
}) => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const {
    // Estado
    cashAmount,
    notes,
    loading,
    error,
    isOpenMode,

    // Funciones
    handleCashAmountChange,
    handleSubmit,
    resetForm,
    calculateDifference,
    formatCurrency,
    formatTime,
    handleNotesChange,
  } = useShiftAction({
    mode,
    shift,
  });

  const handleShiftAction = async () => {
    const success = await handleSubmit();
    if (success) {
      if (isOpenMode) {
        onShiftOpened?.();
      } else {
        onShiftClosed?.();
      }
      onDismiss();
    }
  };

  const handleDismiss = () => {
    if (!loading) {
      resetForm();
      onDismiss();
    }
  };
  const today = new Date();
  const todayFormatted = format(today, "EEEE, d 'de' MMMM 'de' yyyy", {
    locale: es,
  });

  const config = {
    open: {
      title: 'Apertura de Turno',
      icon: 'store-check',
      iconColor: theme.colors.primary,
      buttonText: 'Abrir Turno',
      buttonIcon: 'play-circle',
      buttonColor: theme.colors.primary,
    },
    close: {
      title: 'Cierre de Turno',
      icon: 'store-off',
      iconColor: '#FF5722',
      buttonText: 'Cerrar Turno',
      buttonIcon: 'stop-circle',
      buttonColor: '#FF5722',
    },
  }[mode];

  return (
    <ResponsiveModal
      visible={visible}
      onDismiss={handleDismiss}
      dismissable={!loading}
      title={config.title}
      maxWidthPercent={85}
      maxHeightPercent={85}
      isLoading={loading}
      actions={[
        {
          label: 'Cancelar',
          mode: 'outlined',
          onPress: handleDismiss,
          disabled: loading,
          colorPreset: 'secondary',
        },
        {
          label: config.buttonText,
          mode: 'contained',
          onPress: handleShiftAction,
          loading: loading,
          disabled: loading,
          icon: config.buttonIcon,
          colorPreset: isOpenMode ? 'primary' : 'warning',
        },
      ]}
    >
      <View style={[styles.header, !isOpenMode && styles.closeHeader]}>
        <View
          style={[
            styles.iconContainer,
            !isOpenMode && styles.closeIconContainer,
          ]}
        >
          <MaterialCommunityIcons
            name={config.icon as any}
            size={48}
            color={config.iconColor}
          />
        </View>
        <Text variant="bodyLarge" style={styles.date}>
          {todayFormatted}
        </Text>
      </View>

      <Divider style={styles.divider} />

      <View style={styles.content}>
        {!isOpenMode && shift && (
          <ShiftSummaryCard
            shift={shift}
            formatTime={formatTime}
            formatCurrency={formatCurrency}
          />
        )}

        <ShiftActionForm
          mode={mode}
          cashAmount={cashAmount}
          onCashAmountChange={handleCashAmountChange}
          notes={notes}
          onNotesChange={handleNotesChange}
          error={error}
          loading={loading}
          shift={shift}
          calculateDifference={calculateDifference}
          formatCurrency={formatCurrency}
        />
      </View>
    </ResponsiveModal>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    header: {
      alignItems: 'center',
      paddingTop: theme.spacing.xl,
      paddingHorizontal: theme.spacing.l,
      paddingBottom: theme.spacing.l,
    },
    closeHeader: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.primaryContainer,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.m,
    },
    closeIconContainer: {
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: theme.colors.surface,
      borderWidth: 3,
      borderColor: '#FF5722',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    date: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      textTransform: 'capitalize',
    },
    divider: {
      backgroundColor: theme.colors.outlineVariant,
      height: 1,
    },
    content: {
      padding: theme.spacing.l,
    },
  });
