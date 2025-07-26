import { useState } from 'react';
import { TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Icon, Badge } from 'react-native-paper';
import { useAppTheme } from '../styles/theme';
import { useAuthStore } from '../store/authStore';
import { canOpenShift } from '../utils/roleUtils';
import { ShiftActionModal } from '@/modules/orders/components/ShiftActionModal';
import { ShiftStatusModal } from '@/modules/orders/components/ShiftStatusModal';
import type { Shift } from '@/services/shifts';
import { useGlobalShift } from '../hooks/useGlobalShift';
import { useQueryClient } from '@tanstack/react-query';

export const ShiftIndicator = () => {
  const theme = useAppTheme();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const { data: shift, isLoading: loading } = useGlobalShift();

  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [shiftModalVisible, setShiftModalVisible] = useState(false);
  const [shiftModalMode, setShiftModalMode] = useState<'open' | 'close'>(
    'open',
  );

  const userCanOpenShift = canOpenShift(user);
  const isShiftOpen = shift && (shift as Shift).status === 'OPEN';

  const handlePress = () => {
    // No refrescamos aquí porque ya se actualiza automáticamente
    setStatusModalVisible(true);
  };

  const handleOpenShift = () => {
    setStatusModalVisible(false);
    setShiftModalMode('open');
    setShiftModalVisible(true);
  };

  const handleCloseShift = () => {
    setStatusModalVisible(false);
    setShiftModalMode('close');
    setShiftModalVisible(true);
  };

  const getIconColor = () => {
    if (loading) return theme.colors.onPrimary;
    return '#FFFFFF';
  };

  const getIconName = () => {
    if (loading) return 'clock-outline';
    if (isShiftOpen) return 'store-check';
    return 'store-alert';
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.container,
          loading && styles.loadingContainer,
          isShiftOpen && !loading && styles.openContainer,
          !isShiftOpen && !loading && styles.closedContainer,
        ]}
        onPress={handlePress}
        disabled={loading}
        hitSlop={styles.hitSlop}
      >
        <Icon source={getIconName()} size={22} color={getIconColor()} />
        <Text style={[styles.statusText, { color: getIconColor() }]}>
          {loading ? 'Cargando' : isShiftOpen ? 'ABIERTO' : 'CERRADO'}
        </Text>
        {!isShiftOpen && !loading && (
          <Badge style={[styles.badge, styles.alertBadge]} size={8} />
        )}
      </TouchableOpacity>

      <ShiftStatusModal
        visible={statusModalVisible}
        onDismiss={() => setStatusModalVisible(false)}
        shift={shift ?? null}
        onOpenShift={handleOpenShift}
        onCloseShift={handleCloseShift}
        canOpenShift={userCanOpenShift}
        loading={loading}
      />

      <ShiftActionModal
        visible={shiftModalVisible}
        onDismiss={() => setShiftModalVisible(false)}
        mode={shiftModalMode}
        shift={shift}
        onShiftOpened={() => {
          queryClient.invalidateQueries({
            queryKey: ['global', 'shift', 'current'],
          });
          setShiftModalVisible(false);
        }}
        onShiftClosed={() => {
          queryClient.invalidateQueries({
            queryKey: ['global', 'shift', 'current'],
          });
          setShiftModalVisible(false);
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderRadius: 24,
    gap: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 2,
  },
  loadingContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  openContainer: {
    backgroundColor: '#2E7D32', // Verde oscuro sólido
    borderColor: '#4CAF50', // Verde más claro para el borde
  },
  closedContainer: {
    backgroundColor: '#F57C00', // Naranja oscuro sólido
    borderColor: '#FF9800', // Naranja más claro para el borde
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  alertBadge: {
    backgroundColor: '#FF1744',
  },
  hitSlop: {
    top: 10,
    bottom: 10,
    left: 10,
    right: 10,
  },
});
