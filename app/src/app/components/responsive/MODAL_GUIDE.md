# Guía ResponsiveModal v2.0

## 🚀 Inicio Rápido

ResponsiveModal es el componente estándar para todos los modales en la aplicación. Maneja automáticamente responsividad, scroll, header y footer.

### Uso Básico

```tsx
import { ResponsiveModal } from '@/app/components/responsive/ResponsiveModal';

// Modal simple
<ResponsiveModal
  visible={visible}
  onDismiss={onDismiss}
  title="Mi Modal"  // Header automático
  preset="form"     // Tamaño y comportamiento
  actions={[        // Botones del footer
    { label: 'Cancelar', mode: 'text', onPress: onDismiss },
    { label: 'Guardar', mode: 'contained', onPress: handleSave, colorPreset: 'primary' }
  ]}
>
  {/* Tu contenido aquí */}
</ResponsiveModal>
```

## 📋 Presets Disponibles

| Preset | Uso | Tamaño |
|--------|-----|--------|
| `dialog` | Confirmaciones, alertas | Pequeño (400px) |
| `form` | Formularios, edición | Mediano (520px) |
| `detail` | Información detallada | Grande (600px) |
| `fullscreen` | Editores complejos | Pantalla completa |

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

### Modal de Confirmación

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
```

### Modal de Formulario

```tsx
<ResponsiveModal
  visible={visible}
  onDismiss={onDismiss}
  preset="form"
  title={editing ? "Editar Producto" : "Nuevo Producto"}
  dismissable={!isSaving}
  actions={[
    { label: 'Cancelar', mode: 'text', onPress: onDismiss, disabled: isSaving },
    { label: 'Guardar', mode: 'contained', onPress: handleSubmit, loading: isSaving, colorPreset: 'primary' }
  ]}
>
  <TextInput label="Nombre" />
  <TextInput label="Precio" />
  {/* Más campos... */}
</ResponsiveModal>
```

### Modal de Detalles

```tsx
<ResponsiveModal
  visible={visible}
  onDismiss={onDismiss}
  preset="detail"
  title={`Orden #${order.number}`}
  actions={[
    { label: 'Imprimir', icon: 'printer', mode: 'outlined', onPress: handlePrint },
    { label: 'Cerrar', mode: 'contained', onPress: onDismiss, colorPreset: 'primary' }
  ]}
>
  <OrderDetails order={order} />
</ResponsiveModal>
```

## ⚠️ Reglas Importantes

### ✅ SÍ Hacer:
- Usa `preset` para configuración automática
- Usa `colorPreset` para colores estándares  
- Define botones en `actions`
- Usa `ConfirmationModal` para confirmaciones

### ❌ NO Hacer:
- NO uses `ScrollView` dentro (el modal ya lo maneja)
- NO pongas botones en el contenido
- NO uses `Portal` o `Modal` de react-native-paper
- NO añadas padding al contenido principal

## 🔄 Migración Rápida

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
  preset="form"
  actions={[
    { label: 'Cancelar', mode: 'text', onPress: onDismiss },
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
| `preset` | 'dialog' \| 'form' \| 'detail' \| 'fullscreen' | Configuración predefinida |
| `actions` | ActionButton[] | Botones del footer |
| `footer` | ReactNode | Footer personalizado (opcional) |
| `isLoading` | boolean | Muestra overlay de carga |
| `dismissable` | boolean | Permite cerrar tocando fuera |

## 🎯 Tips

1. **Siempre usa un preset** - Configura automáticamente todo
2. **El título activa el header** - No necesitas `showHeader`
3. **Usa colorPreset** - Mantiene consistencia de colores
4. **ConfirmationModal para diálogos** - Ya está optimizado

---

Componente ubicado en: `app/src/app/components/responsive/ResponsiveModal.tsx`