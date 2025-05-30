import { FC, useEffect, useState, useCallback } from "react"
import { View, ViewStyle } from "react-native"
import { Device } from "react-native-ble-plx"
import { Text, TextField, Switch } from "@/components"
import { ConfigForm } from "@/components/ConfigForm"
import {
  BLE_SERVICE_UUID,
  BLE_CHARACTERISTICS,
  readConfigCharacteristic,
  writeConfigCharacteristic,
} from "@/utils/ble-utils"
import { spacing } from "@/theme"
import { Theme } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { useSnackbar } from "@/context/SnackbarContext"

const NAMESPACE = "system"

interface SystemConfigFormProps {
  device: Device
}

export const SystemConfigForm: FC<SystemConfigFormProps> = ({ device }) => {
  const { theme } = useAppTheme()
  const { showMessage } = useSnackbar()
  const [initialized, setInitialized] = useState(false)
  const [sleepTime, setSleepTime] = useState("")
  const [deviceId, setDeviceId] = useState("")
  const [stationId, setStationId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadConfig = useCallback(async () => {
    try {
      const config = await readConfigCharacteristic(
        device,
        BLE_SERVICE_UUID,
        BLE_CHARACTERISTICS.SYSTEM,
      )
      if (config?.[NAMESPACE]) {
        setInitialized(config[NAMESPACE].initialized)
        setSleepTime(config[NAMESPACE].sleep_time?.toString() || "")
        setDeviceId(config[NAMESPACE].deviceId || "")
        setStationId(config[NAMESPACE].stationId || "")
      }
    } catch (error) {
      console.error("Error cargando configuración:", error)
    }
  }, [device])

  useEffect(() => {
    loadConfig()
  }, [device, loadConfig])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const config = {
        [NAMESPACE]: {
          initialized,
          sleep_time: parseInt(sleepTime) || 0,
          deviceId,
          stationId,
        },
      }
      await writeConfigCharacteristic(device, BLE_SERVICE_UUID, BLE_CHARACTERISTICS.SYSTEM, config)
      showMessage("Configuración guardada exitosamente.", "success")
    } catch (error) {
      console.error("Error guardando configuración:", error)
      showMessage("Error al guardar la configuración.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ConfigForm
      title="Configuración del Sistema"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      style={$form(theme)}
    >
      <View style={$fieldContainer}>
        <Text text="Inicializado" />
        <Switch value={initialized} onValueChange={setInitialized} disabled />
      </View>

      <TextField
        label="Tiempo de sueño (s)"
        value={sleepTime}
        onChangeText={setSleepTime}
        keyboardType="numeric"
        containerStyle={$fieldContainer}
      />

      <TextField
        label="ID del dispositivo"
        value={deviceId}
        onChangeText={setDeviceId}
        containerStyle={$fieldContainer}
      />

      <TextField
        label="ID de estación"
        value={stationId}
        onChangeText={setStationId}
        containerStyle={$fieldContainer}
      />
    </ConfigForm>
  )
}

const $form = (theme: Theme): ViewStyle => ({
  backgroundColor: theme.colors.background,
})

const $fieldContainer: ViewStyle = {
  marginBottom: spacing.md,
}
