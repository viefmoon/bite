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

const NAMESPACE = "ntc_10k"

interface NTC10KConfigFormProps {
  device: Device
}

export const NTC10KConfigForm: FC<NTC10KConfigFormProps> = ({ device }) => {
  const { theme } = useAppTheme()
  const [t1, setT1] = useState("")
  const [r1, setR1] = useState("")
  const [t2, setT2] = useState("")
  const [r2, setR2] = useState("")
  const [t3, setT3] = useState("")
  const [r3, setR3] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showMessage } = useSnackbar()

  const loadConfig = useCallback(async () => {
    try {
      const config = await readConfigCharacteristic(
        device,
        BLE_SERVICE_UUID,
        BLE_CHARACTERISTICS.NTC10K,
      )
      if (config?.[NAMESPACE]) {
        setT1(config[NAMESPACE].n10k_t1?.toString() || "")
        setR1(config[NAMESPACE].n10k_r1?.toString() || "")
        setT2(config[NAMESPACE].n10k_t2?.toString() || "")
        setR2(config[NAMESPACE].n10k_r2?.toString() || "")
        setT3(config[NAMESPACE].n10k_t3?.toString() || "")
        setR3(config[NAMESPACE].n10k_r3?.toString() || "")
      }
    } catch (error) {
      console.error("Error cargando configuración NTC10K:", error)
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
          n10k_t1: parseFloat(t1) || 0,
          n10k_r1: parseFloat(r1) || 0,
          n10k_t2: parseFloat(t2) || 0,
          n10k_r2: parseFloat(r2) || 0,
          n10k_t3: parseFloat(t3) || 0,
          n10k_r3: parseFloat(r3) || 0,
        },
      }
      await writeConfigCharacteristic(device, BLE_SERVICE_UUID, BLE_CHARACTERISTICS.NTC10K, config)
      showMessage("Configuración guardada exitosamente.", "success")
    } catch (error) {
      console.error("Error guardando configuración NTC10K:", error)
      showMessage("Error al guardar la configuración.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ConfigForm
      title="Configuración NTC 10K"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      style={$form(theme)}
    >
      <View style={$row}>
        <TextField
          label="T1 (°C)"
          value={t1}
          onChangeText={setT1}
          keyboardType="numeric"
          containerStyle={$field}
        />
        <TextField
          label="R1 (Ω)"
          value={r1}
          onChangeText={setR1}
          keyboardType="numeric"
          containerStyle={$field}
        />
      </View>

      <View style={$row}>
        <TextField
          label="T2 (°C)"
          value={t2}
          onChangeText={setT2}
          keyboardType="numeric"
          containerStyle={$field}
        />
        <TextField
          label="R2 (Ω)"
          value={r2}
          onChangeText={setR2}
          keyboardType="numeric"
          containerStyle={$field}
        />
      </View>

      <View style={$row}>
        <TextField
          label="T3 (°C)"
          value={t3}
          onChangeText={setT3}
          keyboardType="numeric"
          containerStyle={$field}
        />
        <TextField
          label="R3 (Ω)"
          value={r3}
          onChangeText={setR3}
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
