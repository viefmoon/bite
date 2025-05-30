import { PermissionsAndroid, Platform } from "react-native"

export async function requestAndroidPermissions() {
  if (Platform.OS !== "android") return true

  const apiLevel = parseInt(Platform.Version.toString(), 10)

  if (apiLevel < 31) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: "Permiso de ubicación para BLE",
        message: "Esta aplicación necesita acceso a la ubicación para escanear dispositivos BLE.",
        buttonNeutral: "Preguntar luego",
        buttonNegative: "Cancelar",
        buttonPositive: "OK",
      },
    )
    return granted === PermissionsAndroid.RESULTS.GRANTED
  }

  const results = await Promise.all([
    PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN),
    PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT),
    PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION),
  ])
  return results.every((result) => result === PermissionsAndroid.RESULTS.GRANTED)
} 