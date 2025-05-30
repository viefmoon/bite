import { Device } from "react-native-ble-plx"
import { encode as btoa, decode as atob } from "base-64"

// Constantes de servicios y características BLE
export const BLE_SERVICE_UUID = "180A"
export const BLE_CHARACTERISTICS = {
  SYSTEM: "2A37",
  NTC100K: "2A38",
  NTC10K: "2A39",
  CONDUCTIVITY: "2A3C",
  PH: "2A3B",
  SENSORS: "2A40",
  LORA_CONFIG: "2A41",
}

// Función para decodificar base64
export function decodeBase64(value?: string | null): string {
  return value ? atob(value) : ""
}

// Función para codificar a base64
export function encodeBase64(value: string): string {
  return btoa(value)
}

// Función para leer configuración de una característica BLE
export async function readConfigCharacteristic(
  device: Device,
  serviceUUID: string,
  characteristicUUID: string,
) {
  try {
    const isConnected = await device.isConnected()
    if (!isConnected) {
      await device.connect()
    }
    await device.discoverAllServicesAndCharacteristics()

    const characteristic = await device.readCharacteristicForService(
      serviceUUID,
      characteristicUUID,
    )

    if (characteristic?.value) {
      const decodedValue = atob(characteristic.value)
      return JSON.parse(decodedValue)
    }
    return null
  } catch (error) {
    console.error(`Error leyendo la característica ${characteristicUUID}:`, error)
    throw error
  }
}

// Función para escribir configuración en una característica BLE
export async function writeConfigCharacteristic(
  device: Device,
  serviceUUID: string,
  characteristicUUID: string,
  value: any,
) {
  try {
    const isConnected = await device.isConnected()
    if (!isConnected) {
      await device.connect()
    }
    await device.discoverAllServicesAndCharacteristics()

    const encodedValue = btoa(JSON.stringify(value))
    await device.writeCharacteristicWithResponseForService(
      serviceUUID,
      characteristicUUID,
      encodedValue,
    )
  } catch (error) {
    console.error(`Error escribiendo la característica ${characteristicUUID}:`, error)
    throw error
  }
}
