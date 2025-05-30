import { useState, useEffect } from "react"
import { BleManager, Device, State } from "react-native-ble-plx"
import { requestAndroidPermissions } from "../../android/app/src/main/java/com/pizza/permissions/BlePermissions"

// UUID del servicio BLE que buscamos en formato corto
const BLE_SERVICE_UUID = "180A" // Se mantiene el valor corto

// Helper para normalizar el UUID a formato de 128 bits
function normalizeUuid(uuid: string): string {
  return uuid.length === 4
    ? `0000${uuid.toLowerCase()}-0000-1000-8000-00805f9b34fb`
    : uuid.toLowerCase()
}

let bleManagerInstance: BleManager | null = null

export function useBLE() {
  const [isScanning, setIsScanning] = useState(false)
  const [devices, setDevices] = useState<Device[]>([])
  const [bluetoothState, setBluetoothState] = useState<State>(State.Unknown)
  const [permissionsGranted, setPermissionsGranted] = useState<boolean | null>(null)
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    if (!bleManagerInstance) {
      try {
        bleManagerInstance = new BleManager()
      } catch (error) {
        console.error("Error creando BleManager:", error)
        return
      }
    }

    const subscription = bleManagerInstance.onStateChange((state) => {
      setBluetoothState(state)
    }, true)

    return () => {
      subscription.remove()
      // No destruimos el manager aquí para mantener la instancia
    }
  }, [])

  const requestPermissions = async () => {
    try {
      const granted = await requestAndroidPermissions()
      setPermissionsGranted(granted)
      return granted
    } catch (error) {
      console.error("Error solicitando permisos:", error)
      setPermissionsGranted(false)
      return false
    }
  }

  const startScan = async () => {
    if (!bleManagerInstance || isScanning) return

    try {
      const state = await bleManagerInstance.state()
      if (state !== State.PoweredOn) {
        console.log("Bluetooth no está encendido. Estado actual:", state)
        return
      }

      const permissionGranted = await requestPermissions()
      if (!permissionGranted) {
        console.log("Permisos no concedidos para BLE")
        return
      }

      setDevices([])
      setIsScanning(true)

      bleManagerInstance.startDeviceScan(
        [normalizeUuid(BLE_SERVICE_UUID)], // Buscamos dispositivos con el UUID normalizado
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            console.error("Error durante el escaneo:", error)
            setIsScanning(false)
            return
          }
          if (device && device.name) {
            setDevices((prev) => {
              if (!prev.find((d) => d.id === device.id)) {
                return [...prev, device]
              }
              return prev
            })
          }
        },
      )

      setTimeout(() => {
        if (bleManagerInstance) {
          bleManagerInstance.stopDeviceScan()
          setIsScanning(false)
        }
      }, 10000)
    } catch (error) {
      console.error("Error al iniciar el escaneo:", error)
      setIsScanning(false)
    }
  }

  const stopScan = () => {
    if (!bleManagerInstance) return
    bleManagerInstance.stopDeviceScan()
    setIsScanning(false)
  }

  const connectToDevice = async (device: Device) => {
    if (!bleManagerInstance) throw new Error("BleManager no está inicializado")

    try {
      setIsConnecting(true)
      const connectedDevice = await device.connect()
      const discoveredDevice = await connectedDevice.discoverAllServicesAndCharacteristics()

      // Verificar si el dispositivo tiene el servicio requerido
      const services = await discoveredDevice.services()
      const requiredServiceUuid = normalizeUuid(BLE_SERVICE_UUID)
      const hasRequiredService = services.some(
        (service) => normalizeUuid(service.uuid) === requiredServiceUuid,
      )

      if (!hasRequiredService) {
        await discoveredDevice.cancelConnection()
        throw new Error("El dispositivo no tiene el servicio requerido")
      }

      setConnectedDevice(discoveredDevice)
      return discoveredDevice
    } catch (error) {
      console.error("Error al conectar al dispositivo:", error)
      throw error
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectDevice = async () => {
    if (connectedDevice) {
      try {
        await connectedDevice.cancelConnection()
        setConnectedDevice(null)
      } catch (error) {
        console.error("Error al desconectar:", error)
      }
    }
  }

  return {
    isScanning,
    devices,
    startScan,
    stopScan,
    connectToDevice,
    disconnectDevice,
    isReady: !!bleManagerInstance,
    bluetoothState,
    permissionsGranted,
    requestPermissions,
    connectedDevice,
    isConnecting,
  }
}
