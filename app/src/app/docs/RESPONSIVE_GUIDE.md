# Guía del Sistema Responsive

## Introducción

Este documento describe cómo utilizar el sistema responsive implementado en la aplicación para garantizar una experiencia óptima en diferentes tamaños de pantalla y dispositivos.

## Conceptos Clave

### Breakpoints
```typescript
xs: 0     // Extra pequeño (móviles pequeños)
sm: 360   // Pequeño (móviles estándar)
md: 600   // Mediano (móviles grandes y tablets pequeñas)
lg: 900   // Grande (tablets)
xl: 1200  // Extra grande (tablets grandes)
xxl: 1536 // Doble extra grande (tablets pro)
```

### Hook useResponsive

El hook principal que proporciona toda la información responsive:

```typescript
const responsive = useResponsive();

// Propiedades disponibles:
responsive.window          // Dimensiones de la ventana
responsive.isTablet        // true si es tablet
responsive.spacing         // Espaciado responsive
responsive.fontSize        // Tamaños de fuente responsive
responsive.dimensions      // Dimensiones comunes responsive
responsive.getResponsiveDimension(mobile, tablet) // Dimensión adaptativa
responsive.getGridColumns(minWidth, gap, padding) // Columnas dinámicas
responsive.scaleFont(size) // Escalar fuente según DPI
responsive.scaleSize(size) // Escalar tamaño según DPI
```

## Componentes Responsive

### ResponsiveView
Componente base para layouts responsive:

```tsx
<ResponsiveView
  breakpoints={{
    xs: { padding: 16 },
    md: { padding: 24 },
    lg: { padding: 32 }
  }}
  mobileProps={{ flexDirection: 'column' }}
  tabletProps={{ flexDirection: 'row' }}
>
  {/* Contenido */}
</ResponsiveView>
```

### ResponsiveGrid
Grid con columnas dinámicas:

```tsx
<ResponsiveGrid
  columns={3}
  columnsTablet={4}
  gap={responsive.spacing.m}
  minItemWidth={150}
>
  {/* Items del grid */}
</ResponsiveGrid>
```

### ResponsiveImage
Imágenes con escalado automático:

```tsx
<ResponsiveImage
  source={require('./image.png')}
  baseWidth={200}
  baseHeight={150}
  maxScale={1.5}
/>
```

### ResponsiveModal
Modales con tamaño adaptativo:

```tsx
<ResponsiveModal
  visible={visible}
  onDismiss={onDismiss}
  size="medium" // small, medium, large, fullscreen
>
  {/* Contenido del modal */}
</ResponsiveModal>
```

## Mejores Prácticas

### 1. Siempre usa valores responsive

❌ **Evitar:**
```tsx
style={{ padding: 16, fontSize: 14 }}
```

✅ **Preferir:**
```tsx
style={{ 
  padding: responsive.spacing.m,
  fontSize: responsive.fontSize.m 
}}
```

### 2. Diseña mobile-first

Comienza con el diseño móvil y añade mejoras para tablets:

```tsx
const styles = StyleSheet.create({
  container: {
    // Base móvil
    flexDirection: 'column',
    padding: responsive.spacing.m,
    
    // Mejoras para tablet
    ...(responsive.isTablet && {
      flexDirection: 'row',
      padding: responsive.spacing.xl,
    }),
  },
});
```

### 3. Usa grids dinámicos

Para listas de items, usa ResponsiveGrid o calcula columnas dinámicamente:

```tsx
const numColumns = useMemo(() => {
  return responsive.getGridColumns(150, responsive.spacing.m, responsive.spacing.m);
}, [responsive]);

<FlatList
  numColumns={numColumns}
  key={numColumns} // Importante para re-render
  // ...
/>
```

### 4. Considera la orientación

Para pantallas específicas como cocina:

```tsx
useEffect(() => {
  // Forzar orientación horizontal
  ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
  
  return () => {
    ScreenOrientation.unlockAsync();
  };
}, []);
```

### 5. Optimiza imágenes

Usa dimensiones responsive para imágenes:

```tsx
<AutoImage
  source={imageUrl}
  maxWidth={responsive.getResponsiveDimension(300, 500)}
  maxHeight={responsive.getResponsiveDimension(200, 350)}
/>
```

### 6. Tipografía responsive

Usa la escala de fuentes predefinida:

```tsx
responsive.fontSize.xs  // 10
responsive.fontSize.s   // 12
responsive.fontSize.m   // 14
responsive.fontSize.l   // 16
responsive.fontSize.xl  // 20
responsive.fontSize.xxl // 24
responsive.fontSize.xxxl // 32
```

### 7. Espaciado consistente

Usa la escala de espaciado:

```tsx
responsive.spacing.xs  // 4
responsive.spacing.s   // 8
responsive.spacing.m   // 16
responsive.spacing.l   // 24
responsive.spacing.xl  // 32
responsive.spacing.xxl // 48
```

## Patrones Comunes

### Layout Lado a Lado en Tablets

```tsx
if (responsive.isTablet && responsive.window.width > responsive.window.height) {
  return (
    <View style={{ flexDirection: 'row' }}>
      <View style={{ flex: 1 }}>{/* Panel izquierdo */}</View>
      <View style={{ flex: 1 }}>{/* Panel derecho */}</View>
    </View>
  );
}
```

### Modal Adaptativo

```tsx
const modalWidth = responsive.isTablet 
  ? Math.min(600, responsive.window.width * 0.8)
  : responsive.window.width * 0.9;
```

### Grid con Mínimo de Items

```tsx
const columns = Math.max(2, responsive.getGridColumns(100));
```

## Pruebas Recomendadas

1. **Dispositivos móviles:** 
   - iPhone SE (375x667)
   - iPhone 14 (390x844)
   - Pixel 5 (393x851)

2. **Tablets:**
   - iPad Mini (768x1024)
   - iPad Pro 11" (834x1194)
   - iPad Pro 12.9" (1024x1366)

3. **Orientaciones:**
   - Portrait y Landscape
   - Cambios dinámicos de orientación

4. **Densidades de píxeles:**
   - @1x, @2x, @3x
   - Verificar escalado de fuentes e iconos