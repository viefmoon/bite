# react-native-async-storage/async-storage

## Uso

Async Storage solo puede almacenar datos de tipo cadena (string). Para almacenar datos de objetos, primero necesitas serializarlos. Para datos que pueden ser serializados a JSON, puedes usar `JSON.stringify()` al guardar los datos y `JSON.parse()` al cargarlos.

### Importación

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';
```

### Almacenamiento de datos

`setItem()` se utiliza tanto para agregar un nuevo elemento de datos (cuando no existen datos para la clave dada) como para modificar un elemento existente (cuando existen datos previos para la clave dada).

#### Almacenamiento de valor de cadena

```javascript
const storeData = async (value) => {
  try {
    await AsyncStorage.setItem('my-key', value);
  } catch (e) {
    // error al guardar
  }
};
```

#### Almacenamiento de valor de objeto

```javascript
const storeData = async (value) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem('my-key', jsonValue);
  } catch (e) {
    // error al guardar
  }
};
```

### Lectura de datos

`getItem` devuelve una promesa que se resuelve con el valor almacenado cuando se encuentran datos para la clave dada, o devuelve `null` en caso contrario.

#### Lectura de valor de cadena

```javascript
const getData = async () => {
  try {
    const value = await AsyncStorage.getItem('my-key');
    if (value !== null) {
      // valor previamente almacenado
    }
  } catch (e) {
    // error al leer el valor
  }
};
```

#### Lectura de valor de objeto

```javascript
const getData = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem('my-key');
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    // error al leer el valor
  }
};
```

## API

### `getItem`

Obtiene un valor de cadena para una clave dada. Esta función puede devolver un valor de cadena para una clave existente o devolver `null` en caso contrario.

Para almacenar un valor de objeto, necesitas deserializarlo, por ejemplo, usando `JSON.parse()`.

Nota (legado): puedes usar un callback opcional como alternativa a la promesa devuelta.

**Firma:**

```javascript
static getItem(key: string, [callback]: ?(error: ?Error, result: ?string) => void): Promise
```

**Devuelve:**

Promesa que se resuelve con un valor de cadena, si existe una entrada para la clave dada, o `null` en caso contrario.

La promesa también puede ser rechazada en caso de error de almacenamiento subyacente.

**Ejemplo:**

```javascript
getMyStringValue = async () => {
  try {
    return await AsyncStorage.getItem('@key')
  } catch(e) {
    // error de lectura
  }

  console.log('Hecho.')
}

getMyObject = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem('@key')
    return jsonValue != null ? JSON.parse(jsonValue) : null
  } catch(e) {
    // error de lectura
  }

  console.log('Hecho.')
}
```

### `setItem`

Establece un valor de cadena para una clave dada. Esta operación puede modificar una entrada existente, si existía para la clave dada, o agregar una nueva en caso contrario.

Para almacenar un valor de objeto, necesitas serializarlo, por ejemplo, usando `JSON.stringify()`.

Nota (legado): puedes usar un callback opcional como alternativa a la promesa devuelta.

**Firma:**

```javascript
static setItem(key: string, value: string, [callback]: ?(error: ?Error) => void): Promise
```

**Devuelve:**

Promesa que se resuelve cuando se completa la operación de establecimiento.

La promesa también puede ser rechazada en caso de error de almacenamiento subyacente.

**Ejemplo:**

```javascript
setStringValue = async (value) => {
  try {
    await AsyncStorage.setItem('key', value)
  } catch(e) {
    // error al guardar
  }

  console.log('Hecho.')
}

setObjectValue = async (value) => {
  try {
    const jsonValue = JSON.stringify(value)
    await AsyncStorage.setItem('key', jsonValue)
  } catch(e) {
    // error al guardar
  }

  console.log('Hecho.')
}
```

### `mergeItem`

Fusiona un valor existente almacenado bajo una clave, con un nuevo valor, asumiendo que ambos valores son JSON stringificados.

**Firma:**

```javascript
static mergeItem(key: string, value: string, [callback]: ?(error: ?Error) => void): Promise
```

**Devuelve:**

Promesa con los datos fusionados, si existen, `null` en caso contrario.

**Ejemplo:**

```javascript
const USER_1 = {
  name: 'Tom',
  age: 20,
  traits: {
    hair: 'black',
    eyes: 'blue'
  }
}

const USER_2 = {
  name: 'Sarah',
  age: 21,
  hobby: 'cars',
  traits: {
    eyes: 'green',
  }
}


mergeUsers = async () => {
  try {
    //guardar primer usuario
    await AsyncStorage.setItem('@MyApp_user', JSON.stringify(USER_1))

    // fusionar USER_2 en USER_1 guardado
    await AsyncStorage.mergeItem('@MyApp_user', JSON.stringify(USER_2))

    // leer elemento fusionado
    const currentUser = await AsyncStorage.getItem('@MyApp_user')

    console.log(currentUser)

    // resultado en consola:
    // {
    //   name: 'Sarah',
    //   age: 21,
    //   hobby: 'cars',
    //   traits: {
    //     eyes: 'green',
    //     hair: 'black'
    //   }
    // }
  } catch(e) {
     // error
  }
}
```

### `removeItem`

Elimina el elemento para una clave, invoca el callback (opcional) una vez completado.

**Firma:**

```javascript
static removeItem(key: string, [callback]: ?(error: ?Error) => void): Promise
```

**Devuelve:**

Objeto Promesa.

**Ejemplo:**

```javascript
removeValue = async () => {
  try {
    await AsyncStorage.removeItem('@MyApp_key')
  } catch(e) {
    // error al eliminar
  }

  console.log('Hecho.')
}
```

### `getAllKeys`

Devuelve todas las claves conocidas por tu aplicación, para todos los llamadores, bibliotecas, etc. Una vez completado, invoca el callback con errores (si los hay) y un array de claves.

**Firma:**

```javascript
static getAllKeys([callback]: ?(error: ?Error, keys: ?Array<string>) => void): Promise
```

**Devuelve:**

Objeto Promesa.

**Ejemplo:**

```javascript
getAllKeys = async () => {
  let keys = []
  try {
    keys = await AsyncStorage.getAllKeys()
  } catch(e) {
    // error al leer la clave
  }

  console.log(keys)
  // ejemplo de resultado en consola:
  // ['@MyApp_user', '@MyApp_key']
}
```

### `multiGet`

Obtiene múltiples pares clave-valor para un array dado de claves en un lote. Una vez completado, invoca el callback con errores (si los hay) y los resultados.

**Firma:**

```javascript
static multiGet(keys: Array<string>, [callback]: ?(errors: ?Array<Error>, result: ?Array<Array<string>>) => void): Promise
```

**Devuelve:**

Promesa de un array con los pares clave-valor correspondientes encontrados, almacenados como un array `[key, value]`.

**Ejemplo:**

```javascript
getMultiple = async () => {

  let values
  try {
    values = await AsyncStorage.multiGet(['@MyApp_user', '@MyApp_key'])
  } catch(e) {
    // error de lectura
  }
  console.log(values)

  // ejemplo de salida en consola:
  // [ ['@MyApp_user', 'myUserValue'], ['@MyApp_key', 'myKeyValue'] ]
}
```

### `multiSet`

Almacena múltiples pares clave-valor en un lote. Una vez completado, se llamará al callback con cualquier error.

**Firma:**

```javascript
static multiSet(keyValuePairs: Array<Array<string>>, [callback]: ?(errors: ?Array<Error>) => void): Promise
```

**Devuelve:**

Objeto Promesa.

**Ejemplo:**

```javascript
multiSet = async () => {
  const firstPair = ["@MyApp_user", "value_1"]
  const secondPair = ["@MyApp_key", "value_2"]
  try {
    await AsyncStorage.multiSet([firstPair, secondPair])
  } catch(e) {
    //error al guardar
  }

  console.log("Hecho.")
}
```

### `multiMerge`

Fusión múltiple de valores existentes y nuevos en un lote. Asume que los valores son JSON stringificados. Una vez completado, invoca el callback con errores (si los hay).

**Firma:**

```javascript
static multiMerge(keyValuePairs: Array<Array<string>>, [callback]: ?(errors: ?Array<Error>) => void): Promise
```

**Devuelve:**

Objeto Promesa.

**Ejemplo:**

```javascript
const USER_1 = {
  name: 'Tom',
  age: 30,
  traits: {hair: 'brown'},
};

const USER_1_DELTA = {
  age: 31,
  traits: {eyes: 'blue'},
};

const USER_2 = {
  name: 'Sarah',
  age: 25,
  traits: {hair: 'black'},
};

const USER_2_DELTA = {
  age: 26,
  traits: {hair: 'green'},
};


const multiSet = [
  ["@MyApp_USER_1", JSON.stringify(USER_1)],
  ["@MyApp_USER_2", JSON.stringify(USER_2)]
]

const multiMerge = [
  ["@MyApp_USER_1", JSON.stringify(USER_1_DELTA)],
  ["@MyApp_USER_2", JSON.stringify(USER_2_DELTA)]
]


mergeMultiple = async () => {
  let parsedCurrentlyMerged

  try {
    await AsyncStorage.multiSet(multiSet)
    await AsyncStorage.multiMerge(multiMerge)
    const currentlyMerged = await AsyncStorage.multiGet(['@MyApp_USER_1', '@MyApp_USER_2'])
    parsedCurrentlyMerged = currentlyMerged.map(([key, value]) => [
      key,
      JSON.parse(value),
    ]);
  } catch(e) {
    // error
  }

  console.log(
    'parsedCurrentlyMerged',
    JSON.stringify(parsedCurrentlyMerged, null, 2),
  );
  // salida en consola:
  /*
  [
    [
      "@MyApp_USER_1",
      {
        "name": "Tom",
        "age": 31,
        "traits": {
          "hair": "brown",
          "eyes": "blue"
        }
      }
    ],
    [
      "@MyApp_USER_2",
      {
        "name": "Sarah",
        "age": 26,
        "traits": {
          "hair": "green"
        }
      }
    ]
  ]
  */
}
```

### `multiRemove`

Borra múltiples entradas clave-valor para un array dado de claves en un lote. Una vez completado, invoca un callback con errores (si los hay).

**Firma:**

```javascript
static multiRemove(keys: Array<string>, [callback]: ?(errors: ?Array<Error>) => void)
```

**Devuelve:**

Objeto Promesa.

**Ejemplo:**

```javascript
removeFew = async () => {
  const keys = ['@MyApp_USER_1', '@MyApp_USER_2']
  try {
    await AsyncStorage.multiRemove(keys)
  } catch(e) {
    // error al eliminar
  }

  console.log('Hecho')
}
```

### `clear`

Elimina todos los datos de AsyncStorage, para todos los clientes, bibliotecas, etc. Probablemente quieras usar `removeItem` o `multiRemove` para borrar solo las claves de tu aplicación.

**Firma:**

```javascript
static clear([callback]: ?(error: ?Error) => void): Promise
```

**Devuelve:**

Objeto Promesa.

**Ejemplo:**

```javascript
clearAll = async () => {
  try {
    await AsyncStorage.clear()
  } catch(e) {
    // error al borrar
  }

  console.log('Hecho.')
}
```

### `useAsyncStorage`

Nota: Una interfaz similar a los hooks con la que estamos experimentando. Esto cambiará en el futuro cercano para aprovechar completamente la API de Hooks, así que siéntete libre de seguir esta discusión para obtener más información.

`useAsyncStorage` devuelve un objeto que expone todos los métodos que te permiten interactuar con el valor almacenado.

**Firma:**

```javascript
static useAsyncStorage(key: string): {
  getItem: (
    callback?: ?(error: ?Error, result: string | null) => void,
  ) => Promise<string | null>,
  setItem: (
    value: string,
    callback?: ?(error: ?Error) => void,
  ) => Promise<null>,
  mergeItem: (
    value: string,
    callback?: ?(error: ?Error) => void,
  ) => Promise<null>,
  removeItem: (callback?: ?(error: ?Error) => void) => Promise<null>,
}
```

**Devuelve:**

objeto

**Ejemplo Específico:**

Puedes reemplazar tu `App.js` con lo siguiente para verlo en acción.

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAsyncStorage } from '@react-native-async-storage/async-storage';

export default function App() {
  const [value, setValue] = useState('value');
  const { getItem, setItem } = useAsyncStorage('@storage_key');

  const readItemFromStorage = async () => {
    const item = await getItem();
    setValue(item);
  };

  const writeItemToStorage = async newValue => {
    await setItem(newValue);
    setValue(newValue);
  };

  useEffect(() => {
    readItemFromStorage();
  }, []);

  return (
    <View style={{ margin: 40 }}>
      <Text>Valor actual: {value}</Text>
      <TouchableOpacity
        onPress={() =>
          writeItemToStorage(
            Math.random()
              .toString(36)
              .substr(2, 5)
          )
        }
      >
        <Text>Actualizar valor</Text>
      </TouchableOpacity>
    </View>
  );
}
```

En este ejemplo:

-   Al montar, leemos el valor en `@storage_key` y lo guardamos en el estado bajo `value`.
-   Al presionar "actualizar valor", se genera una nueva cadena, se guarda en async storage y en el estado del componente.
-   Intenta recargar tu aplicación: verás que el último valor todavía se está leyendo desde async storage.

## Límites de almacenamiento conocidos

### Android

AsyncStorage para Android utiliza SQLite como backend de almacenamiento. Si bien tiene sus propios límites de tamaño, el sistema Android también tiene dos límites conocidos: el tamaño total de almacenamiento y el límite de tamaño por entrada.

-   **Tamaño total de almacenamiento:** está limitado a 6 MB por defecto. Puedes aumentar este tamaño especificando un nuevo tamaño mediante una bandera de característica.
-   **Por entrada:** está limitado por el tamaño de un `WindowCursor`, un búfer utilizado para leer datos de SQLite. Actualmente su tamaño es de alrededor de 2 MB. Esto significa que el elemento único leído a la vez no puede ser mayor de 2 MB. No hay una solución alternativa compatible desde AsyncStorage. Sugerimos mantener tus datos por debajo de eso, dividiéndolos en muchas entradas, en lugar de una entrada masiva. Aquí es donde las API `multiGet` y `multiSet` pueden brillar.