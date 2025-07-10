# Uso del DateTimePickerSafe

## Problema Original

El error "Loss of precision during arithmetic conversion" ocurre cuando React Native con Hermes intenta hacer conversiones aritméticas con objetos Date, especialmente al usar librerías como `@react-native-community/datetimepicker` o `react-native-modal-datetime-picker`.

## Solución

Hemos creado dos utilidades para manejar fechas/horas de forma segura:

1. **DateTimePickerSafe**: Un componente selector de fecha/hora que evita conversiones problemáticas
2. **dateTimeHelpers**: Funciones helper para conversiones seguras

## Ejemplo de Uso

### 1. Reemplazar TimePickerModal actual

```tsx
// Antes (problemático)
import DateTimePicker from '@react-native-community/datetimepicker';

// Después (seguro)
import DateTimePickerSafe from '@/app/components/DateTimePickerSafe';

// En tu componente:
const [showPicker, setShowPicker] = useState(false);
const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);

return (
  <>
    <Button onPress={() => setShowPicker(true)}>
      Seleccionar Fecha/Hora
    </Button>
    
    <DateTimePickerSafe
      visible={showPicker}
      onDismiss={() => setShowPicker(false)}
      onConfirm={(date) => {
        setSelectedDateTime(date);
        setShowPicker(false);
      }}
      mode="datetime" // o "date" o "time"
      initialDate={selectedDateTime || undefined}
      title="Seleccionar hora de entrega"
    />
  </>
);
```

### 2. Usar los helpers seguros

```tsx
import {
  safeTimeStringToDate,
  safeDateToTimeString,
  getNextAvailableTime,
  parseDateFromBackend
} from '@/app/utils/dateTimeHelpers';

// Convertir string de hora a Date
const date = safeTimeStringToDate("14:30"); // Hoy a las 14:30

// Convertir Date a string de hora
const timeStr = safeDateToTimeString(new Date()); // "14:30"

// Obtener próxima hora disponible (redondeada a 5 min)
const nextTime = getNextAvailableTime(30); // 30 min en el futuro

// Parsear fecha del backend de forma segura
const backendDate = parseDateFromBackend(orderData.scheduledAt);
if (backendDate) {
  const timeString = safeDateToTimeString(backendDate);
}
```

### 3. Integración en OrderCartDetail

```tsx
// Para hora programada de pedidos
const handleScheduleTime = () => {
  setShowDateTimePicker(true);
};

const handleConfirmScheduledTime = (date: Date) => {
  const timeString = safeDateToTimeString(date);
  setScheduledTime(timeString);
  setShowDateTimePicker(false);
};

// En el render:
<DateTimePickerSafe
  visible={showDateTimePicker}
  onDismiss={() => setShowDateTimePicker(false)}
  onConfirm={handleConfirmScheduledTime}
  mode="time"
  title="Hora de entrega"
  initialDate={scheduledTime ? safeTimeStringToDate(scheduledTime) : undefined}
/>
```

## Ventajas

1. **Sin pérdida de precisión**: Evita conversiones aritméticas problemáticas
2. **Compatible con Hermes**: Usa operaciones seguras y date-fns
3. **UX mejorada**: Interfaz nativa de selección sin dependencias problemáticas
4. **Validación incluida**: Maneja errores y casos edge automáticamente
5. **Localización**: Soporta español por defecto con date-fns/locale

## Migración

Para migrar del componente actual:

1. Reemplaza `TimePickerModal` por `DateTimePickerSafe` con `mode="time"`
2. Reemplaza `convertTimeStringToDate` por `safeTimeStringToDate`
3. Reemplaza `format(new Date(date), 'HH:mm')` por `safeDateToTimeString(parseDateFromBackend(date))`
4. Usa `getDateTimeForBackend(date)` al enviar fechas al backend