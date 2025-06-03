# Expo Audio (`expo-audio`)

Una biblioteca que proporciona una API para implementar la reproducción y grabación de audio en aplicaciones.

**Nota:** Esta página documenta una próxima versión de la biblioteca de audio. Expo Audio se encuentra actualmente en fase alfa y está sujeto a cambios importantes.

`expo-audio` es una biblioteca de audio multiplataforma para acceder a las capacidades de audio nativas del dispositivo.

Tenga en cuenta que el audio se detiene automáticamente si se desconectan los auriculares/dispositivos de audio bluetooth.

## Instalación

```bash
npx expo install expo-audio
```

Si está instalando esto en una aplicación React Native existente, asegúrese de instalar `expo` en tu proyecto.

## Configuración en la configuración de la aplicación

Puede configurar `expo-audio` usando su complemento de configuración incorporado si usa complementos de configuración en su proyecto (EAS Build o `npx expo run:[android|ios]`). El complemento le permite configurar varias propiedades que no se pueden establecer en tiempo de ejecución y requieren la creación de un nuevo binario de aplicación para que surta efecto. Si la aplicación no usa EAS Build, tendrás que configurar manualmente el paquete.

### Ejemplo `app.json` con el plugin config

```json
{
  "expo": {
    "plugins": [
      [
        "expo-audio",
        {
          "microphonePermission": "Allow $(PRODUCT_NAME) to access your microphone."
        }
      ]
    ]
  }
}
```

### Propiedades configurables

| Nombre               | Predeterminado                                       | Descripción                                                              | Plataforma |
| -------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------ | ---------- |
| `microphonePermission` | `"Allow $(PRODUCT_NAME) to access your microphone"` | Una cadena para establecer el mensaje de permiso `NSMicrophoneUsageDescription`. | iOS        |

## Uso

### Reproducción de sonidos

```javascript
// Abrir en Bocadillo

import { useEffect, useState } from 'react';
import { View, StyleSheet, Button } from 'react-native';
import { useAudioPlayer } from 'expo-audio';

const audioSource = require('./assets/Hello.mp3'); // Asegúrate de tener este archivo o reemplázalo

export default function App() {
  const player = useAudioPlayer(audioSource);

  return (
    <View style={styles.container}>
      <Button title="Play Sound" onPress={() => player.play()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#ecf0f1',
    padding: 10,
  },
});
```

### Grabación de sonidos

```javascript
// Abrir en Bocadillo

import { useState, useEffect } from 'react'; // Añadido useEffect
import { View, StyleSheet, Button, Alert } from 'react-native'; // Añadido Alert
import { useAudioRecorder, RecordingOptions, AudioModule, RecordingPresets } from 'expo-audio';

export default function App() {
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const record = async () => {
    try { // Añadido try-catch para manejo de errores
        await audioRecorder.prepareToRecordAsync();
        audioRecorder.record();
    } catch (error) {
        console.error("Failed to start recording", error);
        Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try { // Añadido try-catch
        // The recording will be available on `audioRecorder.uri`.
        await audioRecorder.stop();
        if (audioRecorder.uri) {
            console.log('Recording stopped and stored at', audioRecorder.uri);
            // Aquí puedes hacer algo con la grabación, como reproducirla o subirla
        }
    } catch (error) {
        console.error("Failed to stop recording", error);
        Alert.alert('Error', 'Failed to stop recording');
    }
  };

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Permission Error', 'Permission to access microphone was denied'); // Mensaje más claro
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Button
        title={audioRecorder.isRecording ? 'Stop Recording' : 'Start Recording'}
        onPress={audioRecorder.isRecording ? stopRecording : record}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#ecf0f1',
    padding: 10,
  },
});
```

### Reproducción o grabación de audio en segundo plano (iOS)

En iOS, la reproducción de audio y la grabación en segundo plano solo están disponibles en aplicaciones independientes y requieren una configuración adicional. Cada característica en segundo plano requiere una clave especial (`UIBackgroundModes`) en la matriz del archivo `Info.plist`. En las aplicaciones independientes, esta matriz está vacía de forma predeterminada, por lo que para usar las funciones en segundo plano, deberá agregar las claves adecuadas a su configuración `app.json`.

Vea un ejemplo de `app.json` que habilita la reproducción de audio en segundo plano:

```json
{
  "expo": {
    // ...
    "ios": {
      // ...
      "infoPlist": {
        // ...
        "UIBackgroundModes": [
          "audio"
        ]
      }
    }
  }
}
```

### Notas sobre el uso de la web

*   Un problema de `MediaRecorder` en Chrome produce archivos WebM a los que les faltan los metadatos de duración. Consulte el [problema abierto de Chromium](https://bugs.chromium.org/p/chromium/issues/detail?id=642012).
*   Las opciones de codificación de `MediaRecorder` y otras configuraciones son inconsistentes en todos los navegadores. El uso de un Polyfill como [kbumsik/opus-media-recorder](https://github.com/kbumsik/opus-media-recorder) o [ai/audio-recorder-polyfill](https://github.com/ai/audio-recorder-polyfill) en su aplicación mejorará su experiencia. Cualquier opción que se pase a `prepareToRecordAsync` se pasará directamente a la API de `MediaRecorder` y, como tal, al polyfill.
*   Los navegadores web requieren que los sitios se sirvan de forma segura (HTTPS) para que puedan escuchar un micrófono. Ver [Seguridad de MediaDevices.getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#security) para más detalles.

## API

```javascript
import { useAudioPlayer, useAudioRecorder, AudioModule, RecordingPresets /* ...otros */ } from 'expo-audio';
```

### Constantes

*   **`Audio.AUDIO_SAMPLE_UPDATE`**
    *   Tipo: `'audioSampleUpdate'`
*   **`Audio.PLAYBACK_STATUS_UPDATE`**
    *   Tipo: `'playbackStatusUpdate'`
*   **`Audio.RECORDING_STATUS_UPDATE`**
    *   Tipo: `'recordingStatusUpdate'`
*   **`Audio.RecordingPresets`**
    *   Tipo: `Record<string, RecordingOptions>`
    *   Constante que contiene definiciones de los dos ejemplos preestablecidos de `RecordingOptions`, tal como se implementan en el SDK de audio.
    *   **`HIGH_QUALITY`**:
        ```javascript
        RecordingPresets.HIGH_QUALITY = {
          extension: '.m4a',
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          android: {
            outputFormat: 'mpeg4',
            audioEncoder: 'aac',
          },
          ios: {
            outputFormat: IOSOutputFormat.MPEG4AAC, // Asumiendo que IOSOutputFormat está definido
            audioQuality: AudioQuality.MAX, // Asumiendo que AudioQuality está definido
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: {
            mimeType: 'audio/webm',
            bitsPerSecond: 128000,
          },
        };
        ```
    *   **`LOW_QUALITY`**:
        ```javascript
        RecordingPresets.LOW_QUALITY = {
          extension: '.m4a',
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 64000,
          android: {
            extension: '.3gp',
            outputFormat: '3gp',
            audioEncoder: 'amr_nb',
          },
          ios: {
            audioQuality: AudioQuality.MIN, // Asumiendo que AudioQuality está definido
            outputFormat: IOSOutputFormat.MPEG4AAC, // Asumiendo que IOSOutputFormat está definido
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: {
            mimeType: 'audio/webm',
            bitsPerSecond: 128000, // Nota: Este valor parece alto para LOW_QUALITY en web, podría ser un error tipográfico en la fuente original.
          },
        };
        ```

### Ganchos (Hooks)

*   **`useAudioPlayer(source?, updateInterval?)`**
    *   `source` (Opcional): `number | AudioSource`
    *   `updateInterval` (Opcional): `number`
    *   **Devuelve**: `AudioPlayer`
*   **`useAudioPlayerStatus(player)`**
    *   `player`: `AudioPlayer`
    *   **Devuelve**: `AudioStatus`
*   **`useAudioRecorder(options, statusListener?)`**
    *   `options`: `RecordingOptions`
    *   `statusListener` (Opcional): `(status: RecordingStatus) => void`
    *   **Devuelve**: `AudioRecorder`
*   **`useAudioRecorderState(recorder, interval?)`**
    *   `recorder`: `AudioRecorder`
    *   `interval` (Opcional): `number`
    *   **Devuelve**: `RecorderState`
*   **`useAudioSampleListener(player, listener)`**
    *   `player`: `AudioPlayer`
    *   `listener`: `(data: AudioSample) => void`
    *   **Devuelve**: `void`

### Clases

#### `AudioPlayer`

*   Tipo: `class extends SharedObject<AudioEvents>` (Asumiendo `SharedObject`)

##### Propiedades de `AudioPlayer`

*   `currentTime`: `number` - La posición actual a través del elemento de audio, en segundos.
*   `duration`: `number` - La duración total del audio en segundos.
*   `id`: `number` - Identificador único para el objeto player.
*   `isAudioSamplingSupported`: `boolean` - Valor booleano que indica si el muestreo de audio es compatible con la plataforma.
*   `isBuffering`: `boolean` - Valor booleano que indica si el reproductor está almacenando en búfer.
*   `isLoaded`: `boolean` - Valor booleano que indica si el reproductor ha terminado de cargarse.
*   `loop`: `boolean` - Valor booleano que indica si el reproductor está en bucle actualmente.
*   `muted`: `boolean` - Valor booleano que indica si el reproductor está silenciado actualmente.
*   `paused`: `boolean` - Valor booleano que indica si el reproductor está actualmente en pausa.
*   `playbackRate`: `number` - La velocidad de reproducción actual del audio.
*   `playing`: `boolean` - Valor booleano que indica si el jugador está jugando actualmente.
*   `shouldCorrectPitch`: `boolean` - Un booleano que describe si estamos corrigiendo el tono para una tasa cambiada.
*   `volume`: `number` - El volumen actual del audio.

##### Métodos de `AudioPlayer`

*   **`pause()`**: Pausa el reproductor.
    *   Devuelve: `void`
*   **`play()`**: Empieza a reproducir audio.
    *   Devuelve: `void`
*   **`remove()`**: Elimine el reproductor de la memoria para liberar recursos.
    *   Devuelve: `void`
*   **`replace(source)`**: Reemplaza la fuente de audio actual por una nueva.
    *   `source`: `AudioSource`
    *   Devuelve: `void`
*   **`seekTo(seconds)`**: Busca la reproducción por el número de segundos dado.
    *   `seconds`: `number` - El número de segundos por los que se va a buscar.
    *   Devuelve: `Promise<void>`
*   **`setPlaybackRate(rate, pitchCorrectionQuality?)`**: Establece la velocidad de reproducción actual del audio.
    *   `rate`: `number` - La velocidad de reproducción del audio.
    *   `pitchCorrectionQuality` (Opcional): `PitchCorrectionQuality` - La calidad de la corrección del tono.
    *   Devuelve: `void`

#### `AudioRecorder`

*   Tipo: `class extends SharedObject<RecordingEvents>` (Asumiendo `SharedObject`)

##### Propiedades de `AudioRecorder`

*   `currentTime`: `number` - La duración actual de la grabación, en segundos.
*   `id`: `number` - Identificador único para el objeto registrador.
*   `isRecording`: `boolean` - Valor booleano que indica si la grabación está en curso.
*   `uri`: `null | string` - El uri de la grabación.

##### Métodos de `AudioRecorder`

*   **`getAvailableInputs()`**: Devuelve una lista de las entradas de grabación disponibles. Este método solo se puede llamar si `Recording` ha sido preparado.
    *   Devuelve: `Promise<RecordingInput[]>` - Una `Promise` que se cumple con una matriz de objetos `RecordingInput`.
*   **`getCurrentInput()`**: Devuelve la entrada de grabación seleccionada actualmente. Este método solo se puede llamar si `Recording` ha sido preparado.
    *   Devuelve: `Promise<RecordingInput>` - Una `Promise` que se cumple con un objeto `RecordingInput`.
*   **`getStatus()`**: Estado de la grabación actual.
    *   Devuelve: `RecorderState`
*   **`pause()`**: Pausa la grabación.
    *   Devuelve: `void`
*   **`prepareToRecordAsync(options?)`**: Prepara la grabación para la grabación.
    *   `options` (Opcional): `Partial<RecordingOptions>`
    *   Devuelve: `Promise<void>`
*   **`record()`**: Inicia la grabación.
    *   Devuelve: `void`
*   **`recordForDuration(seconds)`**: Detiene la grabación una vez transcurrido el tiempo especificado.
    *   `seconds`: `number` - El tiempo en segundos para detener la grabación.
    *   Devuelve: `void`
*   **`setInput(inputUid)`**: Establece la entrada de grabación actual.
    *   `inputUid`: `string` - El uid de un `RecordingInput`.
    *   Devuelve: `Promise<void>` - Una `Promise` que se resuelve si se realiza correctamente o se rechaza si no lo es.
*   **`startRecordingAtTime(seconds)`**: Inicia la grabación a la hora indicada.
    *   `seconds`: `number` - El tiempo en segundos para comenzar a grabar.
    *   Devuelve: `void`
*   **`stop()`**: Detenga la grabación.
    *   Devuelve: `Promise<void>`

### Métodos (Módulo `Audio`)

*   **`Audio.getRecordingPermissionsAsync()`**
    *   Devuelve: `Promise<PermissionResponse>`
*   **`Audio.requestRecordingPermissionsAsync()`**
    *   Devuelve: `Promise<PermissionResponse>`
*   **`Audio.setAudioModeAsync(mode)`**
    *   `mode`: `Partial<AudioMode>`
    *   Devuelve: `Promise<void>`
*   **`Audio.setIsAudioActiveAsync(active)`**
    *   `active`: `boolean`
    *   Devuelve: `Promise<void>`

### Suscripciones a eventos

*   **`Audio.useAudioSampleListener(player, listener)`** (Nota: Este parece ser un Hook, no un método estático de `Audio`. Verificar la fuente original si es posible. Lo listamos aquí como en la fuente.)
    *   `player`: `AudioPlayer`
    *   `listener`: `(data: AudioSample) => void`
    *   Devuelve: `void`

### Interfaces

*   **`PermissionResponse`**: Objeto obtenido por las funciones de permisos `get` y `request`.
    *   `canAskAgain`: `boolean` - Indica si se puede volver a solicitar al usuario un permiso específico.
    *   `expires`: `PermissionExpiration` - Determina la hora en que caduca el permiso.
    *   `granted`: `boolean` - Indica si se concede el permiso.
    *   `status`: `PermissionStatus` - Determina el estado del permiso.

### Tipos

*   **`AndroidAudioEncoder`**: `'default' | 'amr_nb' | 'amr_wb' | 'aac' | 'he_aac' | 'aac_eld'`
*   **`AndroidOutputFormat`**: `'default' | '3gp' | 'mpeg4' | 'amrnb' | 'amrwb' | 'aac_adts' | 'mpeg2ts' | 'webm'`
*   **`AudioEvents`**:
    *   `audioSampleUpdate`: `(data: AudioSample) => void`
    *   `playbackStatusUpdate`: `(status: AudioStatus) => void`
*   **`AudioMode`**:
    *   `allowsRecording`: `boolean`
    *   `interruptionMode`: `InterruptionMode`
    *   `playsInSilentMode`: `boolean`
    *   `shouldPlayInBackground`: `boolean`
    *   `shouldRouteThroughEarpiece`: `boolean`
*   **`AudioSample`**:
    *   `channels`: `AudioSampleChannel[]`
    *   `timestamp`: `number`
*   **`AudioSampleChannel`**:
    *   `frames`: `number[]`
*   **`AudioSource`**: `string | null | number | { uri?: string; headers?: Record<string, string> }`
    *   `headers` (Opcional): `Record<string, string>` - Cabeceras HTTP para fuentes remotas. Requiere `Access-Control-Allow-Origin` en web.
    *   `uri` (Opcional): `string` - URI del audio (HTTPS, local, recurso estático).
*   **`AudioStatus`**:
    *   `currentTime`: `number`
    *   `duration`: `number`
    *   `id`: `number`
    *   `isBuffering`: `boolean`
    *   `isLoaded`: `boolean`
    *   `loop`: `boolean`
    *   `muted`: `boolean`
    *   `playbackRate`: `number`
    *   `playbackState`: `string` // Podría ser un enum más específico
    *   `playing`: `boolean`
    *   `reasonForWaitingToPlay`: `string` // Podría ser un enum
    *   `shouldCorrectPitch`: `boolean`
    *   `timeControlStatus`: `string` // Podría ser un enum
*   **`BitRateStrategy`**: `'constant' | 'longTermAverage' | 'variableConstrained' | 'variable'`
*   **`InterruptionMode`**: `'mixWithOthers' | 'doNotMix' | 'duckOthers'`
*   **`PermissionExpiration`**: `'never' | number` - Actualmente siempre `'never'`.
*   **`PitchCorrectionQuality`**: `'low' | 'medium' | 'high'`
*   **`RecorderState`**:
    *   `canRecord`: `boolean`
    *   `durationMillis`: `number`
    *   `isRecording`: `boolean`
    *   `mediaServicesDidReset`: `boolean`
    *   `metering` (Opcional): `number`
    *   `url`: `string | null`
*   **`RecordingEvents`**:
    *   `recordingStatusUpdate`: `(status: RecordingStatus) => void`
*   **`RecordingInput`**:
    *   `name`: `string`
    *   `type`: `string`
    *   `uid`: `string`
*   **`RecordingOptions`**:
    *   `android`: `RecordingOptionsAndroid`
    *   `bitRate`: `number` (Ej: `128000`)
    *   `extension`: `string` (Ej: `.caf`)
    *   `ios`: `RecordingOptionsIos`
    *   `numberOfChannels`: `number` (Ej: `2`)
    *   `sampleRate`: `number` (Ej: `44100`)
    *   `web` (Opcional): `RecordingOptionsWeb`
*   **`RecordingOptionsAndroid`**:
    *   `audioEncoder`: `AndroidAudioEncoder`
    *   `extension` (Opcional): `string` (Ej: `.caf`)
    *   `maxFileSize` (Opcional): `number` (Bytes, Ej: `65536`)
    *   `outputFormat`: `AndroidOutputFormat`
    *   `sampleRate` (Opcional): `number` (Ej: `44100`)
*   **`RecordingOptionsIos`**:
    *   `audioQuality`: `AudioQuality | number`
    *   `bitDepthHint` (Opcional): `number` (Ej: `16`)
    *   `bitRateStrategy` (Opcional): `BitRateStrategy | number` // Tipo corregido
    *   `extension` (Opcional): `string` (Ej: `.caf`)
    *   `linearPCMBitDepth` (Opcional): `number` (Ej: `16`)
    *   `linearPCMIsBigEndian` (Opcional): `boolean`
    *   `linearPCMIsFloat` (Opcional): `boolean`
    *   `outputFormat` (Opcional): `string | IOSOutputFormat | number`
    *   `sampleRate` (Opcional): `number` (Ej: `44100`)
*   **`RecordingOptionsWeb`**:
    *   `bitsPerSecond` (Opcional): `number`
    *   `mimeType` (Opcional): `string`
*   **`RecordingStatus`**:
    *   `error`: `string | null`
    *   `hasError`: `boolean`
    *   `id`: `number`
    *   `isFinished`: `boolean`
    *   `url`: `string | null`

### Enumeraciones

*   **`AudioQuality`** (iOS)
    *   `MIN = 0`
    *   `LOW = 32`
    *   `MEDIUM = 64`
    *   `HIGH = 96`
    *   `MAX = 127`
*   **`IOSOutputFormat`** (iOS)
    *   `MPEGLAYER1 = ".mp1"`
    *   `MPEGLAYER2 = ".mp2"`
    *   `MPEGLAYER3 = ".mp3"`
    *   `MPEG4AAC = "aac "` // Nota: el espacio es intencional según algunas APIs de Apple
    *   `MPEG4AAC_ELD = "aace"`
    *   `MPEG4AAC_ELD_SBR = "aacf"`
    *   `MPEG4AAC_ELD_V2 = "aacg"`
    *   `MPEG4AAC_HE = "aach"`
    *   `MPEG4AAC_LD = "aacl"`
    *   `MPEG4AAC_HE_V2 = "aacp"`
    *   `MPEG4AAC_SPATIAL = "aacs"`
    *   `AC3 = "ac-3"`
    *   `AES3 = "aes3"`
    *   `APPLELOSSLESS = "alac"`
    *   `ALAW = "alaw"`
    *   `AUDIBLE = "AUDB"`
    *   `60958AC3 = "cac3"`
    *   `MPEG4CELP = "celp"`
    *   `ENHANCEDAC3 = "ec-3"`
    *   `MPEG4HVXC = "hvxc"`
    *   `ILBC = "ilbc"`
    *   `APPLEIMA4 = "ima4"`
    *   `LINEARPCM = "lpcm"`
    *   `MACE3 = "MAC3"`
    *   `MACE6 = "MAC6"`
    *   `AMR = "samr"`
    *   `AMR_WB = "sawb"`
    *   `DVIINTELIMA = 1836253201` // 'ima4' como entero
    *   `MICROSOFTGSM = 1836253233` // 'gsm ' como entero
    *   `QUALCOMM = "Qclp"`
    *   `QDESIGN2 = "QDM2"`
    *   `QDESIGN = "QDMC"`
    *   `MPEG4TWINVQ = "twvq"`
    *   `ULAW = "ulaw"`
*   **`PermissionStatus`**
    *   `DENIED = "denied"`: El usuario ha denegado el permiso.
    *   `GRANTED = "granted"`: El usuario ha concedido el permiso.
    *   `UNDETERMINED = "undetermined"`: El usuario aún no ha concedido o denegado el permiso.