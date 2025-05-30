# Guía de Ignite

## ¿Qué es Ignite?

Ignite es la forma preferida de Infinite Red para construir aplicaciones React Native. Es un CLI y un proyecto boilerplate que incluye:

- React Native
- React Navigation
- MobX-State-Tree
- TypeScript
- MMKV
- apisauce
- Reactotron
- Soporte para Expo
- Componentes prediseñados
- Y más

## Estructura del Proyecto

```
your-project/
├── app/
│   ├── components/     # Componentes reutilizables
│   ├── config/        # Configuración de la app
│   ├── i18n/          # Internacionalización
│   ├── models/        # Modelos MobX-State-Tree
│   ├── navigators/    # Navegadores React Navigation
│   ├── screens/       # Pantallas principales
│   ├── services/      # Servicios (API, etc)
│   ├── theme/         # Temas y estilos
│   ├── utils/         # Utilidades y hooks
│   └── app.tsx        # Punto de entrada
├── assets/           # Iconos, imágenes, fuentes
└── ignite/          # Templates de generadores
```

## Componentes Principales

### AutoImage

Versión mejorada del componente Image que se redimensiona automáticamente.

```tsx
<AutoImage
  source={{ uri: "..." }}
  maxWidth={200}
  maxHeight={200}
  headers={{ Authorization: "Bearer..." }}
/>
```

### Button

Botón personalizable basado en Pressable.

```tsx
<Button
  text="Click Me" // Texto del botón
  tx="button.click" // Clave de traducción
  preset="default" // Preset de estilo (default, filled, reversed)
  onPress={() => {}} // Manejador de click
  style={{}} // Estilos del contenedor
  textStyle={{}} // Estilos del texto
  pressedStyle={{}} // Estilos cuando está presionado
  LeftAccessory={Icon} // Componente izquierdo
  RightAccessory={Icon} // Componente derecho
/>
```

### Card

Contenedor para mostrar contenido relacionado verticalmente.

```tsx
<Card
  preset="reversed" // Preset de estilo
  verticalAlignment="space-between" // Alineación vertical
  heading="Título" // Título
  content="Contenido" // Contenido
  footer="Pie" // Pie
  LeftComponent={<Icon />} // Componente izquierdo
  RightComponent={<Button />} // Componente derecho
  headingStyle={{}} // Estilos del título
  contentStyle={{}} // Estilos del contenido
  footerStyle={{}} // Estilos del pie
/>
```

### EmptyState

Componente para mostrar estado vacío.

```tsx
<EmptyState
  preset="generic" // Preset de estilo
  imageSource={require("...")} // Imagen
  heading="No hay datos" // Título
  content="Mensaje" // Contenido
  button="Acción" // Texto del botón
  buttonOnPress={() => {}} // Manejador del botón
/>
```

### Header

Barra superior de navegación.

```tsx
<Header
  title="Título" // Título
  leftIcon="back" // Icono izquierdo
  rightIcon="menu" // Icono derecho
  onLeftPress={() => {}} // Manejador izquierdo
  onRightPress={() => {}} // Manejador derecho
  style={{}} // Estilos
  backgroundColor="purple" // Color de fondo
/>
```

### Icon

Sistema de iconos personalizable.

```tsx
<Icon
  icon="back" // Nombre del icono
  color="#000" // Color
  size={24} // Tamaño
  onPress={() => {}} // Manejador de click
/>
```

### Screen

Contenedor principal para pantallas.

```tsx
<Screen
  preset="scroll" // Preset (scroll, fixed, auto)
  safeAreaEdges={["top"]} // Bordes seguros
  KeyboardAvoidingViewProps={{}} // Props para KeyboardAvoidingView
  StatusBarProps={{}} // Props para StatusBar
>
  {children}
</Screen>
```

### Text

Componente de texto mejorado con soporte i18n.

```tsx
<Text
  text="Texto" // Texto directo
  tx="clave.traduccion" // Clave de traducción
  txOptions={{}} // Opciones de traducción
  preset="default" // Preset de estilo
  size="md" // Tamaño de fuente
  weight="normal" // Peso de fuente
/>
```

### TextField

Campo de entrada de texto personalizado.

```tsx
<TextField
  value={value} // Valor
  onChangeText={setText} // Manejador de cambio
  label="Etiqueta" // Etiqueta
  placeholder="Placeholder" // Placeholder
  helper="Texto de ayuda" // Texto de ayuda
  status="error" // Estado (error, disabled)
  RightAccessory={Icon} // Componente derecho
  LeftAccessory={Icon} // Componente izquierdo
/>
```

## Temas

El sistema de temas permite personalizar colores, tipografía y espaciado:

```tsx
// Uso de temas
const { themed, theme } = useAppTheme()

const $styles = {
  container: themed((theme) => ({
    backgroundColor: theme.colors.background,
    padding: theme.spacing.medium,
  })),
}
```

## Navegación

Basada en React Navigation v6:

```tsx
// Configuración básica
const Stack = createNativeStackNavigator()

function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
    </Stack.Navigator>
  )
}
```

## Internacionalización

Soporte integrado para múltiples idiomas:

```tsx
// Uso de traducciones
<Text tx="common.submit" />
<Button tx="buttons.save" txOptions={{ count: 2 }} />
```

## Estado Global (MobX-State-Tree)

```tsx
// Definición de modelo
const UserModel = types.model("User", {
  id: types.identifier,
  name: types.string,
})

// Uso en componentes
const UserProfile = observer(() => {
  const { userStore } = useStores()
  return <Text>{userStore.currentUser.name}</Text>
})
```

## Generadores

Comandos disponibles:

```bash
npx ignite-cli generate component MiComponente
npx ignite-cli generate screen MiPantalla
npx ignite-cli generate model MiModelo
npx ignite-cli generate navigator MiNavegador
```

## API y Servicios

```tsx
// Llamadas API
const response = await api.getUsers()
if (response.kind === "ok") {
  // Manejar respuesta exitosa
} else {
  // Manejar error
}
```

## Testing

Soporte para:

- Jest para pruebas unitarias
- React Native Testing Library para pruebas de componentes
- Maestro para pruebas E2E

```tsx
// Ejemplo de prueba
test("mi componente", () => {
  const { getByText } = render(<MiComponente />)
  expect(getByText("Texto")).toBeTruthy()
})
```

## Recursos Adicionales

- [Documentación oficial](https://github.com/infinitered/ignite)
- [Ignite Cookbook](https://ignitecookbook.com)
- [Comunidad Slack](http://community.infinite.red)
