# Plan de Implementación: Sistema de Órdenes por Voz

## 🎯 Objetivo
Implementar un widget flotante tipo "Siri" que permita a los usuarios dictar órdenes de productos usando lenguaje natural, procesando el audio mediante la API de Gemini para convertirlo en items de orden estructurados.

## 📋 Análisis de Requerimientos

### Funcionalidades Principales
1. **Widget Flotante de Voz**
   - Botón flotante en la parte inferior central de la pantalla de órdenes
   - Animaciones suaves de activación/grabación
   - Feedback visual del estado de grabación
   - Indicador de procesamiento

2. **Captura de Audio**
   - Grabación de audio mediante expo-av
   - Límite de tiempo por grabación (sugerido: 30-60 segundos)
   - Cancelación de grabación

3. **Procesamiento de Audio**
   - Envío del audio al servidor de sincronización
   - Procesamiento con API de Gemini
   - Conversión a array de OrderItems
   - Manejo de errores y reintentos

4. **Integración con el Carrito**
   - Validación de productos encontrados
   - Confirmación antes de agregar al carrito
   - Manejo de productos no encontrados o ambiguos

## 🏗️ Arquitectura Propuesta

### Frontend (React Native)
```typescript
// Componentes principales
- VoiceOrderButton.tsx       // Botón flotante principal
- VoiceRecordingModal.tsx    // Modal de grabación
- VoiceResultsModal.tsx      // Modal de resultados/confirmación
- useVoiceOrder.hook.ts      // Lógica de grabación y procesamiento

// Estados
- recording: boolean
- processing: boolean
- results: ParsedOrderItem[]
- error: string | null
```

### Backend (Sincronización)
```typescript
// Endpoints necesarios
POST /api/voice/process-order
  - Input: audio file (base64 o multipart)
  - Output: { items: OrderItem[], confidence: number, errors: string[] }

// Procesamiento
1. Recibir audio
2. Transcribir con Gemini (speech-to-text)
3. Analizar texto con Gemini (NLP)
4. Mapear a productos existentes
5. Retornar items estructurados
```

## ⚡ Optimización de Rendimiento

### Tiempos Estimados
- **Grabación**: Variable (3-30 segundos)
- **Upload de audio**: 1-3 segundos (depende del tamaño)
- **Transcripción Gemini**: 1-2 segundos
- **Análisis NLP**: 1-2 segundos
- **Mapeo de productos**: <1 segundo
- **Total estimado**: 4-8 segundos post-grabación

### Estrategias de Optimización
1. **Compresión de Audio**
   - Usar formato AAC o MP3
   - Bitrate optimizado (64-128 kbps)
   - Mono en lugar de estéreo

2. **Procesamiento Paralelo**
   - Iniciar upload mientras se finaliza la grabación
   - Pre-cargar datos de productos en el servidor
   - Cache de resultados frecuentes

3. **UI Optimista**
   - Mostrar indicadores de progreso detallados
   - Animaciones durante el procesamiento
   - Permitir cancelación en cualquier momento

## 🚨 Posibles Puntos de Falla y Mitigaciones

### 1. **Reconocimiento Incorrecto**
- **Problema**: Gemini malinterpreta el audio
- **Mitigación**: 
  - Mostrar transcripción para validación
  - Permitir edición manual
  - Botón de "intentar de nuevo"

### 2. **Productos No Encontrados**
- **Problema**: Usuario menciona productos que no existen
- **Mitigación**:
  - Sugerir productos similares
  - Marcar items no encontrados
  - Permitir búsqueda manual

### 3. **Ambigüedad en Cantidades**
- **Problema**: "Dos pizzas" sin especificar tipo
- **Mitigación**:
  - Solicitar aclaraciones
  - Valores por defecto configurables
  - Historial de pedidos frecuentes

### 4. **Conectividad**
- **Problema**: Pérdida de conexión durante el proceso
- **Mitigación**:
  - Guardar audio localmente
  - Reintentos automáticos
  - Modo offline con procesamiento diferido

### 5. **Timeout del Servidor**
- **Problema**: Procesamiento toma demasiado tiempo
- **Mitigación**:
  - Timeout configurable (10-15 segundos)
  - Procesamiento asíncrono con polling
  - Notificaciones push cuando esté listo

## 💡 Mejoras Futuras

1. **Aprendizaje Contextual**
   - Recordar preferencias del usuario
   - Sugerir complementos basados en el pedido
   - Autocorrección basada en historial

2. **Multi-idioma**
   - Soporte para múltiples idiomas
   - Detección automática de idioma
   - Diccionario de productos por idioma

3. **Comandos Especiales**
   - "Repite mi último pedido"
   - "Quita las pizzas"
   - "Cambia la hawaiana por pepperoni"

## 🔧 Implementación por Fases

### Fase 1: MVP (1-2 semanas)
- [ ] Widget flotante básico
- [ ] Grabación de audio simple
- [ ] Endpoint de procesamiento
- [ ] Integración básica con Gemini
- [ ] Agregar items al carrito

### Fase 2: Mejoras UX (1 semana)
- [ ] Animaciones y feedback visual
- [ ] Modal de confirmación
- [ ] Manejo de errores mejorado
- [ ] Edición de resultados

### Fase 3: Optimización (1 semana)
- [ ] Compresión de audio
- [ ] Cache y rendimiento
- [ ] Modo offline básico
- [ ] Métricas y analytics

## 📊 Métricas de Éxito

1. **Precisión**: >85% de órdenes correctas
2. **Velocidad**: <5 segundos promedio de procesamiento
3. **Adopción**: >30% de usuarios lo prueban
4. **Retención**: >50% lo usan regularmente
5. **Satisfacción**: >4.0/5.0 en ratings

## 🛠️ Stack Tecnológico

### Frontend
- expo-av para grabación
- react-native-reanimated para animaciones
- zustand para estado local
- react-query para sincronización

### Backend
- Multer para upload de archivos
- Google Gemini API
- Redis para cache
- WebSockets para actualizaciones en tiempo real (opcional)

## 📝 Ejemplo de Flujo de Usuario

1. Usuario toca el botón de voz
2. Modal se abre con animación
3. Usuario dice: "Quiero dos pizzas hawaianas grandes y una coca de 2 litros"
4. Se muestra indicador de procesamiento
5. Resultados aparecen:
   - ✅ 2x Pizza Hawaiana (Grande)
   - ✅ 1x Coca Cola 2L
6. Usuario confirma o edita
7. Items se agregan al carrito
8. Notificación de éxito

## 🔐 Consideraciones de Seguridad

1. **Privacidad del Audio**
   - No almacenar audio permanentemente
   - Encriptación en tránsito
   - Opción de opt-out

2. **Validación de Datos**
   - Sanitizar inputs del servidor
   - Límites de cantidad razonables
   - Validación de precios

3. **Rate Limiting**
   - Máximo X grabaciones por minuto
   - Límite de duración de audio
   - Protección contra spam

## 🎨 Diseño UI/UX

### Widget Flotante
```
Estados:
1. Idle: Icono de micrófono
2. Recording: Pulsación + onda de sonido
3. Processing: Spinner con progreso
4. Success: Check animado
5. Error: X con retry
```

### Principios de Diseño
- Minimalista y no intrusivo
- Feedback inmediato
- Fácil de cancelar
- Accesible (a11y)
- Coherente con Material Design 3