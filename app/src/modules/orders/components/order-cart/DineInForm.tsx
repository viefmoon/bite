import React, {
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
  useMemo,
} from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Checkbox, HelperText } from 'react-native-paper';
import { ThemeDropdown, type DropdownOption } from '@/app/components/common/ThemeDropdown';
import AnimatedLabelSelector from '@/app/components/common/AnimatedLabelSelector';
import SpeechRecognitionInput from '@/app/components/common/SpeechRecognitionInput';
import { useAppTheme } from '@/app/styles/theme';
import type { Table } from '@/app/schemas/domain/table.schema';
import { useOrderFormStore } from '../../stores/useOrderFormStore';
import { useGetAreas } from '@/modules/areasTables/hooks/useAreasQueries';
import { useGetTablesByAreaId } from '@/modules/areasTables/hooks/useTablesQueries';
import { format } from 'date-fns';

interface DineInFormProps {
  onScheduleTimePress: () => void;
}

export interface DineInFormRef {
  validate: () => boolean;
}

export const DineInForm = forwardRef<DineInFormRef, DineInFormProps>(
  ({ onScheduleTimePress }, ref) => {
    const {
      selectedAreaId,
      selectedTableId,
      isTemporaryTable,
      temporaryTableName,
      orderNotes,
      scheduledTime,
      isEditMode,
      setSelectedAreaId,
      setSelectedTableId,
      setIsTemporaryTable,
      setTemporaryTableName,
      setOrderNotes,
      setScheduledTime,
    } = useOrderFormStore();
    const {
      data: areasData = [],
      isLoading: isLoadingAreas,
      error: errorAreas,
      refetch: refetchAreas,
    } = useGetAreas();
    
    const {
      data: tablesData = [],
      isLoading: isLoadingTables,
      error: errorTables,
      refetch: refetchTables,
    } = useGetTablesByAreaId(
      selectedAreaId || '',
      {},
      { enabled: !!selectedAreaId },
    );

    // Transformar áreas en opciones para el dropdown
    const areaOptions: DropdownOption[] = useMemo(() => 
      areasData.map((area: any) => ({
        id: area.id,
        label: area.name,
        disabled: false,
      })),
      [areasData]
    );

    // Transformar mesas en opciones para el dropdown
    const tableOptions: DropdownOption[] = useMemo(() => 
      tablesData.map((table: Table) => {
        const isCurrentTable = isEditMode && selectedTableId === table.id;
        const canSelect = table.isAvailable || isCurrentTable;
        
        return {
          id: table.id,
          label: table.name,
          subtitle: !table.isAvailable && !isCurrentTable ? 'Ocupada' : undefined,
          disabled: !canSelect,
          icon: table.isAvailable || isCurrentTable ? 'table-furniture' : 'table-furniture-off',
        };
      }),
      [tablesData, isEditMode, selectedTableId]
    );
    const formattedScheduledTime = scheduledTime
      ? format(scheduledTime, 'h:mm a').toLowerCase()
      : '';
    
    const theme = useAppTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    // Estados de validación
    const [areaError, setAreaError] = useState<string | null>(null);
    const [tableError, setTableError] = useState<string | null>(null);

    // Handlers
    const handleScheduleTimeClear = useCallback(() => {
      setScheduledTime(null);
    }, [setScheduledTime]);

    const handleAreaSelect = useCallback((option: DropdownOption) => {
      setSelectedAreaId(option.id);
      setAreaError(null);
      // Limpiar selección de mesa cuando se cambia el área
      if (selectedTableId) {
        setSelectedTableId(null);
      }
    }, [setSelectedAreaId, selectedTableId, setSelectedTableId]);

    const handleTableSelect = useCallback((option: DropdownOption) => {
      setSelectedTableId(option.id);
      setTableError(null);
    }, [setSelectedTableId]);

    const handleAreaOpen = useCallback(() => {
      if (refetchAreas) {
        refetchAreas();
      }
    }, [refetchAreas]);

    const handleTableOpen = useCallback(() => {
      if (selectedAreaId && refetchTables) {
        refetchTables();
      }
    }, [selectedAreaId, refetchTables]);
    // Efectos para limpiar errores
    React.useEffect(() => {
      if (selectedAreaId && areaError) {
        setAreaError(null);
      }
    }, [selectedAreaId, areaError]);

    React.useEffect(() => {
      if ((selectedTableId || (isTemporaryTable && temporaryTableName)) && tableError) {
        setTableError(null);
      }
    }, [selectedTableId, isTemporaryTable, temporaryTableName, tableError]);

    // Función de validación
    const validate = useCallback(() => {
      let isValid = true;

      if (!selectedAreaId) {
        setAreaError('Por favor selecciona un área');
        isValid = false;
      }

      if (!isTemporaryTable && !selectedTableId) {
        setTableError('Por favor selecciona una mesa');
        isValid = false;
      }

      if (isTemporaryTable && !temporaryTableName.trim()) {
        setTableError('Por favor ingresa el nombre de la mesa temporal');
        isValid = false;
      }

      return isValid;
    }, [selectedAreaId, selectedTableId, isTemporaryTable, temporaryTableName]);
    useImperativeHandle(
      ref,
      () => ({
        validate,
      }),
      [validate],
    );

    return (
      <View style={styles.container}>
        <View style={styles.selectorsRow}>
          <View style={styles.selectorContainer}>
            <ThemeDropdown
              label="Área"
              value={selectedAreaId}
              options={areaOptions}
              onSelect={handleAreaSelect}
              onOpen={handleAreaOpen}
              loading={isLoadingAreas}
              disabled={isLoadingAreas}
              error={!!areaError || !!errorAreas}
              helperText={areaError || (errorAreas ? 'Error al cargar áreas' : undefined)}
              required
              placeholder="Selecciona un área"
            />
          </View>

          <View style={styles.selectorContainer}>
            <ThemeDropdown
              label="Mesa"
              value={selectedTableId}
              options={tableOptions}
              onSelect={handleTableSelect}
              onOpen={handleTableOpen}
              loading={isLoadingTables}
              disabled={
                !selectedAreaId ||
                isLoadingTables ||
                isLoadingAreas ||
                isTemporaryTable
              }
              error={!!tableError || !!errorTables}
              helperText={
                !isTemporaryTable ? (
                  tableError || (errorTables ? 'Error al cargar mesas' : 
                  selectedAreaId && tableOptions.length === 0 && !isLoadingTables ? 
                  'No hay mesas disponibles en esta área' : undefined)
                ) : undefined
              }
              required
              placeholder="Selecciona una mesa"
            />
          </View>
        </View>

        <View style={styles.checkboxSection}>
          <TouchableOpacity
            onPress={() => {
              setIsTemporaryTable(!isTemporaryTable);
              if (tableError) setTableError(null);
            }}
            style={styles.checkboxContainer}
          >
            <Checkbox.Android
              status={isTemporaryTable ? 'checked' : 'unchecked'}
              onPress={() => {
                setIsTemporaryTable(!isTemporaryTable);
                if (tableError) setTableError(null);
              }}
              color={theme.colors.primary}
            />
            <Text style={styles.checkboxLabel}>
              {isEditMode && isTemporaryTable
                ? 'Mesa temporal'
                : 'Crear mesa temporal'}
            </Text>
          </TouchableOpacity>

          {isTemporaryTable && (
            <View style={styles.temporaryTableInputContainer}>
              <SpeechRecognitionInput
                key={`temporary-table-name-${isEditMode ? 'edit' : 'create'}`}
                label="Nombre de la Mesa Temporal *"
                value={temporaryTableName}
                onChangeText={(text) => {
                  setTemporaryTableName(text);
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
                  style={{ fontSize: 12, marginTop: 4 }}
                >
                  {tableError}
                </HelperText>
              )}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <SpeechRecognitionInput
            key="notes-input-dine-in"
            label="Notas de la Orden (Opcional)"
            value={orderNotes}
            onChangeText={setOrderNotes}
            multiline
            speechLang="es-MX"
          />
        </View>

        <View style={styles.section}>
          <AnimatedLabelSelector
            label="Programar Hora (Opcional)"
            value={formattedScheduledTime}
            onPress={onScheduleTimePress}
            onClear={handleScheduleTimeClear}
          />
        </View>
      </View>
    );
  },
);

DineInForm.displayName = 'DineInForm';

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    selectorsRow: {
      flexDirection: 'row',
      gap: theme.spacing.s,
      marginBottom: theme.spacing.s,
      paddingHorizontal: theme.spacing.xs,
    },
    selectorContainer: {
      flex: 1,
    },
    section: {
      marginBottom: theme.spacing.m,
      paddingHorizontal: theme.spacing.xs,
    },
    checkboxSection: {
      marginBottom: theme.spacing.m,
      paddingHorizontal: theme.spacing.xs,
      marginTop: -theme.spacing.xs,
    },
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.xs,
    },
    checkboxLabel: {
      fontSize: 16,
      marginLeft: theme.spacing.s,
      color: theme.colors.onSurface,
      flex: 1,
    },
    temporaryTableInputContainer: {
      marginTop: theme.spacing.s,
    },
  });
