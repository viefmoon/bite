import { FC, useEffect } from "react"
import { ViewStyle, Alert, TextStyle } from "react-native"
import { Screen, Text, Button } from "@/components"
import { useBLE } from "@/hooks"
import { AppStackScreenProps } from "@/navigators"
import { Device } from "react-native-ble-plx"
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  useSharedValue,
  cancelAnimation,
} from "react-native-reanimated"
import { Theme } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"

interface BLEScreenProps extends AppStackScreenProps<"BLE"> {}

export const BLEScreen: FC<BLEScreenProps> = ({ navigation }) => {
  const {
    isScanning,
    devices,
    startScan,
    stopScan,
    isReady,
    bluetoothState,
    permissionsGranted,
    requestPermissions,
    isConnecting,
  } = useBLE()

  const { theme } = useAppTheme()

  // Nueva animación para el botón de escaneo (efecto pulsante)
  const buttonScale = useSharedValue(1)

  useEffect(() => {
    if (isScanning) {
      buttonScale.value = withRepeat(
        withSequence(withTiming(1.05, { duration: 1000 }), withTiming(1, { duration: 1000 })),
        -1,
      )
    } else {
      cancelAnimation(buttonScale)
      buttonScale.value = 1
    }
  }, [isScanning, buttonScale])

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }))

  useEffect(() => {
    if (isReady) {
      requestPermissions()
    }
  }, [isReady, requestPermissions])

  const handleDevicePress = async (device: Device) => {
    try {
      const isConnected = await device.isConnected()
      if (!isConnected) {
        await device.connect()
      }
      await device.discoverAllServicesAndCharacteristics()
      navigation.navigate("BLEConfig", { device })
    } catch (error: any) {
      Alert.alert("Error de conexión", error.message || "No se pudo conectar al dispositivo")
    }
  }

  if (!isReady) {
    return (
      <Screen
        preset="scroll"
        contentContainerStyle={$container(theme)}
        safeAreaEdges={["top", "bottom"]}
      >
        <Text preset="heading" text="Inicializando BLE..." style={$title(theme)} />
      </Screen>
    )
  }

  if (bluetoothState === "PoweredOff") {
    return (
      <Screen
        preset="scroll"
        contentContainerStyle={$container(theme)}
        safeAreaEdges={["top", "bottom"]}
      >
        <Text preset="heading" text="Bluetooth está desactivado" style={$title(theme)} />
        <Text text="Por favor, active el Bluetooth para continuar" style={$message(theme)} />
      </Screen>
    )
  }

  if (permissionsGranted === false) {
    return (
      <Screen
        preset="scroll"
        contentContainerStyle={$container(theme)}
        safeAreaEdges={["top", "bottom"]}
      >
        <Text preset="heading" text="Permisos requeridos" style={$title(theme)} />
        <Text
          text="Esta aplicación necesita permisos de Bluetooth para funcionar"
          style={$message(theme)}
        />
        <Button text="Solicitar permisos" onPress={requestPermissions} style={$scanButton(theme)} />
      </Screen>
    )
  }

  return (
    <Screen preset="scroll" contentContainerStyle={$container(theme)} safeAreaEdges={["bottom"]}>
      {/* Botón de escaneo con animación pulsante si está activo */}
      <Animated.View style={animatedButtonStyle}>
        <Button
          text={isScanning ? "Detener escaneo" : "Escanear dispositivos"}
          onPress={isScanning ? stopScan : startScan}
          style={$scanButton(theme)}
          disabled={isConnecting}
        />
      </Animated.View>

      {devices.map((device) => (
        <Button
          key={device.id}
          text={`${device.name || "Sin nombre"} (${device.id})`}
          onPress={() => handleDevicePress(device)}
          style={$deviceButton(theme)}
          disabled={isConnecting}
        />
      ))}
    </Screen>
  )
}

const $container = (theme: Theme): ViewStyle => ({
  paddingHorizontal: 16,
  paddingVertical: 24,
})

const $title = (theme: Theme): TextStyle => ({
  marginBottom: 24,
  color: theme.colors.text,
})

const $message = (theme: Theme): TextStyle => ({
  marginBottom: 16,
  textAlign: "center",
  color: theme.colors.textDim,
})

const $scanButton = (theme: Theme): ViewStyle => ({
  backgroundColor: theme.colors.tint,
  marginBottom: 16,
  paddingHorizontal: 24,
  paddingVertical: 16,
})

const $deviceButton = (theme: Theme): ViewStyle => ({
  marginBottom: 16,
  backgroundColor: theme.colors.tintLight,
  borderRadius: 8,
  paddingHorizontal: 10,
  paddingVertical: 6,
})

export default BLEScreen
