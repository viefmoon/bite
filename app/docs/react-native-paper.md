# Documentación de React Native Paper

## Introducción

React Native Paper es una colección de componentes personalizables y listos para producción para React Native, siguiendo las directrices de Material Design de Google. Esta biblioteca proporciona una amplia gama de componentes UI que facilitan el desarrollo de aplicaciones móviles con una apariencia profesional y consistente tanto en iOS como en Android.

## Componentes

### ActivityIndicator

El componente ActivityIndicator muestra un indicador de carga circular.

#### Uso

```jsx
import * as React from "react";
import { ActivityIndicator } from "react-native-paper";

const MyComponent = () => (
  <ActivityIndicator animating={true} color="#00ff00" />
);
```

#### Propiedades

- **animating**: boolean - Determina si el indicador está animándose.
- **color**: string - Color del indicador.
- **size**: 'small' | 'large' | number - Tamaño del indicador.
- **hidesWhenStopped**: boolean - Oculta el indicador cuando no está animándose.

### Appbar

El componente Appbar muestra información y acciones relacionadas con la pantalla actual.

#### Uso

```jsx
import * as React from "react";
import { Appbar } from "react-native-paper";

const MyComponent = () => (
  <Appbar.Header>
    <Appbar.BackAction onPress={() => {}} />
    <Appbar.Content title="Título" subtitle="Subtítulo" />
    <Appbar.Action icon="magnify" onPress={() => {}} />
    <Appbar.Action icon="dots-vertical" onPress={() => {}} />
  </Appbar.Header>
);
```

#### Subcomponentes

- **Appbar.Header**: Contenedor principal para la barra de aplicaciones.
- **Appbar.BackAction**: Botón de retroceso.
- **Appbar.Content**: Contenido principal (título y subtítulo).
- **Appbar.Action**: Botón de acción con icono.

#### Propiedades principales

- **dark**: boolean - Determina si la barra de aplicaciones utiliza el tema oscuro.
- **statusBarHeight**: number - Altura de la barra de estado.
- **elevated**: boolean - Determina si la barra de aplicaciones tiene elevación.
- **style**: object - Estilo personalizado para la barra de aplicaciones.

### Avatar

El componente Avatar muestra una imagen de perfil, iniciales o icono.

#### Uso

```jsx
import * as React from "react";
import { Avatar } from "react-native-paper";

const MyComponent = () => (
  <>
    <Avatar.Icon size={24} icon="folder" />
    <Avatar.Image size={24} source={require("../assets/avatar.png")} />
    <Avatar.Text size={24} label="XD" />
  </>
);
```

#### Subcomponentes

- **Avatar.Icon**: Avatar con un icono.
- **Avatar.Image**: Avatar con una imagen.
- **Avatar.Text**: Avatar con texto (iniciales).

#### Propiedades principales

- **size**: number - Tamaño del avatar.
- **style**: object - Estilo personalizado para el avatar.
- **icon**: string - Nombre del icono (para Avatar.Icon).
- **source**: object - Fuente de la imagen (para Avatar.Image).
- **label**: string - Texto a mostrar (para Avatar.Text).

### Badge

El componente Badge muestra un pequeño indicador numérico o de estado.

#### Uso

```jsx
import * as React from "react";
import { Badge } from "react-native-paper";

const MyComponent = () => <Badge>3</Badge>;
```

#### Propiedades

- **visible**: boolean - Determina si el badge es visible.
- **size**: number - Tamaño del badge.
- **style**: object - Estilo personalizado para el badge.

### Banner

El componente Banner muestra un mensaje importante y acciones relacionadas.

#### Uso

```jsx
import * as React from "react";
import { Banner } from "react-native-paper";

const MyComponent = () => {
  const [visible, setVisible] = React.useState(true);

  return (
    <Banner
      visible={visible}
      actions={[
        {
          label: "Arreglar ahora",
          onPress: () => setVisible(false),
        },
        {
          label: "Más tarde",
          onPress: () => setVisible(false),
        },
      ]}
      icon={({ size }) => (
        <Image
          source={require("../assets/notification.png")}
          style={{ width: size, height: size }}
        />
      )}
    >
      Hay problemas con tu conexión a internet.
    </Banner>
  );
};
```

#### Propiedades

- **visible**: boolean - Determina si el banner es visible.
- **actions**: Array - Acciones disponibles en el banner.
- **icon**: ({ size }) => React.ReactNode - Icono a mostrar.
- **children**: React.ReactNode - Contenido del banner.

### BottomNavigation

El componente BottomNavigation proporciona navegación entre vistas principales en una aplicación.

#### Uso

```jsx
import * as React from "react";
import { BottomNavigation, Text } from "react-native-paper";

const MusicRoute = () => <Text>Music</Text>;
const AlbumsRoute = () => <Text>Albums</Text>;
const RecentsRoute = () => <Text>Recents</Text>;

const MyComponent = () => {
  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState([
    { key: "music", title: "Music", icon: "music" },
    { key: "albums", title: "Albums", icon: "album" },
    { key: "recents", title: "Recents", icon: "history" },
  ]);

  const renderScene = BottomNavigation.SceneMap({
    music: MusicRoute,
    albums: AlbumsRoute,
    recents: RecentsRoute,
  });

  return (
    <BottomNavigation
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={renderScene}
    />
  );
};
```

#### Propiedades

- **navigationState**: object - Estado de navegación con índice y rutas.
- **onIndexChange**: function - Función llamada cuando cambia el índice.
- **renderScene**: function - Función para renderizar la escena para una ruta.
- **shifting**: boolean - Determina si la navegación utiliza el modo shifting.
- **labeled**: boolean - Determina si se muestran las etiquetas.

### Button

El componente Button permite a los usuarios realizar acciones y tomar decisiones con un solo toque.

#### Uso

```jsx
import * as React from "react";
import { Button } from "react-native-paper";

const MyComponent = () => (
  <>
    <Button
      icon="camera"
      mode="contained"
      onPress={() => console.log("Pressed")}
    >
      Press me
    </Button>
    <Button
      icon="camera"
      mode="outlined"
      onPress={() => console.log("Pressed")}
    >
      Press me
    </Button>
    <Button icon="camera" mode="text" onPress={() => console.log("Pressed")}>
      Press me
    </Button>
  </>
);
```

#### Propiedades

- **mode**: 'text' | 'outlined' | 'contained' - Modo del botón.
- **dark**: boolean - Determina si el botón utiliza el tema oscuro.
- **compact**: boolean - Determina si el botón es compacto.
- **icon**: string - Icono a mostrar.
- **loading**: boolean - Muestra un indicador de carga.
- **disabled**: boolean - Deshabilita el botón.
- **onPress**: function - Función llamada cuando se presiona el botón.
- **style**: object - Estilo personalizado para el botón.

### CardComponent

El componente Card es una hoja de material que sirve como punto de entrada a información más detallada.

#### Uso

```jsx
import * as React from "react";
import { Avatar, Button, Card, Text } from "react-native-paper";

const LeftContent = (props) => <Avatar.Icon {...props} icon="folder" />;

const MyComponent = () => (
  <Card>
    <Card.Title
      title="Card Title"
      subtitle="Card Subtitle"
      left={LeftContent}
    />
    <Card.Content>
      <Text variant="titleLarge">Card title</Text>
      <Text variant="bodyMedium">Card content</Text>
    </Card.Content>
    <Card.Cover source={{ uri: "https://picsum.photos/700" }} />
    <Card.Actions>
      <Button>Cancel</Button>
      <Button>Ok</Button>
    </Card.Actions>
  </Card>
);
```

#### Subcomponentes

- **Card.Title**: Título de la tarjeta.
- **Card.Content**: Contenido de la tarjeta.
- **Card.Cover**: Imagen de portada de la tarjeta.
- **Card.Actions**: Acciones de la tarjeta.

#### Propiedades principales

- **mode**: 'elevated' | 'outlined' | 'contained' - Modo de la tarjeta.
- **elevation**: number - Elevación de la tarjeta.
- **onPress**: function - Función llamada cuando se presiona la tarjeta.
- **style**: object - Estilo personalizado para la tarjeta.

### Checkbox

El componente Checkbox permite la selección de múltiples opciones de un conjunto.

#### Uso

```jsx
import * as React from "react";
import { Checkbox } from "react-native-paper";

const MyComponent = () => {
  const [checked, setChecked] = React.useState(false);

  return (
    <Checkbox
      status={checked ? "checked" : "unchecked"}
      onPress={() => {
        setChecked(!checked);
      }}
    />
  );
};
```

#### Subcomponentes

- **Checkbox.Android**: Checkbox con estilo de Android.
- **Checkbox.IOS**: Checkbox con estilo de iOS.
- **Checkbox.Item**: Checkbox con etiqueta.

#### Propiedades principales

- **status**: 'checked' | 'unchecked' | 'indeterminate' - Estado del checkbox.
- **disabled**: boolean - Deshabilita el checkbox.
- **onPress**: function - Función llamada cuando se presiona el checkbox.
- **color**: string - Color del checkbox cuando está marcado.
- **uncheckedColor**: string - Color del checkbox cuando no está marcado.

### Chip

El componente Chip es un elemento compacto que representa una entrada, atributo o acción.

#### Uso

```jsx
import * as React from "react";
import { Chip } from "react-native-paper";

const MyComponent = () => (
  <Chip icon="information" onPress={() => console.log("Pressed")}>
    Example Chip
  </Chip>
);
```

#### Propiedades

- **mode**: 'flat' | 'outlined' - Modo del chip.
- **selected**: boolean - Determina si el chip está seleccionado.
- **disabled**: boolean - Deshabilita el chip.
- **icon**: string - Icono a mostrar.
- **avatar**: React.ReactNode - Avatar a mostrar.
- **onPress**: function - Función llamada cuando se presiona el chip.
- **onClose**: function - Función llamada cuando se presiona el botón de cierre.
- **style**: object - Estilo personalizado para el chip.

### DataTable

El componente DataTable permite mostrar conjuntos de datos.

#### Uso

```jsx
import * as React from "react";
import { DataTable } from "react-native-paper";

const MyComponent = () => {
  const [page, setPage] = React.useState(0);
  const [numberOfItemsPerPageList] = React.useState([2, 3, 4]);
  const [itemsPerPage, onItemsPerPageChange] = React.useState(
    numberOfItemsPerPageList[0]
  );

  const [items] = React.useState([
    {
      key: 1,
      name: "Cupcake",
      calories: 356,
      fat: 16,
    },
    {
      key: 2,
      name: "Eclair",
      calories: 262,
      fat: 16,
    },
    {
      key: 3,
      name: "Frozen yogurt",
      calories: 159,
      fat: 6,
    },
    {
      key: 4,
      name: "Gingerbread",
      calories: 305,
      fat: 3.7,
    },
  ]);

  return (
    <DataTable>
      <DataTable.Header>
        <DataTable.Title>Dessert</DataTable.Title>
        <DataTable.Title numeric>Calories per piece</DataTable.Title>
        <DataTable.Title numeric>Fat (g)</DataTable.Title>
      </DataTable.Header>

      {items
        .slice(page * itemsPerPage, (page + 1) * itemsPerPage)
        .map((item) => (
          <DataTable.Row key={item.key}>
            <DataTable.Cell>{item.name}</DataTable.Cell>
            <DataTable.Cell numeric>{item.calories}</DataTable.Cell>
            <DataTable.Cell numeric>{item.fat}</DataTable.Cell>
          </DataTable.Row>
        ))}

      <DataTable.Pagination
        page={page}
        numberOfPages={Math.ceil(items.length / itemsPerPage)}
        onPageChange={(page) => setPage(page)}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={onItemsPerPageChange}
        numberOfItemsPerPageList={numberOfItemsPerPageList}
        showFastPaginationControls
        selectPageDropdownLabel={"Rows per page"}
      />
    </DataTable>
  );
};
```

#### Subcomponentes

- **DataTable.Header**: Encabezado de la tabla.
- **DataTable.Title**: Título de columna.
- **DataTable.Row**: Fila de la tabla.
- **DataTable.Cell**: Celda de la tabla.
- **DataTable.Pagination**: Paginación de la tabla.

### Dialog

El componente Dialog informa a los usuarios sobre una tarea específica y puede contener información crítica, requerir decisiones o involucrar múltiples tareas.

#### Uso

```jsx
import * as React from "react";
import { View } from "react-native";
import {
  Button,
  Dialog,
  Portal,
  PaperProvider,
  Text,
} from "react-native-paper";

const MyComponent = () => {
  const [visible, setVisible] = React.useState(false);

  const showDialog = () => setVisible(true);
  const hideDialog = () => setVisible(false);

  return (
    <PaperProvider>
      <View>
        <Button onPress={showDialog}>Show Dialog</Button>
        <Portal>
          <Dialog visible={visible} onDismiss={hideDialog}>
            <Dialog.Title>Alert</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium">This is simple dialog</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={hideDialog}>Done</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    </PaperProvider>
  );
};
```

#### Subcomponentes

- **Dialog.Title**: Título del diálogo.
- **Dialog.Content**: Contenido del diálogo.
- **Dialog.Actions**: Acciones del diálogo.
- **Dialog.Icon**: Icono del diálogo.

#### Propiedades principales

- **visible**: boolean - Determina si el diálogo es visible.
- **dismissable**: boolean - Determina si el diálogo se puede cerrar tocando fuera de él.
- **onDismiss**: function - Función llamada cuando se cierra el diálogo.

### Divider

Un Divider es un separador delgado y ligero que agrupa contenido en listas y diseños de página.

#### Uso

```jsx
import * as React from "react";
import { View } from "react-native";
import { Divider, Text } from "react-native-paper";

const MyComponent = () => (
  <View>
    <Text>Lemon</Text>
    <Divider />
    <Text>Mango</Text>
    <Divider />
  </View>
);
```

#### Propiedades

- **leftInset**: boolean - (Renombrado de `inset` en v5.x) Determina si el divisor tiene un margen izquierdo.
- **horizontalInset**: boolean - (Disponible en v5.x con versión de tema 3, valor predeterminado: `false`) Determina si el divisor tiene un margen horizontal en ambos lados.
- **bold**: boolean - (Disponible en v5.x con versión de tema 3, valor predeterminado: `false`) Determina si el divisor debe ser más grueso (negrita).
- **style**: StyleProp<ViewStyle> - Estilo personalizado para el divisor.
- **theme**: ThemeProp - Tema para aplicar al componente.

### Drawer.CollapsedItem

El componente Drawer.CollapsedItem se utiliza para mostrar un elemento de acción con un icono y opcionalmente una etiqueta en un cajón de navegación colapsado.

#### Uso

```jsx
import * as React from "react";
import { Drawer } from "react-native-paper";

const MyComponent = () => (
  <Drawer.CollapsedItem
    focusedIcon="inbox"
    unfocusedIcon="inbox-outline"
    label="Inbox"
  />
);
```

#### Propiedades

- **label**: string - El texto de la etiqueta del elemento.
- **badge**: string | number | boolean - Insignia para mostrar en el icono, puede ser true para mostrar un punto, string o número para mostrar texto.
- **disabled**: boolean - Determina si el elemento está deshabilitado.
- **focusedIcon**: IconSource - Icono a utilizar como icono de destino enfocado, puede ser una cadena, una fuente de imagen o un componente de React.
- **unfocusedIcon**: IconSource - Icono a utilizar como icono de destino no enfocado, puede ser una cadena, una fuente de imagen o un componente de React.
- **active**: boolean - Determina si se debe resaltar el elemento del cajón como activo.
- **onPress**: function - Función a ejecutar al presionar.
- **labelMaxFontSizeMultiplier**: number - Especifica la escala más grande posible que puede alcanzar la fuente de la etiqueta.
- **accessibilityLabel**: string - Etiqueta de accesibilidad para el botón.
- **style**: StyleProp<ViewStyle> - Estilo personalizado para el elemento.
- **theme**: ThemeProp - Tema para aplicar al componente.

### Drawer.Item

El componente Drawer.Item se utiliza para mostrar un elemento de acción con un icono y una etiqueta en un cajón de navegación.

#### Uso

```jsx
import * as React from "react";
import { Drawer } from "react-native-paper";

const MyComponent = () => (
  <Drawer.Item
    style={{ backgroundColor: "#64ffda" }}
    icon="star"
    label="First Item"
  />
);
```

#### Propiedades

- **label**: string (requerido) - El texto de la etiqueta del elemento.
- **icon**: IconSource - Icono a mostrar para el DrawerItem.
- **active**: boolean - Determina si se debe resaltar el elemento del cajón como activo.
- **disabled**: boolean - Determina si el elemento está deshabilitado.
- **onPress**: function - Función a ejecutar al presionar.
- **background**: PressableAndroidRippleConfig - Tipo de fondo para mostrar el feedback (Android).
- **accessibilityLabel**: string - Etiqueta de accesibilidad para el botón.
- **right**: function - Callback que devuelve un elemento React para mostrar en el lado derecho.
- **labelMaxFontSizeMultiplier**: number - Especifica la escala más grande posible que puede alcanzar la fuente de la etiqueta.
- **rippleColor**: ColorValue - Color del efecto de ondulación.
- **style**: StyleProp<ViewStyle> - Estilo personalizado para el elemento.
- **theme**: ThemeProp - Tema para aplicar al componente.

### Drawer.Section

El componente Drawer.Section se utiliza para agrupar contenido dentro de un cajón de navegación.

#### Uso

```jsx
import * as React from "react";
import { Drawer } from "react-native-paper";

const MyComponent = () => {
  const [active, setActive] = React.useState("");

  return (
    <Drawer.Section title="Some title">
      <Drawer.Item
        label="First Item"
        active={active === "first"}
        onPress={() => setActive("first")}
      />
      <Drawer.Item
        label="Second Item"
        active={active === "second"}
        onPress={() => setActive("second")}
      />
    </Drawer.Section>
  );
};
```

#### Propiedades

- **title**: string - Título para mostrar como encabezado de la sección.
- **children**: React.ReactNode (requerido) - Contenido del Drawer.Section.
- **showDivider**: boolean - Determina si se muestra un Divider al final de la sección. True por defecto.
- **titleMaxFontSizeMultiplier**: number - Especifica la escala más grande posible que puede alcanzar la fuente del título.
- **style**: StyleProp<ViewStyle> - Estilo personalizado para la sección.
- **theme**: ThemeProp - Tema para aplicar al componente.

### FAB (Floating Action Button)

El componente FAB (Floating Action Button) representa la acción principal en una pantalla. Aparece por encima de todo el contenido de la pantalla.

#### Uso

```jsx
import * as React from "react";
import { StyleSheet } from "react-native";
import { FAB } from "react-native-paper";

const MyComponent = () => (
  <FAB icon="plus" style={styles.fab} onPress={() => console.log("Pressed")} />
);

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
```

#### Propiedades

- **icon**: IconSource - Icono a mostrar en el FAB. Es opcional solo si label está definido.
- **label**: string - Etiqueta opcional para FAB extendido. Es opcional solo si icon está definido.
- **uppercase**: boolean - Hace que el texto de la etiqueta esté en mayúsculas.
- **background**: PressableAndroidRippleConfig - Tipo de fondo para mostrar el feedback (Android).
- **accessibilityLabel**: string - Etiqueta de accesibilidad para el FAB. Usa label por defecto si está especificado.
- **accessibilityState**: AccessibilityState - Estado de accesibilidad para el FAB.
- **animated**: boolean - Determina si el cambio de icono está animado. Valor por defecto: true.
- **small**: boolean - (Obsoleto en v.5x - use prop size="small") Determina si el FAB es de tamaño mini.
- **color**: string - Color personalizado para el icono y la etiqueta del FAB.
- **rippleColor**: ColorValue - Color del efecto de ondulación.
- **disabled**: boolean - Determina si el FAB está deshabilitado.
- **visible**: boolean - Determina si el FAB está actualmente visible. Valor por defecto: true.
- **loading**: boolean - Determina si se muestra un indicador de carga.
- **onPress**: function - Función a ejecutar al presionar.
- **onLongPress**: function - Función a ejecutar al mantener presionado.
- **delayLongPress**: number - Número de milisegundos que un usuario debe tocar el elemento antes de ejecutar onLongPress.
- **size**: 'small' | 'medium' | 'large' - Tamaño del FAB. Valor por defecto: 'medium'.
  - small - FAB con altura pequeña (40).
  - medium - FAB con altura media predeterminada (56).
  - large - FAB con altura grande (96).
- **customSize**: number - Tamaño personalizado para el FAB. Esta prop tiene prioridad sobre la prop size.
- **mode**: 'flat' | 'elevated' - Modo del FAB. Valor por defecto: 'elevated'.
  - flat - botón sin sombra.
  - elevated - botón con sombra.
- **variant**: 'primary' | 'secondary' | 'tertiary' | 'surface' - Variante de mapeo de colores para combinaciones de colores de contenedor e icono. Valor por defecto: 'primary'.
- **labelMaxFontSizeMultiplier**: number - Especifica la escala más grande posible que puede alcanzar la fuente de la etiqueta.
- **style**: StyleProp<ViewStyle> - Estilo personalizado para el FAB.
- **theme**: ThemeProp - Tema para aplicar al componente.
- **testID**: string - ID de prueba utilizado con fines de testing. Valor por defecto: 'fab'.
- **ref**: React.RefObject<View> - Referencia para el componente.

### AnimatedFAB

El componente AnimatedFAB es un botón de acción flotante animado que se extiende horizontalmente y representa la acción principal en una aplicación.

#### Uso

```jsx
import React from "react";
import {
  StyleProp,
  ViewStyle,
  Animated,
  StyleSheet,
  Platform,
  ScrollView,
  Text,
  SafeAreaView,
  I18nManager,
} from "react-native";
import { AnimatedFAB } from "react-native-paper";

const MyComponent = ({
  animatedValue,
  visible,
  extended,
  label,
  animateFrom,
  style,
  iconMode,
}) => {
  const [isExtended, setIsExtended] = React.useState(true);

  const isIOS = Platform.OS === "ios";

  const onScroll = ({ nativeEvent }) => {
    const currentScrollPosition =
      Math.floor(nativeEvent?.contentOffset?.y) ?? 0;

    setIsExtended(currentScrollPosition <= 0);
  };

  const fabStyle = { [animateFrom]: 16 };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView onScroll={onScroll}>
        {[...new Array(100).keys()].map((_, i) => (
          <Text>{i}</Text>
        ))}
      </ScrollView>
      <AnimatedFAB
        icon={"plus"}
        label={"Label"}
        extended={isExtended}
        onPress={() => console.log("Pressed")}
        visible={visible}
        animateFrom={"right"}
        iconMode={"static"}
        style={[styles.fabStyle, style, fabStyle]}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  fabStyle: {
    bottom: 16,
    right: 16,
    position: "absolute",
  },
});
```

#### Propiedades

- **icon**: IconSource (requerido) - Icono a mostrar en el FAB.
- **label**: string (requerido) - Etiqueta para el FAB extendido.
- **uppercase**: boolean - Hace que el texto de la etiqueta esté en mayúsculas.
- **background**: PressableAndroidRippleConfig - Tipo de fondo para mostrar el feedback (Android).
- **accessibilityLabel**: string - Etiqueta de accesibilidad para el FAB. Usa label por defecto si está especificado.
- **accessibilityState**: AccessibilityState - Estado de accesibilidad para el FAB.
- **color**: string - Color personalizado para el icono y la etiqueta del FAB.
- **rippleColor**: ColorValue - Color del efecto de ondulación.
- **disabled**: boolean - Determina si el FAB está deshabilitado.
- **visible**: boolean - Determina si el FAB está actualmente visible. Valor por defecto: true.
- **onPress**: function - Función a ejecutar al presionar.
- **onLongPress**: function - Función a ejecutar al mantener presionado.
- **delayLongPress**: number - Número de milisegundos que un usuario debe tocar el elemento antes de ejecutar onLongPress.
- **iconMode**: 'static' | 'dynamic' - Indica si el icono debe traducirse al final del FAB extendido o permanecer estático en el mismo lugar. Valor por defecto: 'dynamic'.
- **animateFrom**: 'left' | 'right' - Indica desde qué dirección se debe realizar la animación. Valor por defecto: 'right'.
- **extended**: boolean - Determina si el FAB debe iniciar la animación para extenderse. Valor por defecto: false.
- **labelMaxFontSizeMultiplier**: number - Especifica la escala más grande posible que puede alcanzar la fuente de la etiqueta.
- **variant**: 'primary' | 'secondary' | 'tertiary' | 'surface' - Variante de mapeo de colores para combinaciones de colores de contenedor e icono. Valor por defecto: 'primary'.
- **style**: Animated.WithAnimatedValue<StyleProp<ViewStyle>> - Estilo personalizado para el FAB.
- **theme**: ThemeProp - Tema para aplicar al componente.
- **testID**: string - ID de prueba utilizado con fines de testing. Valor por defecto: 'animated-fab'.

### HelperText

El componente HelperText se utiliza junto con elementos de entrada para proporcionar sugerencias adicionales al usuario.

#### Uso

```jsx
import * as React from "react";
import { View } from "react-native";
import { HelperText, TextInput } from "react-native-paper";

const MyComponent = () => {
  const [text, setText] = React.useState("");

  const onChangeText = (text) => setText(text);

  const hasErrors = () => {
    return !text.includes("@");
  };

  return (
    <View>
      <TextInput label="Email" value={text} onChangeText={onChangeText} />
      <HelperText type="error" visible={hasErrors()}>
        Email address is invalid!
      </HelperText>
    </View>
  );
};
```

#### Propiedades

- **type**: 'error' | 'info' - Tipo del texto de ayuda. Valor por defecto: 'info'.
- **children**: React.ReactNode (requerido) - Contenido de texto del HelperText.
- **visible**: boolean - Determina si se muestra el texto de ayuda. Valor por defecto: true.
- **padding**: 'none' | 'normal' - Determina si se aplica relleno al texto de ayuda. Valor por defecto: 'normal'.
- **disabled**: boolean - Determina si la entrada de texto vinculada con el texto de ayuda está deshabilitada.
- **style**: StyleProp<TextStyle> - Estilo personalizado para el texto de ayuda.
- **theme**: ThemeProp - Tema para aplicar al componente.
- **testID**: string - ID de prueba utilizado con fines de testing.

### Icon

Un componente de icono que renderiza iconos de bibliotecas vectoriales.

#### Uso

```jsx
import * as React from "react";
import { Icon, MD3Colors } from "react-native-paper";

const MyComponent = () => (
  <Icon source="camera" color={MD3Colors.error50} size={20} />
);
```

#### Propiedades

- **size**: number (requerido) - Tamaño del icono.
- **allowFontScaling**: boolean - Permite el escalado de fuente.
- **source**: any (requerido) - Icono a mostrar.
- **color**: string - Color del icono.
- **testID**: string - ID de prueba utilizado con fines de testing.
- **theme**: ThemeProp - Tema para aplicar al componente.

### IconButton

Un botón de icono es un botón que muestra solo un icono sin etiqueta.

Estilos disponibles:

- default
- outlined
- contained
- contained-tonal

#### Uso

```jsx
import * as React from "react";
import { IconButton, MD3Colors } from "react-native-paper";

const MyComponent = () => (
  <IconButton
    icon="camera"
    iconColor={MD3Colors.error50}
    size={20}
    onPress={() => console.log("Pressed")}
  />
);
```

#### Propiedades

- **TouchableRipple props** - Extiende las propiedades de TouchableRipple.
- **icon**: IconSource (requerido) - Icono a mostrar.
- **mode**: 'outlined' | 'contained' | 'contained-tonal' - Modo del botón de icono. Por defecto no hay un modo específico, solo se renderizará el icono presionable. Disponible en v5.x con la versión 3 del tema.
- **iconColor**: string - Color del icono. Renombrado de 'color' a 'iconColor' en v5.x.
- **containerColor**: string - Color de fondo del contenedor del icono.
- **rippleColor**: ColorValue - Color del efecto de ondulación.
- **selected**: boolean - Determina si el botón de icono está seleccionado. Un botón seleccionado recibe una combinación alternativa de colores de icono y contenedor. Disponible en v5.x con la versión 3 del tema. Valor por defecto: false.
- **size**: number - Tamaño del icono. Valor por defecto: 24.
- **disabled**: boolean - Determina si el botón está deshabilitado. Un botón deshabilitado aparece en gris y no se llama a onPress al tocarlo.
- **animated**: boolean - Determina si el cambio de icono está animado. Valor por defecto: false.
- **accessibilityLabel**: string - Etiqueta de accesibilidad para el botón. Esto es leído por el lector de pantalla cuando el usuario toca el botón.
- **onPress**: (e: GestureResponderEvent) => void - Función a ejecutar al presionar.
- **style**: Animated.WithAnimatedValue<StyleProp<ViewStyle>> - Estilo personalizado para el botón.
- **ref**: React.RefObject<View> - Referencia para el componente.
- **testID**: string - ID de prueba utilizado con fines de testing. Valor por defecto: 'icon-button'.
- **theme**: ThemeProp - Tema para aplicar al componente.
- **loading**: boolean - Determina si se muestra un indicador de carga. Valor por defecto: false.

### List.Accordion

El componente List.Accordion se utiliza para mostrar un elemento de lista expandible.

#### Uso

```jsx
import * as React from "react";
import { List } from "react-native-paper";

const MyComponent = () => {
  const [expanded, setExpanded] = React.useState(true);

  const handlePress = () => setExpanded(!expanded);

  return (
    <List.Section title="Accordions">
      <List.Accordion
        title="Uncontrolled Accordion"
        left={(props) => <List.Icon {...props} icon="folder" />}
      >
        <List.Item title="First item" />
        <List.Item title="Second item" />
      </List.Accordion>

      <List.Accordion
        title="Controlled Accordion"
        left={(props) => <List.Icon {...props} icon="folder" />}
        expanded={expanded}
        onPress={handlePress}
      >
        <List.Item title="First item" />
        <List.Item title="Second item" />
      </List.Accordion>
    </List.Section>
  );
};
```

#### Propiedades

- **title**: React.ReactNode (requerido) - Texto del título para el acordeón.
- **description**: React.ReactNode - Texto de descripción para el acordeón.
- **left**: (props: { color: string; style: Style }) => React.ReactNode - Callback que devuelve un elemento React para mostrar en el lado izquierdo.
- **right**: (props: { isExpanded: boolean }) => React.ReactNode - Callback que devuelve un elemento React para mostrar en el lado derecho.
- **expanded**: boolean - Determina si el acordeón está expandido. Si se proporciona, el acordeón se comportará como un "componente controlado". Necesitarás actualizar esta prop cuando desees alternar el componente o en onPress.
- **onPress**: (e: GestureResponderEvent) => void - Función a ejecutar al presionar.
- **onLongPress**: (e: GestureResponderEvent) => void - Función a ejecutar al mantener presionado.
- **delayLongPress**: number - Número de milisegundos que un usuario debe tocar el elemento antes de ejecutar onLongPress.
- **children**: React.ReactNode (requerido) - Contenido de la sección.
- **theme**: ThemeProp - Tema para aplicar al componente.
- **background**: PressableAndroidRippleConfig - Tipo de fondo a mostrar para el feedback (Android).
- **style**: StyleProp<ViewStyle> - Estilo personalizado para el elemento TouchableRipple.
- **titleStyle**: StyleProp<TextStyle> - Estilo personalizado para el elemento Title.
- **descriptionStyle**: StyleProp<TextStyle> - Estilo personalizado para el elemento Description.
- **rippleColor**: ColorValue - Color del efecto de ondulación.
- **titleNumberOfLines**: number - Trunca el texto del título para que no exceda este número de líneas. Valor por defecto: 1.
- **descriptionNumberOfLines**: number - Trunca el texto de la descripción para que no exceda este número de líneas. Valor por defecto: 2.
- **titleMaxFontSizeMultiplier**: number - Especifica la escala más grande posible que puede alcanzar la fuente del título.
- **descriptionMaxFontSizeMultiplier**: number - Especifica la escala más grande posible que puede alcanzar la fuente de la descripción.
- **id**: string | number - ID utilizado para distinguir un acordeón específico cuando se utiliza List.AccordionGroup. Esta propiedad es requerida cuando se utiliza List.AccordionGroup y no tiene impacto en el comportamiento cuando se utiliza List.Accordion de forma independiente.
- **testID**: string - ID de prueba utilizado con fines de testing.
- **accessibilityLabel**: string - Etiqueta de accesibilidad para el TouchableRipple. Esto es leído por el lector de pantalla cuando el usuario toca el elemento.
- **pointerEvents**: ViewProps['pointerEvents'] - Eventos de puntero pasados a la vista del contenedor. Valor por defecto: 'none'.

### Menu.Item

Un componente para mostrar un único elemento de lista dentro de un Menú.

#### Uso

```jsx
import * as React from "react";
import { View } from "react-native";
import { Menu } from "react-native-paper";

const MyComponent = () => (
  <View style={{ flex: 1 }}>
    <Menu.Item leadingIcon="redo" onPress={() => {}} title="Redo" />
    <Menu.Item leadingIcon="undo" onPress={() => {}} title="Undo" />
    <Menu.Item
      leadingIcon="content-cut"
      onPress={() => {}}
      title="Cut"
      disabled
    />
    <Menu.Item
      leadingIcon="content-copy"
      onPress={() => {}}
      title="Copy"
      disabled
    />
    <Menu.Item leadingIcon="content-paste" onPress={() => {}} title="Paste" />
  </View>
);
```

#### Propiedades

- **title**: React.ReactNode (requerido) - Texto del título para el elemento del menú.
- **leadingIcon**: IconSource - Icono principal a mostrar para el elemento del menú. Renombrado de 'icon' a 'leadingIcon' en v5.x.
- **trailingIcon**: IconSource - Icono secundario a mostrar para el elemento del menú. Disponible en v5.x con versión de tema 3.
- **disabled**: boolean - Determina si el elemento está deshabilitado. Un elemento deshabilitado aparece en gris y no se llama a onPress al tocarlo.
- **dense**: boolean - Establece la altura mínima con diseño compacto. Disponible en v5.x con versión de tema 3.
- **background**: PressableAndroidRippleConfig - Tipo de fondo drawable para mostrar el feedback (Android). https://reactnative.dev/docs/pressable#rippleconfig
- **onPress**: (e: GestureResponderEvent) => void - Función a ejecutar al presionar.
- **titleMaxFontSizeMultiplier**: number - Especifica la escala más grande posible que puede alcanzar la fuente del título. Valor por defecto: 1.5.
- **style**: StyleProp<ViewStyle> - Estilo personalizado para el elemento.
- **contentStyle**: StyleProp<ViewStyle> - Estilo personalizado para el contenido.
- **titleStyle**: StyleProp<TextStyle> - Estilo personalizado para el título.
- **rippleColor**: ColorValue - Color del efecto de ondulación.
- **theme**: ThemeProp - Tema para aplicar al componente.
- **testID**: string - ID de prueba utilizado con fines de testing. Valor por defecto: 'menu-item'.
- **accessibilityLabel**: string - Etiqueta de accesibilidad para el Touchable. Esto es leído por el lector de pantalla cuando el usuario toca el componente.
- **accessibilityState**: AccessibilityState - Estado de accesibilidad para el Touchable. Esto es leído por el lector de pantalla cuando el usuario toca el componente.

### List.AccordionGroup

El componente List.AccordionGroup permite controlar un grupo de List.Accordion. La prop id para List.Accordion es necesaria para que el grupo funcione. List.AccordionGroup puede ser un componente controlado o no controlado. El ejemplo muestra la versión no controlada. Solamente un Accordion puede estar expandido en un momento dado.

#### Uso

```jsx
import * as React from "react";
import { View, Text } from "react-native";
import { List } from "react-native-paper";

const MyComponent = () => (
  <List.AccordionGroup>
    <List.Accordion title="Accordion 1" id="1">
      <List.Item title="Item 1" />
    </List.Accordion>
    <List.Accordion title="Accordion 2" id="2">
      <List.Item title="Item 2" />
    </List.Accordion>
    <View>
      <Text>
        List.Accordion puede ser envuelto porque la implementación utiliza
        React.Context.
      </Text>
      <List.Accordion title="Accordion 3" id="3">
        <List.Item title="Item 3" />
      </List.Accordion>
    </View>
  </List.AccordionGroup>
);
```

#### Propiedades

- **onAccordionPress**: (expandedId: string | number) => void - Función a ejecutar al cambiar la selección.
- **expandedId**: string | number - ID del acordeón actualmente expandido.
- **children**: React.ReactNode (requerido) - Elementos React que contienen acordeones de lista.

### List.Icon

Un componente para mostrar un icono en un elemento de lista.

#### Uso

```jsx
import * as React from "react";
import { List, MD3Colors } from "react-native-paper";

const MyComponent = () => (
  <>
    <List.Icon color={MD3Colors.tertiary70} icon="folder" />
    <List.Icon color={MD3Colors.tertiary70} icon="equal" />
    <List.Icon color={MD3Colors.tertiary70} icon="calendar" />
  </>
);
```

#### Propiedades

- **icon**: IconSource (requerido) - Icono a mostrar.
- **color**: string - Color para el icono.
- **style**: StyleProp<ViewStyle> - Estilo personalizado para el icono.
- **theme**: ThemeProp - Tema para aplicar al componente.

### List.Item

Un componente para mostrar elementos dentro de una Lista.

#### Uso

```jsx
import * as React from "react";
import { List } from "react-native-paper";

const MyComponent = () => (
  <List.Item
    title="First Item"
    description="Item description"
    left={(props) => <List.Icon {...props} icon="folder" />}
  />
);
```

#### Propiedades

- **TouchableRipple props** - Extiende las propiedades de TouchableRipple.
- **title**: React.ReactNode | ((props: { selectable: boolean; ellipsizeMode: EllipsizeProp | undefined; color: string; fontSize: number; }) => React.ReactNode) (requerido) - Texto del título para el elemento de lista.
- **description**: React.ReactNode | ((props: { selectable: boolean; ellipsizeMode: EllipsizeProp | undefined; color: string; fontSize: number; }) => React.ReactNode) - Texto de descripción para el elemento de lista o callback que devuelve un elemento React para mostrar la descripción.
- **left**: (props: { color: string; style: Style }) => React.ReactNode - Callback que devuelve un elemento React para mostrar en el lado izquierdo.
- **right**: (props: { color: string; style?: Style }) => React.ReactNode - Callback que devuelve un elemento React para mostrar en el lado derecho.
- **onPress**: (e: GestureResponderEvent) => void - Función a ejecutar al presionar.
- **theme**: ThemeProp - Tema para aplicar al componente.
- **style**: StyleProp<ViewStyle> - Estilo personalizado para el elemento TouchableRipple.
- **contentStyle**: StyleProp<ViewStyle> - Estilo personalizado para el contenedor que envuelve el título y la descripción.
- **titleStyle**: StyleProp<TextStyle> - Estilo personalizado para el elemento Title.
- **descriptionStyle**: StyleProp<TextStyle> - Estilo personalizado para el elemento Description.
- **titleNumberOfLines**: number - Trunca el texto del título para que no exceda este número de líneas. Valor por defecto: 1.
- **descriptionNumberOfLines**: number - Trunca el texto de la descripción para que no exceda este número de líneas. Valor por defecto: 2.
- **titleEllipsizeMode**: EllipsizeProp - Modo de elipsis para el título. Uno de 'head', 'middle', 'tail', 'clip'.
- **descriptionEllipsizeMode**: EllipsizeProp - Modo de elipsis para la descripción. Uno de 'head', 'middle', 'tail', 'clip'.
- **titleMaxFontSizeMultiplier**: number - Especifica la escala más grande posible que puede alcanzar la fuente del título.
- **descriptionMaxFontSizeMultiplier**: number - Especifica la escala más grande posible que puede alcanzar la fuente de la descripción.
- **testID**: string - ID de prueba utilizado con fines de testing.

### List.Section

Un componente utilizado para agrupar elementos de lista.

#### Uso

```jsx
import * as React from "react";
import { List, MD3Colors } from "react-native-paper";

const MyComponent = () => (
  <List.Section>
    <List.Subheader>Some title</List.Subheader>
    <List.Item title="First Item" left={() => <List.Icon icon="folder" />} />
    <List.Item
      title="Second Item"
      left={() => <List.Icon color={MD3Colors.tertiary70} icon="folder" />}
    />
  </List.Section>
);
```

#### Propiedades

- **title**: string - Texto del título para la sección.
- **children**: React.ReactNode (requerido) - Contenido de la sección.
- **theme**: ThemeProp - Tema para aplicar al componente.
- **titleStyle**: StyleProp<TextStyle> - Estilo personalizado para el elemento Title.
- **style**: StyleProp<ViewStyle> - Estilo personalizado para la sección.

### List.Subheader

Un componente utilizado para mostrar un encabezado en listas.

#### Uso

```jsx
import * as React from "react";
import { List } from "react-native-paper";

const MyComponent = () => <List.Subheader>My List Title</List.Subheader>;
```

#### Propiedades

- **theme**: ThemeProp - Tema para aplicar al componente.
- **style**: StyleProp<TextStyle> - Estilo personalizado para el elemento Text.
- **maxFontSizeMultiplier**: number - Especifica la escala más grande posible que puede alcanzar la fuente de texto.

### FAB.Group

Un componente para mostrar un grupo de FABs con acciones relacionadas en un marcado de velocidad. Para renderizar el grupo por encima de otros componentes, necesitarás envolverlo con el componente Portal.

#### Uso

```jsx
import * as React from "react";
import { FAB, Portal, PaperProvider } from "react-native-paper";

const MyComponent = () => {
  const [state, setState] = React.useState({ open: false });

  const onStateChange = ({ open }) => setState({ open });

  const { open } = state;

  return (
    <PaperProvider>
      <Portal>
        <FAB.Group
          open={open}
          visible
          icon={open ? "calendar-today" : "plus"}
          actions={[
            { icon: "plus", onPress: () => console.log("Pressed add") },
            {
              icon: "star",
              label: "Star",
              onPress: () => console.log("Pressed star"),
            },
            {
              icon: "email",
              label: "Email",
              onPress: () => console.log("Pressed email"),
            },
            {
              icon: "bell",
              label: "Remind",
              onPress: () => console.log("Pressed notifications"),
            },
          ]}
          onStateChange={onStateChange}
          onPress={() => {
            if (open) {
              // do something if the speed dial is open
            }
          }}
        />
      </Portal>
    </PaperProvider>
  );
};
```

#### Propiedades

- **actions**: Array (requerido) - Elementos de acción para mostrar en forma de marcado de velocidad. Un elemento de acción debe contener las siguientes propiedades:
  - icon: icono a mostrar (requerido)
  - label: texto de etiqueta opcional
  - color: color de icono personalizado del elemento de acción
  - labelTextColor: color de texto de etiqueta personalizado del elemento de acción
  - accessibilityLabel: etiqueta de accesibilidad para la acción, usa label por defecto si está especificado
  - accessibilityHint: sugerencia de accesibilidad para la acción
  - style: estilos adicionales para el elemento fab
  - containerStyle: estilos adicionales para el contenedor de etiqueta del elemento fab
  - labelStyle: estilos adicionales para la etiqueta del elemento fab
  - labelMaxFontSizeMultiplier: especifica la escala más grande posible que puede alcanzar la fuente de un título
  - onPress: callback que se llama cuando se presiona el FAB (requerido)
  - onLongPress: callback que se llama cuando se mantiene presionado el FAB
  - toggleStackOnLongPress: callback que se llama cuando se mantiene presionado el FAB
  - size: tamaño del elemento de acción. Por defecto es small
  - testID: testID para usar en pruebas
  - rippleColor: color del efecto de ondulación
- **icon**: IconSource (requerido) - Icono a mostrar para el FAB. Puedes alternarlo según si el marcado de velocidad está abierto para mostrar un icono diferente.
- **accessibilityLabel**: string - Etiqueta de accesibilidad para el FAB.
- **color**: string - Color personalizado para el FAB.
- **backdropColor**: string - Color de fondo personalizado para el fondo del marcado de velocidad abierto.
- **rippleColor**: ColorValue - Color del efecto de ondulación.
- **onPress**: function - Función a ejecutar al presionar el FAB.
- **onLongPress**: function - Función a ejecutar al mantener presionado el FAB.
- **toggleStackOnLongPress**: boolean - Hace que las acciones aparezcan al mantener presionado en lugar de al presionar.
- **delayLongPress**: number - Cambia el retraso para la reacción de presión larga. Valor por defecto: 200.
- **enableLongPressWhenStackOpened**: boolean - Permite onLongPress cuando la pila está abierta. Valor por defecto: false.
- **open**: boolean (requerido) - Determina si el marcado de velocidad está abierto.
- **onStateChange**: function (requerido) - Callback que se llama al abrir y cerrar el marcado de velocidad.
- **visible**: boolean (requerido) - Determina si FAB está actualmente visible.
- **style**: StyleProp<ViewStyle> - Estilo para el grupo.
- **fabStyle**: Animated.WithAnimatedValue<StyleProp<ViewStyle>> - Estilo para el FAB.
- **variant**: 'primary' | 'secondary' | 'tertiary' | 'surface' - Variante de mapeo de colores para combinaciones de colores de contenedor e icono. Valor por defecto: 'primary'.
- **theme**: ThemeProp - Tema para aplicar al componente.
- **label**: string - Etiqueta opcional para FAB.
- **testID**: string - ID de prueba para pasar desde las props del Grupo al FAB.

### Modal

El componente Modal es una forma simple de presentar contenido por encima de una vista envolvente. Para renderizar el Modal por encima de otros componentes, necesitarás envolverlo con el componente Portal.

#### Uso

```jsx
import * as React from "react";
import { Modal, Portal, Text, Button, PaperProvider } from "react-native-paper";

const MyComponent = () => {
  const [visible, setVisible] = React.useState(false);

  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);
  const containerStyle = { backgroundColor: "white", padding: 20 };

  return (
    <PaperProvider>
      <Portal>
        <Modal
          visible={visible}
          onDismiss={hideModal}
          contentContainerStyle={containerStyle}
        >
          <Text>Example Modal. Click outside this area to dismiss.</Text>
        </Modal>
      </Portal>
      <Button style={{ marginTop: 30 }} onPress={showModal}>
        Show
      </Button>
    </PaperProvider>
  );
};
```

#### Propiedades

- **dismissable**: boolean - Determina si hacer clic fuera del modal lo cierra. Valor por defecto: true.
- **dismissableBackButton**: boolean - Determina si al presionar el botón de hardware Atrás de Android se cierra el diálogo. Valor por defecto: valor de dismissable.
- **onDismiss**: () => void - Función que se llama cuando el usuario cierra el modal. Valor por defecto: () => {}.
- **overlayAccessibilityLabel**: string - Etiqueta de accesibilidad para la superposición. Esto es leído por el lector de pantalla cuando el usuario toca fuera del modal. Valor por defecto: 'Close modal'.
- **visible**: boolean - Determina si el modal es visible. Valor por defecto: false.
- **children**: React.ReactNode (requerido) - Contenido del Modal.
- **contentContainerStyle**: Animated.WithAnimatedValue<StyleProp<ViewStyle>> - Estilo para el contenido del modal.
- **style**: StyleProp<ViewStyle> - Estilo para el contenedor del modal. Usa esta prop para cambiar el estilo del contenedor predeterminado o para sobrescribir los márgenes de seguridad con marginTop y marginBottom.
- **theme**: ThemeProp - Tema para aplicar al componente.
- **testID**: string - ID de prueba utilizado con fines de testing. Valor por defecto: 'modal'.

### Portal

El componente Portal permite renderizar un componente en un lugar diferente del árbol de componentes padre. Puedes usarlo para renderizar contenido que debería aparecer por encima de otros elementos, similar a Modal. Requiere que un componente Portal.Host se renderice en algún lugar del árbol padre. Ten en cuenta que si estás usando el componente Provider, este ya incluye un Portal.Host.

#### Uso

```jsx
import * as React from "react";
import { Portal, Text } from "react-native-paper";

const MyComponent = () => (
  <Portal>
    <Text>Esto se renderiza en un lugar diferente</Text>
  </Portal>
);
```

#### Propiedades

- **children**: React.ReactNode (requerido) - Contenido del Portal.
- **theme**: InternalTheme - Tema para aplicar al componente.

### Portal.Host

Portal.Host renderiza todos sus elementos Portal hijos. Por ejemplo, puedes envolver una pantalla en Portal.Host para renderizar elementos por encima de la pantalla. Si estás usando el componente Provider, este ya incluye Portal.Host.

#### Uso

```jsx
import * as React from "react";
import { Text } from "react-native";
import { Portal } from "react-native-paper";

const MyComponent = () => (
  <Portal.Host>
    <Text>Contenido de la aplicación</Text>
  </Portal.Host>
);
```

Aquí, cualquier elemento Portal bajo `<App />` se renderiza junto a `<App />` y aparecerá por encima de `<App />` como un Modal.

#### Propiedades

- **children**: React.ReactNode (requerido) - Contenido del Portal.Host.

### ProgressBar

El componente ProgressBar es un indicador utilizado para mostrar el progreso de alguna actividad en la aplicación.

#### Uso

```jsx
import * as React from "react";
import { ProgressBar, MD3Colors } from "react-native-paper";

const MyComponent = () => (
  <ProgressBar progress={0.5} color={MD3Colors.error50} />
);
```

#### Propiedades

- **animatedValue**: number - Valor animado (entre 0 y 1). Esto indica a la barra de progreso que debe basarse en este valor para animarse. Nota: No debe usarse en paralelo con la prop progress.
- **progress**: number - Valor de progreso (entre 0 y 1). Valor por defecto: 0. Nota: No debe usarse en paralelo con la prop animatedValue.
- **color**: string - Color de la barra de progreso. El color de fondo se calculará en base a este, pero puedes cambiarlo pasando backgroundColor a la prop style.
- **indeterminate**: boolean - Si la barra de progreso mostrará un progreso indeterminado.
- **visible**: boolean - Determina si se muestra la barra de progreso (true, por defecto) o se oculta (false). Valor por defecto: true.
- **fillStyle**: Animated.WithAnimatedValue<StyleProp<ViewStyle>> - Estilo de la parte llena de la barra de progreso.
- **style**: StyleProp<ViewStyle> - Estilo personalizado para la barra de progreso.
- **theme**: ThemeProp - Tema para aplicar al componente.
- **testID**: string - ID de prueba utilizado con fines de testing. Valor por defecto: 'progress-bar'.

### RadioButton

El componente RadioButton permite la selección de una única opción de un conjunto. Este componente sigue las pautas de la plataforma para Android e iOS, pero puede usarse en cualquier plataforma.

#### RadioButton.Android

Los radio buttons permiten la selección de una única opción de un conjunto. Este componente sigue las pautas de la plataforma para Android, pero puede usarse en cualquier plataforma.

##### Propiedades

- **value** (requerido): string - Valor del radio button
- **status**: 'checked' | 'unchecked' - Estado del radio button
- **disabled**: boolean - Si el radio button está deshabilitado
- **onPress**: (param?: any) => void - Función a ejecutar al presionar
- **uncheckedColor**: string - Color personalizado para el estado sin marcar
- **color**: string - Color personalizado para el radio button
- **theme**: ThemeProp - Tema del componente
- **testID**: string - ID para pruebas

#### RadioButton.Group

El grupo de radio buttons permite controlar un conjunto de radio buttons.

##### Uso

```jsx
import * as React from "react";
import { View } from "react-native";
import { RadioButton, Text } from "react-native-paper";

const MyComponent = () => {
  const [value, setValue] = React.useState("first");

  return (
    <RadioButton.Group
      onValueChange={(newValue) => setValue(newValue)}
      value={value}
    >
      <View>
        <Text>First</Text>
        <RadioButton value="first" />
      </View>
      <View>
        <Text>Second</Text>
        <RadioButton value="second" />
      </View>
    </RadioButton.Group>
  );
};
```

##### Propiedades

- **onValueChange** (requerido): (value: string) => void - Función a ejecutar al cambiar la selección
- **value** (requerido): string - Valor del radio button actualmente seleccionado
- **children** (requerido): React.ReactNode - Elementos React que contienen radio buttons

#### RadioButton.IOS

##### Propiedades

- **value** (requerido): string - Valor del radio button
- **status**: 'checked' | 'unchecked' - Estado del radio button
- **disabled**: boolean - Si el radio button está deshabilitado
- **onPress**: (e: GestureResponderEvent) => void - Función a ejecutar al presionar
- **color**: string - Color personalizado para el radio button
- **theme**: ThemeProp - Tema del componente
- **testID**: string - ID para pruebas

#### RadioButton.Item

RadioButton.Item permite presionar toda la fila (item) en lugar de solo el RadioButton.

##### Uso

```jsx
import * as React from "react";
import { RadioButton } from "react-native-paper";

const MyComponent = () => {
  const [value, setValue] = React.useState("first");

  return (
    <RadioButton.Group onValueChange={(value) => setValue(value)} value={value}>
      <RadioButton.Item label="First item" value="first" />
      <RadioButton.Item label="Second item" value="second" />
    </RadioButton.Group>
  );
};
```

##### Propiedades

- **value** (requerido): string - Valor del radio button
- **label** (requerido): string - Etiqueta a mostrar en el item
- **disabled**: boolean - Si el radio button está deshabilitado
- **background**: PressableAndroidRippleConfig - Tipo de fondo para mostrar el feedback (Android)
- **onPress**: (e: GestureResponderEvent) => void - Función a ejecutar al presionar
- **onLongPress**: (e: GestureResponderEvent) => void - Función a ejecutar al mantener presionado
- **accessibilityLabel**: string - Etiqueta de accesibilidad para el touchable
- **uncheckedColor**: string - Color personalizado para el estado sin marcar
- **color**: string - Color personalizado para el radio button
- **rippleColor**: ColorValue - Color del efecto ripple
- **status**: 'checked' | 'unchecked' - Estado del radio button
- **style**: StyleProp<ViewStyle> - Estilos adicionales para el contenedor View
- **labelStyle**: StyleProp<TextStyle> - Estilo para el elemento Label
- **labelVariant**: string - Variante del texto de la etiqueta (disponible en v5.x con theme version 3)
- **labelMaxFontSizeMultiplier**: number - Especifica la escala máxima que puede alcanzar la fuente de la etiqueta
- **theme**: ThemeProp - Tema del componente
- **testID**: string - ID para pruebas
- **mode**: 'android' | 'ios' - Si se debe usar <RadioButton.Android /> o <RadioButton.IOS />
- **position**: 'leading' | 'trailing' - Posición del control del radio button

### Searchbar

El componente Searchbar es una caja de entrada simple donde los usuarios pueden escribir consultas de búsqueda.

#### Uso

```jsx
import * as React from "react";
import { Searchbar } from "react-native-paper";

const MyComponent = () => {
  const [searchQuery, setSearchQuery] = React.useState("");

  return (
    <Searchbar
      placeholder="Search"
      onChangeText={setSearchQuery}
      value={searchQuery}
    />
  );
};
```

#### Propiedades

- **placeholder**: string - Texto de sugerencia que se muestra cuando la entrada está vacía.
- **value** (requerido): string - El valor del campo de texto.
- **onChangeText**: (query: string) => void - Función que se llama cuando cambia el texto.
- **mode**: 'bar' | 'view' - (Disponible en v5.x con theme version 3) Modo de diseño de búsqueda. Valor por defecto: 'bar'.
- **icon**: IconSource - Nombre del icono para el botón de icono izquierdo.
- **iconColor**: string - Color personalizado para el icono.
- **rippleColor**: ColorValue - Color del efecto de ondulación.
- **onIconPress**: (e: GestureResponderEvent) => void - Función a ejecutar si queremos que el icono izquierdo actúe como botón.
- **onClearIconPress**: (e: GestureResponderEvent) => void - Función a ejecutar si queremos añadir comportamiento personalizado al botón de icono de cierre.
- **searchAccessibilityLabel**: string - Etiqueta de accesibilidad para el botón. Valor por defecto: 'search'.
- **clearIcon**: IconSource - Icono personalizado para el botón de limpiar.
- **clearAccessibilityLabel**: string - Etiqueta de accesibilidad para el botón de limpiar. Valor por defecto: 'clear'.
- **traileringIcon**: IconSource - (Disponible en v5.x con theme version 3) Icono para el botón de icono derecho.
- **traileringIconColor**: string - Color personalizado para el icono derecho.
- **traileringRippleColor**: ColorValue - Color del efecto de ondulación del icono derecho.
- **onTraileringIconPress**: (e: GestureResponderEvent) => void - Función a ejecutar al presionar el icono derecho.
- **traileringIconAccessibilityLabel**: string - Etiqueta de accesibilidad para el botón de icono derecho.
- **right**: (props: { color: string; style: Style; testID: string; }) => React.ReactNode - Callback que devuelve un elemento React para mostrar en el lado derecho.
- **showDivider**: boolean - (Disponible en v5.x con theme version 3) Si se debe mostrar el Divider en la parte inferior. Valor por defecto: true.
- **elevation**: 0 | 1 | 2 | 3 | 4 | 5 | Animated.Value - Cambia la sombra y el fondo en iOS y Android. Valor por defecto: 0.
- **inputStyle**: StyleProp<TextStyle> - Estilo del componente TextInput dentro del searchbar.
- **style**: Animated.WithAnimatedValue<StyleProp<ViewStyle>> - Estilo personalizado para el componente.
- **loading**: boolean - Bandera personalizada para reemplazar el botón de limpiar con un indicador de actividad. Valor por defecto: false.
- **testID**: string - ID de prueba utilizado con fines de testing. Valor por defecto: 'search-bar'.
- **theme**: ThemeProp - Tema para aplicar al componente.

### SegmentedButtons

Los botones segmentados se pueden usar para seleccionar opciones, cambiar vistas o ordenar elementos. Soportan selección única y selección múltiple.

#### Uso

```jsx
import * as React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { SegmentedButtons } from "react-native-paper";

const MyComponent = () => {
  const [value, setValue] = React.useState("");

  return (
    <SafeAreaView style={styles.container}>
      <SegmentedButtons
        value={value}
        onValueChange={setValue}
        buttons={[
          {
            value: "walk",
            label: "Walking",
          },
          {
            value: "train",
            label: "Transit",
          },
          { value: "drive", label: "Driving" },
        ]}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
});
```

#### Propiedades

- **buttons** (requerido): Array - Botones a mostrar como opciones. Cada botón debe contener las siguientes propiedades:

  - **value**: string (requerido) - Valor del botón
  - **icon**: IconSource - Icono a mostrar para el elemento
  - **disabled**: boolean - Si el botón está deshabilitado
  - **accessibilityLabel**: string - Etiqueta de accesibilidad para el botón
  - **checkedColor**: string - Color personalizado para el texto e icono cuando está seleccionado
  - **uncheckedColor**: string - Color personalizado para el texto e icono cuando no está seleccionado
  - **onPress**: (event: GestureResponderEvent) => void - Función a ejecutar al presionar
  - **label**: string - Texto de la etiqueta del botón
  - **showSelectedCheck**: boolean - Mostrar icono opcional de verificación para indicar estado seleccionado
  - **style**: StyleProp<ViewStyle> - Estilos adicionales para el botón
  - **labelStyle**: StyleProp<TextStyle> - Estilos adicionales para la etiqueta
  - **testID**: string - ID para pruebas

- **density**: 'regular' | 'small' | 'medium' | 'high' - La densidad se aplica a la altura, para permitir su uso en interfaces más densas
- **style**: StyleProp<ViewStyle> - Estilo personalizado para el componente
- **theme**: ThemeProp - Tema para aplicar al componente

### Snackbar

Los Snackbars proporcionan retroalimentación breve sobre una operación a través de un mensaje renderizado en la parte inferior del contenedor en el que está envuelto.

Nota: Para mostrarlo como un popup, independientemente de la posición del padre, envuélvelo con un componente Portal.

#### Uso

```jsx
import * as React from "react";
import { View, StyleSheet } from "react-native";
import { Button, Snackbar } from "react-native-paper";

const MyComponent = () => {
  const [visible, setVisible] = React.useState(false);

  const onToggleSnackBar = () => setVisible(!visible);

  const onDismissSnackBar = () => setVisible(false);

  return (
    <View style={styles.container}>
      <Button onPress={onToggleSnackBar}>{visible ? "Hide" : "Show"}</Button>
      <Snackbar
        visible={visible}
        onDismiss={onDismissSnackBar}
        action={{
          label: "Undo",
          onPress: () => {
            // Do something
          },
        }}
      >
        Hey there! I'm a Snackbar.
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
});
```

#### Propiedades

- **visible** (requerido): boolean - Determina si el Snackbar está actualmente visible.

- **action**: $RemoveChildren<typeof Button> & { label: string; } - Etiqueta y callback de presión para el botón de acción. Debe contener las siguientes propiedades:

  - **label**: string - Etiqueta del botón de acción
  - **onPress**: function - Callback que se llama cuando se presiona el botón de acción

- **icon**: IconSource - (Disponible en v5.x con theme version 3) Icono a mostrar cuando onIconPress está definido. Por defecto será el icono de cierre.

- **rippleColor**: ColorValue - (Disponible en v5.x con theme version 3) Color del efecto de ondulación.

- **onIconPress**: () => void - (Disponible en v5.x con theme version 3) Función a ejecutar al presionar el botón de icono. El botón de icono aparece solo cuando se especifica esta prop.

- **iconAccessibilityLabel**: string - (Disponible en v5.x con theme version 3) Etiqueta de accesibilidad para el botón de icono. Esto es leído por el lector de pantalla cuando el usuario toca el botón. Valor por defecto: 'Close icon'.

- **duration**: number - La duración durante la cual se muestra el Snackbar. Valor por defecto: 7000.

- **onDismiss** (requerido): () => void - Callback llamado cuando se descarta el Snackbar. La prop visible debe actualizarse cuando se llama a esto.

- **children** (requerido): React.ReactNode - Contenido de texto del Snackbar.

- **elevation**: 0 | 1 | 2 | 3 | 4 | 5 | Animated.Value - (Disponible en v5.x con theme version 3) Cambia la sombra y el fondo del Snackbar en iOS y Android. Valor por defecto: 2.

- **maxFontSizeMultiplier**: number - Especifica la escala más grande posible que puede alcanzar la fuente del texto.

- **wrapperStyle**: StyleProp<ViewStyle> - Estilo para el contenedor del snackbar.

- **style**: Animated.WithAnimatedValue<StyleProp<ViewStyle>> - Estilo personalizado para el Snackbar.

- **ref**: React.RefObject<View> - Referencia para el componente.

- **theme**: ThemeProp - Tema para aplicar al componente.

- **testID**: string - ID de prueba utilizado con fines de testing.

### Surface

Surface es un contenedor básico que puede dar profundidad a un elemento con sombra de elevación. En el tema oscuro con modo adaptativo, la superficie se construye también colocando una superposición blanca semitransparente sobre la superficie del componente. Consulta el tema oscuro para obtener más información. La superposición y la sombra se pueden aplicar especificando la propiedad de elevación tanto en Android como en iOS.

Modos disponibles:

- elevated
- flat

#### Uso

```jsx
import * as React from "react";
import { Surface, Text } from "react-native-paper";
import { StyleSheet } from "react-native";

const MyComponent = () => (
  <Surface style={styles.surface} elevation={4}>
    <Text>Surface</Text>
  </Surface>
);

const styles = StyleSheet.create({
  surface: {
    padding: 8,
    height: 80,
    width: 80,
    alignItems: "center",
    justifyContent: "center",
  },
});
```

#### Propiedades

- **children** (requerido): React.ReactNode - Contenido del Surface.

- **style**: Animated.WithAnimatedValue<StyleProp<ViewStyle>> - Estilo personalizado para el componente.

- **elevation**: 0 | 1 | 2 | 3 | 4 | 5 | Animated.Value - (Disponible en v5.x con theme version 3) Cambia las sombras y el fondo en iOS y Android. Se utiliza para crear jerarquía UI entre componentes. Valor por defecto: 1.

  Nota: Si el modo está establecido en flat, Surface no tiene sombra.

  Nota: En la versión 2, la prop elevation se aceptaba a través de la prop style, es decir, style={{ elevation: 4 }}. Ya no es compatible con la versión 3 del tema y debe usar la propiedad elevation en su lugar.

- **mode**: 'flat' | 'elevated' - (Disponible en v5.x con theme version 3) Modo del Surface. Valor por defecto: 'elevated'.

  - **elevated** - Surface con una sombra y color de fondo correspondiente al valor de elevación establecido.
  - **flat** - Surface sin sombra, con el color de fondo correspondiente al valor de elevación establecido.

- **theme**: ThemeProp - Tema para aplicar al componente.

- **testID**: string - ID de prueba utilizado con fines de testing. Valor por defecto: 'surface'.

- **ref**: React.RefObject<View> - Referencia para el componente.

### Switch

Switch es un interruptor visual entre dos estados mutuamente exclusivos: encendido y apagado.

Disponible para:

- Android (habilitado)
- Android (deshabilitado)
- iOS (habilitado)
- iOS (deshabilitado)

#### Uso

```jsx
import * as React from "react";
import { Switch } from "react-native-paper";

const MyComponent = () => {
  const [isSwitchOn, setIsSwitchOn] = React.useState(false);

  const onToggleSwitch = () => setIsSwitchOn(!isSwitchOn);

  return <Switch value={isSwitchOn} onValueChange={onToggleSwitch} />;
};
```

#### Propiedades

- **disabled**: boolean - Deshabilita la posibilidad de alternar el switch.

- **value**: boolean - Valor del switch, true significa 'encendido', false significa 'apagado'.

- **color**: string - Color personalizado para el switch.

- **onValueChange**: Function - Callback que se llama con el nuevo valor cuando cambia.

- **style**: StyleProp<ViewStyle> - Estilo personalizado para el switch.

- **theme**: ThemeProp - Tema para aplicar al componente.

### Text

Componente de tipografía que muestra estilos que cumplen con la prop variant proporcionada y son compatibles con el sistema de tipos.

#### Uso

```jsx
import * as React from "react";
import { Text } from "react-native-paper";

const MyComponent = () => (
  <>
    <Text variant="displayLarge">Display Large</Text>
    <Text variant="displayMedium">Display Medium</Text>
    <Text variant="displaySmall">Display small</Text>

    <Text variant="headlineLarge">Headline Large</Text>
    <Text variant="headlineMedium">Headline Medium</Text>
    <Text variant="headlineSmall">Headline Small</Text>

    <Text variant="titleLarge">Title Large</Text>
    <Text variant="titleMedium">Title Medium</Text>
    <Text variant="titleSmall">Title Small</Text>

    <Text variant="bodyLarge">Body Large</Text>
    <Text variant="bodyMedium">Body Medium</Text>
    <Text variant="bodySmall">Body Small</Text>

    <Text variant="labelLarge">Label Large</Text>
    <Text variant="labelMedium">Label Medium</Text>
    <Text variant="labelSmall">Label Small</Text>
  </>
);
```

#### Propiedades

- **...Text props** - Extiende todas las propiedades del componente Text de React Native.

- **variant**: VariantProp<T> - (Disponible en v5.x con theme version 3) Define los estilos de texto apropiados para el rol de tipo y su tamaño. Variantes disponibles:

  - **Display**: displayLarge, displayMedium, displaySmall
  - **Headline**: headlineLarge, headlineMedium, headlineSmall
  - **Title**: titleLarge, titleMedium, titleSmall
  - **Label**: labelLarge, labelMedium, labelSmall
  - **Body**: bodyLarge, bodyMedium, bodySmall

- **children** (requerido): React.ReactNode - Contenido del texto.

- **theme**: ThemeProp - Tema para aplicar al componente.

- **style**: StyleProp<TextStyle> - Estilo personalizado para el texto.

### TextInput

Un componente que permite a los usuarios ingresar texto.

Modos disponibles:

- flat (enfocado)
- flat (deshabilitado)
- outlined (enfocado)
- outlined (deshabilitado)

#### Uso

```jsx
import * as React from "react";
import { TextInput } from "react-native-paper";

const MyComponent = () => {
  const [text, setText] = React.useState("");

  return (
    <TextInput
      label="Email"
      value={text}
      onChangeText={(text) => setText(text)}
    />
  );
};
```

#### Propiedades

- **...TextInput props** - Extiende todas las propiedades del componente TextInput de React Native.

- **mode**: 'flat' | 'outlined' - Modo del TextInput. Valor por defecto: 'flat'.

  - **flat** - entrada plana con un subrayado.
  - **outlined** - entrada con un contorno.

- **left**: React.ReactNode - Elemento React para mostrar en el lado izquierdo.

- **right**: React.ReactNode - Elemento React para mostrar en el lado derecho.

- **disabled**: boolean - Si es true, el usuario no podrá interactuar con el componente. Valor por defecto: false.

- **label**: TextInputLabelProp - El texto o componente a usar para la etiqueta flotante.

- **placeholder**: string - Texto de marcador de posición para la entrada.

- **error**: boolean - Si se debe aplicar el estilo de error al TextInput. Valor por defecto: false.

- **onChangeText**: Function - Callback que se llama cuando cambia el texto de la entrada.

- **selectionColor**: string - Color de selección de la entrada. En iOS, establece tanto el color de selección como el color del cursor. En Android, solo establece el color de selección.

- **cursorColor**: string - (Solo Android) Color del cursor de la entrada.

- **underlineColor**: string - Color del subrayado inactivo de la entrada.

- **activeUnderlineColor**: string - Color del subrayado activo de la entrada.

- **outlineColor**: string - Color del contorno inactivo de la entrada.

- **activeOutlineColor**: string - Color del contorno activo de la entrada.

- **textColor**: string - Color del texto en la entrada.

- **dense**: boolean - Establece la altura mínima con diseño denso. Valor por defecto: false.

- **multiline**: boolean - Si la entrada puede tener múltiples líneas. Valor por defecto: false.

- **numberOfLines**: number - (Solo Android) Número de líneas a mostrar en la entrada.

- **onFocus**: (args: any) => void - Callback que se llama cuando la entrada de texto recibe el foco.

- **onBlur**: (args: any) => void - Callback que se llama cuando la entrada de texto pierde el foco.

- **render**: (props: RenderProps) => React.ReactNode - Callback para renderizar un componente de entrada personalizado.

- **value**: string - Valor de la entrada de texto.

- **style**: StyleProp<TextStyle> - Estilo personalizado para el TextInput.

- **theme**: ThemeProp - Tema para aplicar al componente.

- **testID**: string - ID de prueba utilizado con fines de testing.

- **contentStyle**: StyleProp<TextStyle> - Estilo personalizado para el contenido de la entrada.

- **outlineStyle**: StyleProp<ViewStyle> - Estilo personalizado para el contorno.

- **underlineStyle**: StyleProp<ViewStyle> - Estilo personalizado para el subrayado.

- **editable**: boolean - Si la entrada es editable. Valor por defecto: true.

### TextInput.Affix

Un componente para renderizar texto inicial/final en el TextInput.

#### Uso

```jsx
import * as React from "react";
import { TextInput } from "react-native-paper";

const MyComponent = () => {
  const [text, setText] = React.useState("");

  return (
    <TextInput
      mode="outlined"
      label="Outlined input"
      placeholder="Type something"
      right={<TextInput.Affix text="/100" />}
    />
  );
};
```

#### Propiedades

- **text** (requerido): string - Texto a mostrar.

- **onLayout**: (event: LayoutChangeEvent) => void - Función que se ejecuta al cambiar el layout.

- **onPress**: (e: GestureResponderEvent) => void - Función a ejecutar al presionar.

- **accessibilityLabel**: string - Etiqueta de accesibilidad para el afijo. Valor por defecto: text.

- **textStyle**: StyleProp<TextStyle> - Estilo personalizado para el elemento Text.

- **theme**: ThemeProp - Tema para aplicar al componente.

### TextInput.Icon

Un componente para renderizar un icono inicial/final en el TextInput.

#### Uso

```jsx
import * as React from "react";
import { TextInput } from "react-native-paper";

const MyComponent = () => {
  const [text, setText] = React.useState("");

  return (
    <TextInput
      label="Password"
      secureTextEntry
      right={<TextInput.Icon icon="eye" />}
    />
  );
};
```

#### Propiedades

- **icon** (requerido): IconSource - Icono a mostrar. Renombrado de 'name' a 'icon' en v5.x.

- **onPress**: (e: GestureResponderEvent) => void - Función a ejecutar al presionar.

- **forceTextInputFocus**: boolean - Si el TextInput recibirá el foco después de onPress. Valor por defecto: true.

- **color**: ((isTextInputFocused: boolean) => string | undefined) | string - Color del icono o función que recibe un booleano indicando si el TextInput está enfocado y devuelve el color.

- **rippleColor**: ColorValue - Color del efecto de ondulación.

- **style**: StyleProp<ViewStyle> - Estilo personalizado para el icono.

- **theme**: ThemeProp - Tema para aplicar al componente.

### ToggleButton

Los botones de alternancia (Toggle buttons) se pueden usar para agrupar opciones relacionadas. Para enfatizar grupos de botones de alternancia relacionados, un grupo debe compartir un contenedor común.

#### Uso

```jsx
import * as React from "react";
import { ToggleButton } from "react-native-paper";

const ToggleButtonExample = () => {
  const [status, setStatus] = React.useState("checked");

  const onButtonToggle = (value) => {
    setStatus(status === "checked" ? "unchecked" : "checked");
  };

  return (
    <ToggleButton
      icon="bluetooth"
      value="bluetooth"
      status={status}
      onPress={onButtonToggle}
    />
  );
};
```

#### Propiedades

- **icon** (requerido): IconSource - Icono a mostrar en el ToggleButton.

- **size**: number - Tamaño del icono.

- **iconColor**: string - Color de texto personalizado para el botón.

- **rippleColor**: ColorValue - Color del efecto de ondulación.

- **disabled**: boolean - Determina si el botón está deshabilitado.

- **accessibilityLabel**: string - Etiqueta de accesibilidad para el ToggleButton. Esto es leído por el lector de pantalla cuando el usuario toca el botón.

- **onPress**: (value?: GestureResponderEvent | string) => void - Función a ejecutar al presionar.

- **value**: string - Valor del botón.

- **status**: 'checked' | 'unchecked' - Estado del botón.

- **style**: Animated.WithAnimatedValue<StyleProp<ViewStyle>> - Estilo personalizado para el botón.

- **theme**: ThemeProp - Tema para aplicar al componente.

- **ref**: React.RefObject<View> - Referencia para el componente.

- **testID**: string - ID de prueba utilizado con fines de testing.

### ToggleButton.Group

ToggleButton.Group permite controlar un grupo de botones de alternancia. No cambia la apariencia de los botones de alternancia. Si deseas agruparlos en una fila, consulta ToggleButton.Row.

#### Uso

```jsx
import * as React from "react";
import { ToggleButton } from "react-native-paper";

const MyComponent = () => {
  const [value, setValue] = React.useState("left");

  return (
    <ToggleButton.Group
      onValueChange={(value) => setValue(value)}
      value={value}
    >
      <ToggleButton icon="format-align-left" value="left" />
      <ToggleButton icon="format-align-right" value="right" />
    </ToggleButton.Group>
  );
};
```

#### Propiedades

- **onValueChange** (requerido): (value: Value) => void - Función a ejecutar cuando cambia la selección.

- **value** (requerido): Value | null - Valor del botón de alternancia actualmente seleccionado.

- **children** (requerido): React.ReactNode - Elementos React que contienen botones de alternancia.

### ToggleButton.Row

ToggleButton.Row renderiza un grupo de botones de alternancia en una fila.

#### Uso

```jsx
import * as React from "react";
import { ToggleButton } from "react-native-paper";

const MyComponent = () => {
  const [value, setValue] = React.useState("left");

  return (
    <ToggleButton.Row onValueChange={(value) => setValue(value)} value={value}>
      <ToggleButton icon="format-align-left" value="left" />
      <ToggleButton icon="format-align-right" value="right" />
    </ToggleButton.Row>
  );
};
```

#### Propiedades

- **onValueChange** (requerido): (value: string) => void - Función a ejecutar cuando cambia la selección.

- **value** (requerido): string - Valor del botón de alternancia actualmente seleccionado.

- **children** (requerido): React.ReactNode - Elementos React que contienen botones de alternancia.

- **style**: StyleProp<ViewStyle> - Estilo personalizado para la fila.

### Tooltip

Los Tooltips muestran texto informativo cuando los usuarios pasan el cursor por encima, se enfocan o tocan un elemento.

Los tooltips simples, cuando se activan, muestran una etiqueta de texto que identifica un elemento, como una descripción de su función. Los tooltips deben incluir solo texto descriptivo corto y evitar repetir el texto visible de la UI.

#### Uso

```jsx
import * as React from "react";
import { IconButton, Tooltip } from "react-native-paper";

const MyComponent = () => (
  <Tooltip title="Selected Camera">
    <IconButton icon="camera" selected size={24} onPress={() => {}} />
  </Tooltip>
);
```

#### Propiedades

- **children** (requerido): React.ReactElement - Elemento de referencia del Tooltip. Necesita poder mantener una referencia.

- **enterTouchDelay**: number - El número de milisegundos que un usuario debe tocar el elemento antes de mostrar el tooltip. Valor por defecto: 500.

- **leaveTouchDelay**: number - El número de milisegundos después de que el usuario deja de tocar un elemento antes de ocultar el tooltip. Valor por defecto: 1500.

- **title** (requerido): string - Título del tooltip.

- **titleMaxFontSizeMultiplier**: number - Especifica la escala más grande posible que puede alcanzar la fuente del título.

- **theme**: ThemeProp - Tema para aplicar al componente.

### TouchableRipple

Un contenedor para vistas que deben responder a toques. Proporciona un efecto de interacción de "ondulación de tinta" material para plataformas compatibles (>= Android Lollipop). En plataformas no compatibles, se recurre a un efecto de resaltado.

#### Uso

```jsx
import * as React from "react";
import { View } from "react-native";
import { Text, TouchableRipple } from "react-native-paper";

const MyComponent = () => (
  <TouchableRipple
    onPress={() => console.log("Pressed")}
    rippleColor="rgba(0, 0, 0, .32)"
  >
    <Text>Press anywhere</Text>
  </TouchableRipple>
);
```

#### Propiedades

- **...Pressable props** - Extiende todas las propiedades del componente Pressable.

- **borderless**: boolean - Determina si se debe renderizar el efecto de ondulación fuera de los límites de la vista. Valor por defecto: false.

- **background**: Object - Tipo de fondo drawable para mostrar el feedback (Android). https://reactnative.dev/docs/pressable#rippleconfig

- **centered**: boolean - Determina si el efecto de ondulación debe comenzar desde el centro (Web).

- **disabled**: boolean - Determina si se debe prevenir la interacción con el touchable.

- **onPress**: (e: GestureResponderEvent) => void - Función a ejecutar al presionar. Si no se establece, causará que el touchable se deshabilite.

- **onLongPress**: (e: GestureResponderEvent) => void - Función a ejecutar al mantener presionado.

- **onPressIn**: (e: GestureResponderEvent) => void - Función a ejecutar inmediatamente cuando se inicia un toque, antes de onPressOut y onPress.

- **onPressOut**: (e: GestureResponderEvent) => void - Función a ejecutar cuando se libera un toque.

- **rippleColor**: ColorValue - Color del efecto de ondulación (Android >= 5.0 y Web).

- **underlayColor**: string - Color del subrayado para el efecto de resaltado (Android < 5.0 e iOS).

- **children** (requerido): ((state: PressableStateCallbackType) => React.ReactNode) | React.ReactNode - Contenido del TouchableRipple.

- **style**: StyleProp<ViewStyle> | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>) | undefined - Estilo personalizado para el componente.

- **theme**: ThemeProp - Tema para aplicar al componente.

## Guía de Implementación

### Instalación

Para instalar React Native Paper en tu proyecto, ejecuta uno de los siguientes comandos dependiendo de tu gestor de paquetes:

```bash
npm install react-native-paper
```

o

```bash
yarn add react-native-paper
```

React Native Paper tiene dependencias que requieren instalación adicional:

```bash
npm install react-native-vector-icons
```

Para proyectos que utilizan Expo, puedes simplemente instalar:

```bash
expo install react-native-paper
```

### Configuración básica

Para utilizar React Native Paper en tu aplicación, debes envolver tu componente raíz con el proveedor `PaperProvider`:

```jsx
import * as React from "react";
import { Provider as PaperProvider } from "react-native-paper";
import App from "./src/App";

export default function Main() {
  return (
    <PaperProvider>
      <App />
    </PaperProvider>
  );
}
```

### Configuración de iconos

React Native Paper utiliza `react-native-vector-icons` para mostrar iconos. Necesitas configurar los iconos según la plataforma:

#### Para proyectos React Native CLI:

**Android**: Edita `android/app/build.gradle`:

```gradle
apply from: "../../node_modules/react-native-vector-icons/fonts.gradle"
```

**iOS**: Edita `ios/Podfile` y ejecuta `pod install`:

```ruby
pod 'RNVectorIcons', :path => '../node_modules/react-native-vector-icons'
```

#### Para proyectos Expo:

No se requiere configuración adicional, ya que Expo incluye los iconos por defecto.

### Tema

React Native Paper proporciona un sistema de temas completo que te permite personalizar la apariencia de tu aplicación.

#### Tema básico

```jsx
import * as React from "react";
import { Provider as PaperProvider, DefaultTheme } from "react-native-paper";

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#3498db",
    accent: "#f1c40f",
  },
};

export default function Main() {
  return (
    <PaperProvider theme={theme}>
      <App />
    </PaperProvider>
  );
}
```

#### Tema oscuro

```jsx
import * as React from "react";
import { Provider as PaperProvider, DarkTheme } from "react-native-paper";

export default function Main() {
  return (
    <PaperProvider theme={DarkTheme}>
      <App />
    </PaperProvider>
  );
}
```

#### Cambio dinámico de tema

```jsx
import * as React from "react";
import {
  Provider as PaperProvider,
  DefaultTheme,
  DarkTheme,
} from "react-native-paper";
import { useColorScheme } from "react-native";

export default function Main() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;

  return (
    <PaperProvider theme={theme}>
      <App />
    </PaperProvider>
  );
}
```

### Ejemplos de Uso Común

#### Formulario de inicio de sesión

```jsx
import * as React from "react";
import { View, StyleSheet } from "react-native";
import { TextInput, Button, HelperText } from "react-native-paper";

const LoginForm = () => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [secureTextEntry, setSecureTextEntry] = React.useState(true);

  const hasErrors = () => {
    return !email.includes("@");
  };

  return (
    <View style={styles.container}>
      <TextInput
        label="Email"
        value={email}
        onChangeText={(text) => setEmail(text)}
        style={styles.input}
        mode="outlined"
      />
      <HelperText type="error" visible={hasErrors()}>
        Email address is invalid!
      </HelperText>

      <TextInput
        label="Password"
        value={password}
        onChangeText={(text) => setPassword(text)}
        secureTextEntry={secureTextEntry}
        right={
          <TextInput.Icon
            icon={secureTextEntry ? "eye" : "eye-off"}
            onPress={() => setSecureTextEntry(!secureTextEntry)}
          />
        }
        style={styles.input}
        mode="outlined"
      />

      <Button
        mode="contained"
        onPress={() => console.log("Login")}
        style={styles.button}
      >
        Login
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  input: {
    marginBottom: 8,
  },
  button: {
    marginTop: 16,
  },
});
```

#### Lista de elementos con acciones

```jsx
import * as React from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { List, Divider, FAB } from "react-native-paper";

const data = [
  { id: "1", title: "Item 1", description: "Description for Item 1" },
  { id: "2", title: "Item 2", description: "Description for Item 2" },
  { id: "3", title: "Item 3", description: "Description for Item 3" },
];

const ItemList = () => {
  const renderItem = ({ item }) => (
    <List.Item
      title={item.title}
      description={item.description}
      left={(props) => <List.Icon {...props} icon="folder" />}
      right={(props) => <List.Icon {...props} icon="dots-vertical" />}
      onPress={() => console.log("Pressed", item.id)}
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <Divider />}
      />
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => console.log("Add new item")}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
```
