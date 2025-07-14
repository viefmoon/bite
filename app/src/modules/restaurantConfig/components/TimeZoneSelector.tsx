import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import {
  Text,
  Portal,
  Modal,
  Searchbar,
  List,
  Divider,
  Surface,
  IconButton,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme, AppTheme } from '@/app/styles/theme';

interface TimeZoneSelectorProps {
  value: string;
  onChange: (timezone: string) => void;
  disabled?: boolean;
}

// Lista de zonas horarias comunes en América
const TIMEZONES = [
  // México
  { value: 'America/Mexico_City', label: 'Ciudad de México', offset: 'UTC-6' },
  { value: 'America/Tijuana', label: 'Tijuana', offset: 'UTC-8' },
  { value: 'America/Cancun', label: 'Cancún', offset: 'UTC-5' },
  { value: 'America/Hermosillo', label: 'Hermosillo', offset: 'UTC-7' },
  { value: 'America/Monterrey', label: 'Monterrey', offset: 'UTC-6' },
  { value: 'America/Mazatlan', label: 'Mazatlán', offset: 'UTC-7' },
  { value: 'America/Chihuahua', label: 'Chihuahua', offset: 'UTC-7' },

  // Estados Unidos
  { value: 'America/New_York', label: 'Nueva York', offset: 'UTC-5' },
  { value: 'America/Chicago', label: 'Chicago', offset: 'UTC-6' },
  { value: 'America/Denver', label: 'Denver', offset: 'UTC-7' },
  { value: 'America/Los_Angeles', label: 'Los Ángeles', offset: 'UTC-8' },
  { value: 'America/Phoenix', label: 'Phoenix', offset: 'UTC-7' },

  // Centroamérica
  { value: 'America/Guatemala', label: 'Guatemala', offset: 'UTC-6' },
  { value: 'America/El_Salvador', label: 'El Salvador', offset: 'UTC-6' },
  { value: 'America/Tegucigalpa', label: 'Honduras', offset: 'UTC-6' },
  { value: 'America/Managua', label: 'Nicaragua', offset: 'UTC-6' },
  { value: 'America/Costa_Rica', label: 'Costa Rica', offset: 'UTC-6' },
  { value: 'America/Panama', label: 'Panamá', offset: 'UTC-5' },

  // Sudamérica
  { value: 'America/Bogota', label: 'Bogotá', offset: 'UTC-5' },
  { value: 'America/Lima', label: 'Lima', offset: 'UTC-5' },
  { value: 'America/Quito', label: 'Quito', offset: 'UTC-5' },
  { value: 'America/Caracas', label: 'Caracas', offset: 'UTC-4' },
  { value: 'America/La_Paz', label: 'La Paz', offset: 'UTC-4' },
  { value: 'America/Santiago', label: 'Santiago', offset: 'UTC-3' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires', offset: 'UTC-3' },
  { value: 'America/Sao_Paulo', label: 'São Paulo', offset: 'UTC-3' },
  { value: 'America/Montevideo', label: 'Montevideo', offset: 'UTC-3' },
  { value: 'America/Asuncion', label: 'Asunción', offset: 'UTC-3' },

  // Caribe
  { value: 'America/Havana', label: 'La Habana', offset: 'UTC-5' },
  { value: 'America/Santo_Domingo', label: 'Santo Domingo', offset: 'UTC-4' },
  { value: 'America/Puerto_Rico', label: 'Puerto Rico', offset: 'UTC-4' },
];

const TimeZoneSelector: React.FC<TimeZoneSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [visible, setVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedTimeZone = useMemo(
    () => TIMEZONES.find((tz) => tz.value === value) || TIMEZONES[0],
    [value],
  );

  const filteredTimeZones = useMemo(() => {
    if (!searchQuery.trim()) return TIMEZONES;

    const query = searchQuery.toLowerCase();
    return TIMEZONES.filter(
      (tz) =>
        tz.label.toLowerCase().includes(query) ||
        tz.value.toLowerCase().includes(query) ||
        tz.offset.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  const handleSelect = (timezone: string) => {
    onChange(timezone);
    setVisible(false);
    setSearchQuery('');
  };

  const renderTimeZoneItem = ({ item }: { item: (typeof TIMEZONES)[0] }) => (
    <>
      <List.Item
        title={item.label}
        description={`${item.value} (${item.offset})`}
        onPress={() => handleSelect(item.value)}
        left={(props) => <List.Icon {...props} icon="clock-outline" />}
        right={(props) =>
          item.value === value ? (
            <List.Icon {...props} icon="check" color={theme.colors.primary} />
          ) : null
        }
        style={[styles.listItem, item.value === value && styles.selectedItem]}
        titleStyle={[
          styles.listItemTitle,
          item.value === value && styles.selectedItemText,
        ]}
        descriptionStyle={styles.listItemDescription}
      />
      <Divider />
    </>
  );

  return (
    <>
      <TouchableOpacity
        style={[styles.selector, disabled && styles.selectorDisabled]}
        onPress={() => !disabled && setVisible(true)}
        disabled={disabled}
      >
        <View style={styles.selectorContent}>
          <MaterialCommunityIcons
            name="earth"
            size={24}
            color={
              disabled ? theme.colors.onSurfaceDisabled : theme.colors.primary
            }
          />
          <View style={styles.textContainer}>
            <Text style={[styles.label, disabled && styles.labelDisabled]}>
              Zona Horaria
            </Text>
            <Text style={[styles.value, disabled && styles.valueDisabled]}>
              {selectedTimeZone.label}
            </Text>
            <Text style={[styles.offset, disabled && styles.offsetDisabled]}>
              {selectedTimeZone.offset}
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-down"
            size={24}
            color={
              disabled
                ? theme.colors.onSurfaceDisabled
                : theme.colors.onSurfaceVariant
            }
          />
        </View>
      </TouchableOpacity>

      <Portal>
        <Modal
          visible={visible}
          onDismiss={() => {
            setVisible(false);
            setSearchQuery('');
          }}
          contentContainerStyle={styles.modal}
        >
          <Surface style={styles.modalContent} elevation={3}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Zona Horaria</Text>
              <IconButton
                icon="close"
                size={24}
                onPress={() => {
                  setVisible(false);
                  setSearchQuery('');
                }}
              />
            </View>

            <Searchbar
              placeholder="Buscar zona horaria..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchbar}
              inputStyle={styles.searchbarInput}
              icon="magnify"
              clearIcon="close"
            />

            <FlatList
              data={filteredTimeZones}
              renderItem={renderTimeZoneItem}
              keyExtractor={(item) => item.value}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={true}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons
                    name="magnify-close"
                    size={48}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <Text style={styles.emptyText}>
                    No se encontraron zonas horarias
                  </Text>
                </View>
              }
            />
          </Surface>
        </Modal>
      </Portal>
    </>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    selector: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 12,
      padding: theme.spacing.m,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    selectorDisabled: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.surfaceVariant,
    },
    selectorContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.m,
    },
    textContainer: {
      flex: 1,
    },
    label: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 2,
    },
    labelDisabled: {
      color: theme.colors.onSurfaceDisabled,
    },
    value: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    valueDisabled: {
      color: theme.colors.onSurfaceDisabled,
      fontWeight: '500',
    },
    offset: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    offsetDisabled: {
      color: theme.colors.onSurfaceDisabled,
    },
    modal: {
      margin: theme.spacing.l,
      justifyContent: 'center',
    },
    modalContent: {
      borderRadius: 16,
      maxHeight: '80%',
      backgroundColor: theme.colors.surface,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.l,
      paddingTop: theme.spacing.l,
      paddingBottom: theme.spacing.s,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    searchbar: {
      marginHorizontal: theme.spacing.l,
      marginBottom: theme.spacing.m,
      elevation: 0,
      backgroundColor: theme.colors.surfaceVariant,
    },
    searchbarInput: {
      fontSize: 14,
    },
    list: {
      maxHeight: 400,
    },
    listContent: {
      paddingBottom: theme.spacing.m,
    },
    listItem: {
      paddingHorizontal: theme.spacing.l,
    },
    selectedItem: {
      backgroundColor: theme.colors.primaryContainer,
    },
    listItemTitle: {
      fontSize: 16,
      color: theme.colors.onSurface,
    },
    selectedItemText: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    listItemDescription: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.xl * 2,
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
      marginTop: theme.spacing.m,
    },
  });

export default TimeZoneSelector;
