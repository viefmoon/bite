import { FC, useEffect, useState, useCallback } from "react"
import { View, ViewStyle, ScrollView, TextStyle } from "react-native"
import { Device } from "react-native-ble-plx"
import { TextField, ConfigForm, Switch, Text, Button } from "@/components"
import {
  BLE_SERVICE_UUID,
  BLE_CHARACTERISTICS,
  readConfigCharacteristic,
  writeConfigCharacteristic,
} from "@/utils/ble-utils"
import { spacing, Theme } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { TouchableOpacity } from "react-native"
import { useSnackbar } from "@/context/SnackbarContext"

const NAMESPACE = "sensors"

interface SensorsConfigFormProps {
  device: Device
}

// Definición del enum SensorType
enum SensorType {
  NTC_100K_TEMPERATURE_SENSOR,
  NTC_10K_TEMPERATURE_SENSOR,
  WATER_NTC_10K_TEMPERATURE_SENSOR,
  RTD_TEMPERATURE_SENSOR,
  DS18B20_TEMPERATURE_SENSOR,
  PH_SENSOR,
  CONDUCTIVITY_SENSOR,
  CONDENSATION_HUMIDITY_SENSOR,
  SOIL_HUMIDITY_SENSOR,
}

// Crear un mapa de tipos de sensores para la selección
const SENSOR_TYPE_OPTIONS = [
  { value: SensorType.NTC_100K_TEMPERATURE_SENSOR, label: "NTC 100K" },
  { value: SensorType.NTC_10K_TEMPERATURE_SENSOR, label: "NTC 10K" },
  { value: SensorType.WATER_NTC_10K_TEMPERATURE_SENSOR, label: "Water NTC 10K" },
  { value: SensorType.RTD_TEMPERATURE_SENSOR, label: "RTD" },
  { value: SensorType.DS18B20_TEMPERATURE_SENSOR, label: "DS18B20" },
  { value: SensorType.PH_SENSOR, label: "pH" },
  { value: SensorType.CONDUCTIVITY_SENSOR, label: "Conductivity" },
  { value: SensorType.CONDENSATION_HUMIDITY_SENSOR, label: "Condensation Humidity" },
  { value: SensorType.SOIL_HUMIDITY_SENSOR, label: "Soil Humidity" },
]

export const SensorsConfigForm: FC<SensorsConfigFormProps> = ({ device }) => {
  const { theme } = useAppTheme()
  const [sensorsConfig, setSensorsConfig] = useState<
    { k: string; id: string; t: number; ts: string; e: boolean }[]
  >([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedSensor, setExpandedSensor] = useState<string | null>(null)
  const { showMessage } = useSnackbar()

  const loadConfig = useCallback(async () => {
    try {
      const config = await readConfigCharacteristic(
        device,
        BLE_SERVICE_UUID,
        BLE_CHARACTERISTICS.SENSORS,
      )
      if (config?.[NAMESPACE]) {
        // Asegurarse de que la configuración sea un array
        const sensorsData = config[NAMESPACE]
        if (Array.isArray(sensorsData)) {
          setSensorsConfig(
            sensorsData.map((sensor) => ({
              ...sensor,
              t: sensor.t || 0, // Valor por defecto para t
            })),
          )
        }
      }
    } catch (error) {
      console.error("Error cargando configuración de sensores:", error)
    }
  }, [device])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  // Separate handlers for each field
  const handleIdChange = (index: number, value: string) => {
    if (value.length <= 5) {
      setSensorsConfig((prevConfig) =>
        prevConfig.map((sensor, i) => (i === index ? { ...sensor, id: value } : sensor)),
      )
    }
  }

  const handleTypeChange = (index: number, selectedType: SensorType) => {
    setSensorsConfig((prevConfig) =>
      prevConfig.map((sensor, i) => (i === index ? { ...sensor, t: selectedType } : sensor)),
    )
  }

  const handleEnableChange = (index: number, value: boolean) => {
    setSensorsConfig((prevConfig) =>
      prevConfig.map((sensor, i) => (i === index ? { ...sensor, e: value } : sensor)),
    )
  }

  const handleTsChange = (index: number, value: string) => {
    setSensorsConfig((prevConfig) =>
      prevConfig.map((sensor, i) => (i === index ? { ...sensor, ts: value } : sensor)),
    )
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const config = {
        [NAMESPACE]: sensorsConfig.map((sensor) => ({
          k: sensor.k, // Mantener la clave original
          id: sensor.id,
          t: sensor.t,
          ts: sensor.ts,
          e: sensor.e,
        })),
      }
      await writeConfigCharacteristic(device, BLE_SERVICE_UUID, BLE_CHARACTERISTICS.SENSORS, config)
      showMessage("Configuración guardada exitosamente.", "success")
    } catch (error) {
      console.error("Error guardando configuración de sensores:", error)
      showMessage("Error al guardar la configuración.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleSensor = (sensorKey: string) => {
    setExpandedSensor((prevKey) => (prevKey === sensorKey ? null : sensorKey))
  }

  return (
    <ConfigForm
      title="Configuración de Sensores"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      style={$form(theme)}
    >
      <ScrollView style={$scrollView}>
        {sensorsConfig.map((sensor, index) => (
          <View key={sensor.k} style={$sensorContainer(theme)}>
            <TouchableOpacity onPress={() => toggleSensor(sensor.k)} style={$sensorHeader(theme)}>
              <Text text={`Sensor ${index + 1} (Key: ${sensor.k})`} style={$sensorTitle(theme)} />
            </TouchableOpacity>

            {expandedSensor === sensor.k && (
              <>
                <TextField
                  label="ID del sensor"
                  value={sensor.id}
                  onChangeText={(value) => handleIdChange(index, value)}
                  containerStyle={$field}
                  maxLength={5}
                />

                <View style={$sensorTypeContainer}>
                  <Text text="Tipo de sensor" style={$sensorTypeLabel(theme)} />
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={$sensorTypeScroll}
                  >
                    {SENSOR_TYPE_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        text={option.label}
                        onPress={() => handleTypeChange(index, option.value)}
                        style={[
                          $sensorTypeButton(theme),
                          sensor.t === option.value && $sensorTypeButtonActive(theme),
                        ]}
                        textStyle={[
                          $sensorTypeButtonText(theme),
                          sensor.t === option.value && $sensorTypeButtonTextActive(theme),
                        ]}
                      />
                    ))}
                  </ScrollView>
                </View>

                <View style={$switchContainer}>
                  <Text text="Habilitado" style={$switchLabel(theme)} />
                  <Switch
                    value={sensor.e}
                    onValueChange={(value) => handleEnableChange(index, value)}
                  />
                </View>

                <TextField
                  label="ID Sensor Temperatura (opcional)"
                  value={sensor.ts}
                  onChangeText={(value) => handleTsChange(index, value)}
                  containerStyle={$field}
                />
              </>
            )}
          </View>
        ))}
      </ScrollView>
    </ConfigForm>
  )
}

const $field: ViewStyle = {
  marginBottom: spacing.md,
}

const $switchContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: spacing.md,
}

const $switchLabel = (theme: Theme): TextStyle => ({
  flex: 1,
  marginRight: spacing.sm,
  color: theme.colors.text,
})

const $form = (theme: Theme): ViewStyle => ({
  backgroundColor: theme.colors.background,
})

const $scrollView: ViewStyle = {
  flex: 1,
}

const $sensorContainer = (theme: Theme): ViewStyle => ({
  padding: spacing.md,
  backgroundColor: theme.colors.background,
  borderRadius: 8,
})

const $sensorHeader = (theme: Theme): ViewStyle => ({
  padding: spacing.sm,
  backgroundColor: theme.colors.palette.neutral200,
  borderBottomWidth: 1,
  borderBottomColor: theme.colors.border,
  marginBottom: spacing.xxs,
})

const $sensorTitle = (theme: Theme): TextStyle => ({
  fontSize: 16,
  fontWeight: "bold",
  color: theme.colors.text,
})

const $sensorTypeContainer: ViewStyle = {
  marginBottom: spacing.md,
}

const $sensorTypeLabel = (theme: Theme): TextStyle => ({
  marginBottom: spacing.xs,
  color: theme.colors.text,
})

const $sensorTypeScroll: ViewStyle = {
  flexGrow: 0,
}

const $sensorTypeButton = (theme: Theme): ViewStyle => ({
  marginRight: spacing.xs,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  borderRadius: 4,
  borderWidth: 1,
  minWidth: 100,
  borderColor: theme.colors.border,
})

const $sensorTypeButtonActive = (theme: Theme): ViewStyle => ({
  backgroundColor: theme.colors.tint,
  borderColor: theme.colors.tint,
})

const $sensorTypeButtonText = (theme: Theme): TextStyle => ({
  color: theme.colors.text,
  fontSize: 14,
})

const $sensorTypeButtonTextActive = (theme: Theme): TextStyle => ({
  color: theme.colors.palette.neutral100,
})
