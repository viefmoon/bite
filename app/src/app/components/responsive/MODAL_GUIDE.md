# Guía ResponsiveModal v3.0

## 🚀 Inicio Rápido

ResponsiveModal es el componente estándar para todos los modales en la aplicación. Maneja automáticamente responsividad, dimensiones en porcentajes, scroll, header y footer.

### Uso Básico

```tsx
import { ResponsiveModal } from '@/app/components/responsive/ResponsiveModal';

// Modal simple con dimensiones automáticas
<ResponsiveModal
  visible={visible}
  onDismiss={onDismiss}
  title="Mi Modal"                    // Header automático
  maxWidthPercent={85}                // 85% del ancho de pantalla (opcional)
  maxHeightPercent={85}               // 85% de la altura de pantalla (opcional)
  actions={[                          // Botones del footer
    { label: 'Cancelar', mode: 'outlined', onPress: onDismiss },
    { label: 'Guardar', mode: 'contained', onPress: handleSave, colorPreset: 'primary' }
  ]}
>
  {/* Tu contenido aquí */}
</ResponsiveModal>
```

## 📐 Sistema de Dimensiones Responsivas

El modal usa **porcentajes automáticos** según el dispositivo:

| Dispositivo | Ancho por Defecto | Personalizable |
|-------------|-------------------|----------------|
| Móvil pequeño | 94% | `maxWidthPercent={90}` |
| Tablet | 80% | `maxWidthPercent={85}` |
| Otros dispositivos | 85% | `maxWidthPercent={75}` |
| **Altura** | **85%** | `maxHeightPercent={90}` |

## 🎨 Color Presets para Botones

```tsx
actions={[
  { label: 'Cancelar', colorPreset: 'secondary' },    // Gris
  { label: 'Guardar', colorPreset: 'primary' },       // Azul
  { label: 'Eliminar', colorPreset: 'error' },        // Rojo
  { label: 'Confirmar', colorPreset: 'success' },     // Verde
  { label: 'Advertencia', colorPreset: 'warning' }    // Amarillo
]}
```

## 💡 Ejemplos Comunes

### Modal de Confirmación (Pequeño)

```tsx
import { ConfirmationModal } from '@/app/components/common/ConfirmationModal';

<ConfirmationModal
  visible={visible}
  onDismiss={onDismiss}
  onConfirm={handleDelete}
  title="¿Eliminar producto?"
  message="Esta acción no se puede deshacer"
  confirmText="Eliminar"
  confirmColorPreset="error"
/>

// O usando ResponsiveModal directamente:
<ResponsiveModal
  visible={visible}
  onDismiss={onDismiss}
  title="¿Eliminar producto?"
  maxWidthPercent={60}
  maxHeightPercent={40}
  actions={[
    { label: 'Cancelar', mode: 'outlined', onPress: onDismiss },
    { label: 'Eliminar', mode: 'contained', onPress: handleDelete, colorPreset: 'error' }
  ]}
>
  <Text>Esta acción no se puede deshacer</Text>
</ResponsiveModal>
```

### Modal de Formulario (Usa valores por defecto)

```tsx
<ResponsiveModal
  visible={visible}
  onDismiss={onDismiss}
  title={editing ? "Editar Producto" : "Nuevo Producto"}
  dismissable={!isSaving}
  actions={[
    { label: 'Cancelar', mode: 'outlined', onPress: onDismiss, disabled: isSaving },
    { label: 'Guardar', mode: 'contained', onPress: handleSubmit, loading: isSaving, colorPreset: 'primary' }
  ]}
>
  <TextInput label="Nombre" />
  <TextInput label="Precio" />
  {/* Más campos... */}
</ResponsiveModal>
```

### Modal de Detalles (Grande)

```tsx
<ResponsiveModal
  visible={visible}
  onDismiss={onDismiss}
  title={`Orden #${order.number}`}
  maxWidthPercent={90}
  maxHeightPercent={90}
  actions={[
    { label: 'Imprimir', icon: 'printer', mode: 'outlined', onPress: handlePrint },
    { label: 'Cerrar', mode: 'contained', onPress: onDismiss, colorPreset: 'primary' }
  ]}
>
  <OrderDetails order={order} />
</ResponsiveModal>
```

### Modal Solo de Lectura (Sin acciones)

```tsx
<ResponsiveModal
  visible={visible}
  onDismiss={onDismiss}
  title="Historial de Orden"
  maxWidthPercent={90}
  maxHeightPercent={90}
>
  <OrderHistory />
</ResponsiveModal>
```

## ⚠️ Reglas Importantes

### ✅ SÍ Hacer:
- Usa porcentajes para dimensiones personalizadas
- Usa `colorPreset` para colores estándares  
- Define botones en `actions`
- Usa `ConfirmationModal` para confirmaciones
- Deja que el modal maneje el scroll automáticamente

### ❌ NO Hacer:
- NO uses `ScrollView` dentro (el modal ya lo maneja)
- NO pongas botones en el contenido
- NO uses `Portal` o `Modal` de react-native-paper
- NO añadas padding al contenido principal
- NO uses pixels fijos para dimensiones

## 🔄 Migración desde Presets

```tsx
// ❌ ANTES (con presets)
<ResponsiveModal
  visible={visible}
  onDismiss={onDismiss}
  title="Formulario"
  preset="form"  // ❌ Ya no existe
  actions={actions}
>
  {content}
</ResponsiveModal>

// ✅ DESPUÉS (con porcentajes)
<ResponsiveModal
  visible={visible}
  onDismiss={onDismiss}
  title="Formulario"
  maxWidthPercent={85}    // ✅ Explícito y claro
  maxHeightPercent={85}   // ✅ Explícito y claro
  actions={actions}
>
  {content}
</ResponsiveModal>

// ✅ O mejor aún, usa valores por defecto
<ResponsiveModal
  visible={visible}
  onDismiss={onDismiss}
  title="Formulario"
  // Sin props de dimensión = usa valores responsivos automáticos
  actions={actions}
>
  {content}
</ResponsiveModal>
```

## 🔄 Migración desde Modal Antiguo

```tsx
// ❌ ANTES (Modal antiguo)
<Portal>
  <Modal visible={visible} onDismiss={onDismiss}>
    <View style={styles.header}>
      <Text>Título</Text>
      <IconButton icon="close" onPress={onDismiss} />
    </View>
    <ScrollView>
      {/* contenido */}
    </ScrollView>
    <View style={styles.footer}>
      <Button onPress={onDismiss}>Cancelar</Button>
      <Button onPress={handleSave}>Guardar</Button>
    </View>
  </Modal>
</Portal>

// ✅ DESPUÉS (ResponsiveModal)
<ResponsiveModal
  visible={visible}
  onDismiss={onDismiss}
  title="Título"
  actions={[
    { label: 'Cancelar', mode: 'outlined', onPress: onDismiss },
    { label: 'Guardar', mode: 'contained', onPress: handleSave, colorPreset: 'primary' }
  ]}
>
  {/* contenido */}
</ResponsiveModal>
```

## 📌 Props Principales

| Prop | Tipo | Descripción |
|------|------|-------------|
| `visible` | boolean | Muestra/oculta el modal |
| `onDismiss` | () => void | Función al cerrar |
| `title` | string | Título (muestra header automáticamente) |
| `maxWidthPercent` | number | % del ancho de pantalla (opcional, usa auto) |
| `maxHeightPercent` | number | % de la altura de pantalla (opcional, usa auto) |
| `actions` | ActionButton[] | Botones del footer |
| `footer` | ReactNode | Footer personalizado (opcional) |
| `isLoading` | boolean | Muestra overlay de carga |
| `dismissable` | boolean | Permite cerrar tocando fuera |

## 🎯 Tips Actualizados

1. **Deja que el modal sea automático** - Los valores por defecto funcionan bien
2. **Usa porcentajes solo cuando necesites control específico** - 60/40 para confirmaciones, 90/90 para detalles
3. **El título activa el header** - No necesitas configuración extra
4. **Usa colorPreset** - Mantiene consistencia de colores
5. **ConfirmationModal para diálogos** - Ya está optimizado

## 📱 Valores Recomendados

| Tipo de Modal | Ancho | Alto | Ejemplo |
|---------------|-------|------|---------|
| Confirmación | 60% | 40% | "¿Eliminar este item?" |
| Formulario | Auto (85%) | Auto (85%) | Crear/editar entidades |
| Detalles | 90% | 90% | Ver información completa |
| Listado | Auto (85%) | Auto (85%) | Seleccionar items |

---

Componente ubicado en: `app/src/app/components/responsive/ResponsiveModal.tsx`