import React, { useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Icon, Badge } from 'react-native-paper';
import { useAppTheme } from '../styles/theme';
import { shiftsService, type Shift } from '@/services/shifts';
import { useAuthStore } from '../store/authStore';
import { canOpenShift } from '../utils/roleUtils';
import { OpenShiftModal } from '@/modules/orders/components/OpenShiftModal';
import { ShiftStatusModal } from '@/modules/orders/components/ShiftStatusModal';
import { CloseShiftModal } from '@/modules/orders/components/CloseShiftModal';

export const ShiftIndicator: React.FC = () => {
  const theme = useAppTheme();
  const user = useAuthStore((state) => state.user);
  const [shift, setShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [openShiftModalVisible, setOpenShiftModalVisible] = useState(false);
  const [closeShiftModalVisible, setCloseShiftModalVisible] = useState(false);

  const userCanOpenShift = canOpenShift(user);
  const isShiftOpen = shift && shift.status === 'OPEN';

  const loadShift = async () => {
    try {
      setLoading(true);
      const currentShift = await shiftsService.getCurrentShift();
      setShift(currentShift);
    } catch (error) {
      // Error silencioso, el indicador mostrará estado de carga/cerrado
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShift();
  }, []);

  const handlePress = () => {
    setStatusModalVisible(true);
  };

  const handleOpenShift = () => {
    setStatusModalVisible(false);
    setOpenShiftModalVisible(true);
  };

  const handleCloseShift = () => {
    setStatusModalVisible(false);
    setCloseShiftModalVisible(true);
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
          {
            backgroundColor: loading
              ? 'rgba(255, 255, 255, 0.2)'
              : isShiftOpen
                ? '#2E7D32' // Verde oscuro sólido
                : '#F57C00', // Naranja oscuro sólido
            borderWidth: 2,
            borderColor: loading
              ? 'rgba(255, 255, 255, 0.3)'
              : isShiftOpen
                ? '#4CAF50' // Verde más claro para el borde
                : '#FF9800', // Naranja más claro para el borde
          },
        ]}
        onPress={handlePress}
        disabled={loading}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Icon source={getIconName()} size={22} color={getIconColor()} />
        <Text style={[styles.statusText, { color: getIconColor() }]}>
          {loading ? 'Cargando' : isShiftOpen ? 'ABIERTO' : 'CERRADO'}
        </Text>
        {!isShiftOpen && !loading && (
          <Badge
            style={[styles.badge, { backgroundColor: '#FF1744' }]}
            size={8}
          />
        )}
      </TouchableOpacity>

      <ShiftStatusModal
        visible={statusModalVisible}
        onDismiss={() => setStatusModalVisible(false)}
        shift={shift}
        onOpenShift={handleOpenShift}
        onCloseShift={handleCloseShift}
        canOpenShift={userCanOpenShift}
        loading={loading}
      />

      <OpenShiftModal
        visible={openShiftModalVisible}
        onDismiss={() => setOpenShiftModalVisible(false)}
        onShiftOpened={() => {
          loadShift();
          setOpenShiftModalVisible(false);
        }}
      />

      <CloseShiftModal
        visible={closeShiftModalVisible}
        onDismiss={() => setCloseShiftModalVisible(false)}
        onShiftClosed={() => {
          loadShift();
          setCloseShiftModalVisible(false);
        }}
        shift={shift}
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
});
