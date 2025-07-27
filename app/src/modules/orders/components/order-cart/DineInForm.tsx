import React, {
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Menu, HelperText, Checkbox } from 'react-native-paper';
import AnimatedLabelSelector from '@/app/components/common/AnimatedLabelSelector';
import SpeechRecognitionInput from '@/app/components/common/SpeechRecognitionInput';
import { useAppTheme } from '@/app/styles/theme';
import type { Table } from '@/app/schemas/domain/table.schema';
import { useOrderStore } from '../../stores/useOrderStore';
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
    } = useOrderStore();
    const {
      data: areasData = [],
      isLoading: isLoadingAreas,
      error: errorAreas,
    } = useGetAreas();
    const {
      data: tablesData = [],
      isLoading: isLoadingTables,
      error: errorTables,
    } = useGetTablesByAreaId(
      selectedAreaId || '',
      {},
      { enabled: !!selectedAreaId },
    );
    const selectedAreaName =
      areasData.find((a: any) => a.id === selectedAreaId)?.name ||
      'Selecciona un área';
    const selectedTableName =
      tablesData.find((t: Table) => t.id === selectedTableId)?.name ||
      'Selecciona una mesa';
    const formattedScheduledTime = scheduledTime
      ? format(scheduledTime, 'h:mm a').toLowerCase()
      : '';
    const theme = useAppTheme();
    const styles = React.useMemo(() => createStyles(theme), [theme]);
    const [areaMenuVisible, setAreaMenuVisible] = useState(false);
    const [tableMenuVisible, setTableMenuVisible] = useState(false);
    const [areaError, setAreaError] = useState<string | null>(null);
    const [tableError, setTableError] = useState<string | null>(null);
    const handleScheduleTimeClear = () => {
      setScheduledTime(null);
    };
    React.useEffect(() => {
      if (selectedAreaId) {
        setAreaError(null);
      }
    }, [selectedAreaId]);
    React.useEffect(() => {
      if (selectedTableId || (isTemporaryTable && temporaryTableName)) {
        setTableError(null);
      }
    }, [selectedTableId, isTemporaryTable, temporaryTableName]);
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
      <>
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
                    setSelectedAreaId(area.id);
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
              <HelperText type="error" visible={true} style={styles.helperText}>
                {areaError}
              </HelperText>
            )}
            {errorAreas && (
              <HelperText type="error" visible={true} style={styles.helperText}>
                Error al cargar áreas
              </HelperText>
            )}
          </View>

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
                const isCurrentTable =
                  isEditMode && selectedTableId === table.id;
                const canSelect = table.isAvailable || isCurrentTable;

                return (
                  <Menu.Item
                    key={table.id}
                    onPress={() => {
                      if (canSelect) {
                        setSelectedTableId(table.id);
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
              <HelperText type="error" visible={true} style={styles.helperText}>
                {tableError}
              </HelperText>
            )}
            {errorTables && (
              <HelperText type="error" visible={true} style={styles.helperText}>
                Error al cargar mesas
              </HelperText>
            )}
          </View>
        </View>

        <View style={[styles.section, styles.fieldContainer]}>
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
                  style={styles.helperText}
                >
                  {tableError}
                </HelperText>
              )}
            </View>
          )}
        </View>

        <View style={[styles.section, styles.fieldContainer]}>
          <SpeechRecognitionInput
            key="notes-input-dine-in"
            label="Notas de la Orden (Opcional)"
            value={orderNotes}
            onChangeText={setOrderNotes}
            multiline
            speechLang="es-MX"
          />
        </View>

        <View style={[styles.section, styles.fieldContainer]}>
          <AnimatedLabelSelector
            label="Programar Hora (Opcional)"
            value={formattedScheduledTime}
            onPress={onScheduleTimePress}
            onClear={handleScheduleTimeClear}
          />
        </View>
      </>
    );
  },
);

DineInForm.displayName = 'DineInForm';

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
