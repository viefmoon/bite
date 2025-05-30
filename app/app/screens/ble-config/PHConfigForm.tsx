import { FC, useEffect, useState, useCallback } from "react"
import { View, ViewStyle } from "react-native"
import { Device } from "react-native-ble-plx"
import { TextField } from "@/components"
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

const NAMESPACE = "ph"

interface PHConfigFormProps {
  device: Device
}

export const PHConfigForm: FC<PHConfigFormProps> = ({ device }) => {
  const { theme } = useAppTheme()
  const [v1, setV1] = useState("")
  const [t1, setT1] = useState("")
  const [v2, setV2] = useState("")
  const [t2, setT2] = useState("")
  const [v3, setV3] = useState("")
  const [t3, setT3] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showMessage } = useSnackbar()

  const loadConfig = useCallback(async () => {
    try {
      const config = await readConfigCharacteristic(
        device,
        BLE_SERVICE_UUID,
        BLE_CHARACTERISTICS.PH,
      )
      if (config?.[NAMESPACE]) {
        setV1(config[NAMESPACE].ph_v1?.toString() || "")
        setT1(config[NAMESPACE].ph_t1?.toString() || "")
        setV2(config[NAMESPACE].ph_v2?.toString() || "")
        setT2(config[NAMESPACE].ph_t2?.toString() || "")
        setV3(config[NAMESPACE].ph_v3?.toString() || "")
        setT3(config[NAMESPACE].ph_t3?.toString() || "")
      }
    } catch (error) {
      console.error("Error cargando configuración pH:", error)
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
          ph_v1: parseFloat(v1) || 0,
          ph_t1: parseFloat(t1) || 0,
          ph_v2: parseFloat(v2) || 0,
          ph_t2: parseFloat(t2) || 0,
          ph_v3: parseFloat(v3) || 0,
          ph_t3: parseFloat(t3) || 0,
        },
      }
      await writeConfigCharacteristic(device, BLE_SERVICE_UUID, BLE_CHARACTERISTICS.PH, config)
      showMessage("Configuración guardada exitosamente.", "success")
    } catch (error) {
      console.error("Error guardando configuración pH:", error)
      showMessage("Error al guardar la configuración.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ConfigForm
      title="Configuración pH"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      style={$form(theme)}
    >
      <View style={$row}>
        <TextField
          label="Voltaje 1"
          value={v1}
          onChangeText={setV1}
          keyboardType="numeric"
          containerStyle={$field}
        />
        <TextField
          label="T1"
          value={t1}
          onChangeText={setT1}
          keyboardType="numeric"
          containerStyle={$field}
        />
      </View>

      <View style={$row}>
        <TextField
          label="Voltaje 2"
          value={v2}
          onChangeText={setV2}
          keyboardType="numeric"
          containerStyle={$field}
        />
        <TextField
          label="T2"
          value={t2}
          onChangeText={setT2}
          keyboardType="numeric"
          containerStyle={$field}
        />
      </View>

      <View style={$row}>
        <TextField
          label="Voltaje 3"
          value={v3}
          onChangeText={setV3}
          keyboardType="numeric"
          containerStyle={$field}
        />
        <TextField
          label="T3"
          value={t3}
          onChangeText={setT3}
          keyboardType="numeric"
          containerStyle={$field}
        />
      </View>
    </ConfigForm>
  )
}

const $row: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  marginBottom: spacing.md,
}

const $field: ViewStyle = {
  flex: 1,
  marginHorizontal: spacing.xs,
}

const $form = (theme: Theme): ViewStyle => ({
  backgroundColor: theme.colors.background,
})
