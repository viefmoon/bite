import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Text,
  Menu,
  HelperText,
  Checkbox,
} from 'react-native-paper';
import AnimatedLabelSelector from '@/app/components/common/AnimatedLabelSelector';
import SpeechRecognitionInput from '@/app/components/common/SpeechRecognitionInput';
import { useAppTheme } from '@/app/styles/theme';
import type { Table } from '@/modules/areasTables/types/areasTables.types';

interface DineInFormProps {
  selectedAreaId: string | null;
  selectedAreaName: string;
  selectedTableId: string | null;
  selectedTableName: string;
  isTemporaryTable: boolean;
  temporaryTableName: string;
  orderNotes: string;
  formattedScheduledTime: string;
  areaError: string | null;
  tableError: string | null;
  areasData: any[];
  tablesData: Table[];
  isLoadingAreas: boolean;
  isLoadingTables: boolean;
  errorAreas: any;
  errorTables: any;
  isEditMode: boolean;
  orderData?: any;
  onAreaSelect: (areaId: string) => void;
  onTableSelect: (tableId: string) => void;
  onTemporaryTableToggle: (isTemporary: boolean) => void;
  onTemporaryTableNameChange: (name: string) => void;
  onNotesChange: (notes: string) => void;
  onScheduleTimePress: () => void;
  onScheduleTimeClear: () => void;
  setAreaError: (error: string | null) => void;
  setTableError: (error: string | null) => void;
}

export const DineInForm: React.FC<DineInFormProps> = ({
  selectedAreaId,
  selectedAreaName,
  selectedTableId,
  selectedTableName,
  isTemporaryTable,
  temporaryTableName,
  orderNotes,
  formattedScheduledTime,
  areaError,
  tableError,
  areasData,
  tablesData,
  isLoadingAreas,
  isLoadingTables,
  errorAreas,
  errorTables,
  isEditMode,
  orderData,
  onAreaSelect,
  onTableSelect,
  onTemporaryTableToggle,
  onTemporaryTableNameChange,
  onNotesChange,
  onScheduleTimePress,
  onScheduleTimeClear,
  setAreaError,
  setTableError,
}) => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const [areaMenuVisible, setAreaMenuVisible] = useState(false);
  const [tableMenuVisible, setTableMenuVisible] = useState(false);

  return (
    <>
      {/* 1. Área */}
      <View style={styles.selectorsRow}>
        <View style={styles.selectorContainer}>
          <Menu
            visible={areaMenuVisible}
            onDismiss={() => setAreaMenuVisible(false)}
            anchor={
              <AnimatedLabelSelector
                label="Área *"
                value={selectedAreaName}
                onPress={() => setAreaMenuVisible(true)}
                isLoading={isLoadingAreas}
                error={!!areaError || !!errorAreas}
                disabled={isLoadingAreas}
              />
            }
          >
            {areasData?.map((area: any) => (
              <Menu.Item
                key={area.id}
                onPress={() => {
                  onAreaSelect(area.id);
                  setAreaMenuVisible(false);
                  setAreaError(null);
                }}
                title={area.name}
              />
            ))}
            {errorAreas && (
              <Menu.Item title="Error al cargar áreas" disabled />
            )}
          </Menu>
          {areaError && !errorAreas && (
            <HelperText
              type="error"
              visible={true}
              style={styles.helperText}
            >
              {areaError}
            </HelperText>
          )}
          {errorAreas && (
            <HelperText
              type="error"
              visible={true}
              style={styles.helperText}
            >
              Error al cargar áreas
            </HelperText>
          )}
        </View>

        {/* 2. Mesa */}
        <View style={styles.selectorContainer}>
          <Menu
            visible={tableMenuVisible}
            onDismiss={() => setTableMenuVisible(false)}
            anchor={
              <AnimatedLabelSelector
                label="Mesa *"
                value={selectedTableName}
                onPress={() => setTableMenuVisible(true)}
                isLoading={isLoadingTables}
                error={!!tableError || !!errorTables}
                disabled={
                  !selectedAreaId ||
                  isLoadingTables ||
                  isLoadingAreas ||
                  isTemporaryTable
                }
              />
            }
          >
            {tablesData?.map((table: Table) => {
              // En modo edición, permitir seleccionar la mesa actual aunque esté ocupada
              const isCurrentTable =
                isEditMode && orderData?.tableId === table.id;
              const canSelect = table.isAvailable || isCurrentTable;

              return (
                <Menu.Item
                  key={table.id}
                  onPress={() => {
                    if (canSelect) {
                      onTableSelect(table.id);
                      setTableMenuVisible(false);
                      setTableError(null);
                    }
                  }}
                  title={`${table.name}${!table.isAvailable && !isCurrentTable ? ' (Ocupada)' : ''}`}
                  disabled={!canSelect}
                  titleStyle={
                    !canSelect ? { color: theme.colors.error } : undefined
                  }
                />
              );
            })}
            {selectedAreaId &&
              tablesData?.length === 0 &&
              !isLoadingTables &&
              !errorTables && <Menu.Item title="No hay mesas" disabled />}
            {errorTables && (
              <Menu.Item title="Error al cargar mesas" disabled />
            )}
          </Menu>
          {tableError && !errorTables && !isTemporaryTable && (
            <HelperText
              type="error"
              visible={true}
              style={styles.helperText}
            >
              {tableError}
            </HelperText>
          )}
          {errorTables && (
            <HelperText
              type="error"
              visible={true}
              style={styles.helperText}
            >
              Error al cargar mesas
            </HelperText>
          )}
        </View>
      </View>

      {/* Opción de mesa temporal */}
      <View style={[styles.section, styles.fieldContainer]}>
        <TouchableOpacity
          onPress={() => {
            onTemporaryTableToggle(!isTemporaryTable);
            if (!isTemporaryTable) {
              // Si activamos mesa temporal, limpiar la selección de mesa
              onTableSelect('');
              setTableError(null);
            } else {
              // Si desactivamos mesa temporal, limpiar el nombre
              onTemporaryTableNameChange('');
            }
          }}
          style={styles.checkboxContainer}
        >
          <Checkbox.Android
            status={isTemporaryTable ? 'checked' : 'unchecked'}
            onPress={() => {
              onTemporaryTableToggle(!isTemporaryTable);
              if (!isTemporaryTable) {
                // Si activamos mesa temporal, limpiar la selección de mesa
                onTableSelect('');
                setTableError(null);
              } else {
                // Si desactivamos mesa temporal, limpiar el nombre
                onTemporaryTableNameChange('');
              }
            }}
            color={theme.colors.primary}
          />
          <Text style={styles.checkboxLabel}>
            {isEditMode && isTemporaryTable
              ? 'Mesa temporal'
              : 'Crear mesa temporal'}
          </Text>
        </TouchableOpacity>

        {/* Campo para nombre de mesa temporal */}
        {isTemporaryTable && (
          <View style={styles.temporaryTableInputContainer}>
            <SpeechRecognitionInput
              key={`temporary-table-name-${isEditMode ? 'edit' : 'create'}`}
              label="Nombre de la Mesa Temporal *"
              value={temporaryTableName}
              onChangeText={(text) => {
                onTemporaryTableNameChange(text);
                if (tableError) setTableError(null);
              }}
              error={!!tableError && isTemporaryTable}
              speechLang="es-MX"
              autoCapitalize="words"
              autoCorrect={false}
              placeholder="Ej: Mesa Terraza 1"
              editable={true}
            />
            {tableError && isTemporaryTable && (
              <HelperText
                type="error"
                visible={true}
                style={styles.helperText}
              >
                {tableError}
              </HelperText>
            )}
          </View>
        )}
      </View>

      {/* 3. Notas */}
      <View style={[styles.section, styles.fieldContainer]}>
        <SpeechRecognitionInput
          key="notes-input-dine-in"
          label="Notas de la Orden (Opcional)"
          value={orderNotes}
          onChangeText={onNotesChange}
          multiline
          speechLang="es-MX"
        />
      </View>

      {/* 4. Programar Hora */}
      <View style={[styles.section, styles.fieldContainer]}>
        <AnimatedLabelSelector
          label="Programar Hora (Opcional)"
          value={formattedScheduledTime}
          onPress={onScheduleTimePress}
          onClear={onScheduleTimeClear}
        />
      </View>
    </>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    selectorsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.xs,
      marginBottom: theme.spacing.xs,
    },
    selectorContainer: {
      flex: 1,
      marginHorizontal: theme.spacing.xxs,
    },
    section: {
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.xs,
      marginBottom: theme.spacing.xs,
    },
    fieldContainer: {
      marginBottom: theme.spacing.xs,
    },
    helperText: {
      fontSize: 12,
      paddingHorizontal: 0,
      paddingTop: 0,
      marginTop: -4,
    },
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.s,
      marginBottom: theme.spacing.xs,
    },
    checkboxLabel: {
      fontSize: 16,
      marginLeft: theme.spacing.xs,
      color: theme.colors.onSurface,
    },
    temporaryTableInputContainer: {
      marginTop: theme.spacing.xs,
      marginBottom: theme.spacing.s,
    },
  });