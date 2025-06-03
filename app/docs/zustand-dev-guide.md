# Guía Detallada de Desarrollo con Zustand

Zustand es una solución de gestión de estado pequeña, rápida y escalable para React y aplicaciones JavaScript. Ofrece una API cómoda basada en hooks, sin ser excesivamente opinativa ni requerir mucho boilerplate.

## 1. Introducción y Ventajas

*   **Simple y Mínimo:** API fácil de aprender y usar.
*   **Rápido y Escalable:** Optimizado para el rendimiento.
*   **Basado en Hooks:** Integración natural con React.
*   **Soluciona Problemas Comunes:** Aborda problemas como el "zombie child", concurrencia de React y pérdida de contexto.
*   **Flexible:** Permite almacenar cualquier tipo de dato (primitivos, objetos, funciones).

## 2. Instalación

Instala Zustand usando tu gestor de paquetes preferido:

```bash
# NPM
npm install zustand
# Yarn
yarn add zustand
# pnpm
pnpm add zustand
```

## 3. Creación del Store

El corazón de Zustand es el "store", que se crea usando la función `create`.

### 3.1. Sintaxis Básica (JavaScript)

```javascript
import { create } from 'zustand'

const useBearStore = create((set) => ({
  bears: 0, // Estado inicial
  // Acción para incrementar
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  // Acción para resetear
  removeAllBears: () => set({ bears: 0 }),
  // Acción para actualizar a un valor específico
  updateBears: (newBears) => set({ bears: newBears }),
}))
```

*   `create` recibe una función (`stateCreatorFn`) que define el estado inicial y las acciones.
*   Esta función recibe `set` como argumento principal, que se usa para actualizar el estado.
*   Por defecto, `set` realiza un *merge superficial* del estado. Si pasas `{ bears: 5 }`, solo la propiedad `bears` se actualizará, manteniendo el resto del estado intacto.

### 3.2. Sintaxis con TypeScript

Para usar TypeScript, necesitas especificar el tipo del estado usando `create<T>()(...)`:

```typescript
import { create } from 'zustand'

interface BearState {
  bears: number
  increase: (by: number) => void
  removeAllBears: () => void // Añadido para consistencia
  updateBears: (newBears: number) => void // Añadido para consistencia
}

const useBearStore = create<BearState>()((set) => ({
  bears: 0,
  increase: (by) => set((state) => ({ bears: state.bears + by })),
  removeAllBears: () => set({ bears: 0 }),
  updateBears: (newBears) => set({ bears: newBears }),
}))
```

*   Define una interfaz (`BearState` en este caso) para tu estado y acciones.
*   Usa `create<BearState>()(...)` para anotar el tipo.

### 3.3. La Función `set`

*   **Merge Superficial (por defecto):** `set({ a: 1 })` actualiza solo `a`, manteniendo otras propiedades.
*   **Función de Actualización:** `set((state) => ({ count: state.count + 1 }))` es la forma recomendada para actualizar basándose en el estado previo. Garantiza que trabajas con el estado más reciente, especialmente útil para actualizaciones rápidas o asíncronas.
*   **Reemplazo Completo:** `set({ a: 1 }, true)` reemplaza *todo* el estado con `{ a: 1 }`. Úsalo con precaución.

### 3.4. La Función `get`

Dentro del `stateCreatorFn`, también recibes `get` para acceder al estado actual sin necesidad de suscripción. Útil dentro de las acciones.

```typescript
const useBearStore = create<BearState>()((set, get) => ({
  // ... estado ...
  bears: 0, // Asegúrate de que el estado esté definido
  logBears: () => {
    const currentBears = get().bears;
    console.log(`Current bears: ${currentBears}`);
  },
  increase: (by) => set((state) => ({ bears: state.bears + by })),
  removeAllBears: () => set({ bears: 0 }),
  updateBears: (newBears) => set({ bears: newBears }),
  // ... otras acciones ...
}))
```

## 4. Uso del Store en Componentes React

El store creado es un hook de React.

### 4.1. Acceso Completo al Estado

```jsx
import useBearStore from './stores/bearStore'; // Asumiendo que el store está en este archivo

function BearCounter() {
  // Accede a todo el estado. Re-renderiza si CUALQUIER parte del estado cambia.
  const state = useBearStore();
  return <h1>{state.bears} bears around here...</h1>
}

function Controls() {
  const increasePopulation = useBearStore((state) => state.increase); // Corregido: usa la acción definida
  const removeAllBears = useBearStore((state) => state.removeAllBears);

  return (
    <>
      <button onClick={() => increasePopulation(1)}>one up</button> {/* Llama con el argumento 'by' */}
      <button onClick={removeAllBears}>remove all</button>
    </>
  );
}
```

### 4.2. Selectores para Optimización

Para evitar re-renders innecesarios, usa selectores. El componente solo se volverá a renderizar si el valor seleccionado cambia.

```jsx
function BearCounter() {
  // Selecciona solo 'bears'. Re-renderiza SOLO si 'bears' cambia.
  const bears = useBearStore((state) => state.bears);
  return <h1>{bears} bears around here...</h1>
}

function Controls() {
  // Selecciona solo la acción. Las acciones no cambian, por lo que esto no causa re-renders.
  const increasePopulation = useBearStore((state) => state.increase); // Corregido: usa la acción definida
  return <button onClick={() => increasePopulation(1)}>one up</button>; {/* Llama con el argumento 'by' */}
}
```

*   **Regla General:** Selecciona solo lo que el componente necesita.
*   **Selección de Múltiples Valores:** Si necesitas varios valores, puedes devolver un objeto. Sin embargo, esto puede causar re-renders si el objeto se crea nuevo en cada render. Usa `shallow` para comparar superficialmente el objeto devuelto:

```jsx
import { shallow } from 'zustand/shallow' // O 'zustand/shallow/index.js'

// Asumiendo que BearState tiene una propiedad 'name'
// interface BearState {
//   bears: number;
//   name: string; // Ejemplo
//   increase: (by: number) => void;
//   removeAllBears: () => void;
//   updateBears: (newBears: number) => void;
// }

function BearInfo() {
  const { bears, name } = useBearStore(
    (state) => ({ bears: state.bears, name: state.name }),
    shallow // Compara superficialmente {bears, name}
  );
  // ... usa bears y name ...
  return <div>{name} has {bears} bears.</div>
}
```

## 5. Actualización Detallada del Estado

### 5.1. Inmutabilidad

Zustand (y React en general) se basa en la inmutabilidad. **Nunca modifiques el estado directamente.** Siempre crea nuevos objetos o arrays al actualizar.

### 5.2. Actualización Basada en Estado Anterior

Usa siempre la forma funcional de `set` cuando la nueva actualización dependa del valor anterior:

```typescript
// Correcto
increase: (by) => set((state) => ({ bears: state.bears + by })),

// Incorrecto (puede llevar a race conditions si se llama rápido)
// increase: (by) => set({ bears: get().bears + by }),
```

### 5.3. Actualización de Objetos

Crea un nuevo objeto, copiando las propiedades existentes que no cambian.

```typescript
interface PositionState {
  position: { x: number; y: number };
  setPosition: (newPos: { x: number; y: number }) => void;
  moveX: (delta: number) => void;
}

const usePositionStore = create<PositionState>()((set) => ({
  position: { x: 0, y: 0 },
  setPosition: (newPos) => set({ position: newPos }), // Crea un nuevo objeto 'position'
  moveX: (delta) => set((state) => ({
    position: { ...state.position, x: state.position.x + delta } // Copia 'y', actualiza 'x'
  })),
}));
```

### 5.4. Actualización de Arrays

Crea un nuevo array usando métodos inmutables (`map`, `filter`, `slice`, `concat`, spread `...`). Evita métodos mutables (`push`, `splice`, `sort` in-place).

```typescript
interface TodosState {
  todos: { id: number; text: string; completed: boolean }[];
  addTodo: (text: string) => void;
  toggleTodo: (id: number) => void;
}

const useTodosStore = create<TodosState>()((set) => ({
  todos: [],
  addTodo: (text) => set((state) => ({
    todos: [...state.todos, { id: Date.now(), text, completed: false }] // Nuevo array con spread
  })),
  toggleTodo: (id) => set((state) => ({
    todos: state.todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo // Nuevo array con map
    )
  })),
}));
```

## 6. Middlewares

Los middlewares extienden la funcionalidad de Zustand envolviendo el `stateCreatorFn`.

### 6.1. `devtools`

Integra tu store con las Redux DevTools Extension para depuración.

```typescript
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface BearState { // Reutilizando la interfaz anterior
  bears: number
  increase: (by: number) => void
  removeAllBears: () => void
  updateBears: (newBears: number) => void
}

const useBearStore = create<BearState>()(
  devtools( // Envuelve el state creator
    (set) => ({
      bears: 0,
      increase: (by) => set((state) => ({ bears: state.bears + by }), false, 'increaseBears'), // Opcional: nombre de acción
      removeAllBears: () => set({ bears: 0 }, false, 'removeAllBears'),
      updateBears: (newBears) => set({ bears: newBears }, false, 'updateBears'),
    }),
    { name: 'BearStore' } // Opcional: nombre para las DevTools
  )
)
```
*   **Importante:** Coloca `devtools` lo más afuera posible (último middleware en aplicar) para que capture correctamente las acciones de otros middlewares.

### 6.2. `persist`

Persiste el estado del store en `localStorage` (o `AsyncStorage` en React Native, u otro storage).

```typescript
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface BearState { // Reutilizando la interfaz anterior
  bears: number
  increase: (by: number) => void
  removeAllBears: () => void
  updateBears: (newBears: number) => void
}

const useBearStore = create<BearState>()(
  persist(
    (set, get) => ({ // 'get' también está disponible aquí
      bears: 0,
      increase: (by) => set({ bears: get().bears + by }),
      removeAllBears: () => set({ bears: 0 }),
      updateBears: (newBears) => set({ bears: newBears }),
    }),
    {
      name: 'food-storage', // Clave en localStorage
      storage: createJSONStorage(() => sessionStorage), // Opcional: usa sessionStorage
      // partialize: (state) => ({ bears: state.bears }), // Opcional: persistir solo 'bears'
    }
  )
)
```

### 6.3. `immer`

Permite escribir código de actualización "mutable" que Immer convierte en inmutable bajo el capó.

```typescript
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer' // Nota la ruta

interface State {
  nested: { count: number };
  incrementNested: () => void;
}

const useStore = create<State>()(
  immer((set) => ({
    nested: { count: 0 },
    incrementNested: () => set((state) => {
      state.nested.count++; // ¡Modificación directa permitida por Immer!
    }),
  }))
)
```

### 6.4. Combinando Middlewares

Simplemente anídalos:

```typescript
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

interface BearState { // Reutilizando la interfaz anterior
  bears: number
  increase: (by: number) => void
  removeAllBears: () => void
  updateBears: (newBears: number) => void
}

const useBearStore = create<BearState>()(
  devtools( // Más externo
    persist( // Intermedio
      immer( // Más interno
        (set) => ({
          bears: 0,
          // Acciones pueden ser mutables aquí gracias a immer
          increase: (by) => set((state) => { state.bears += by; }),
          removeAllBears: () => set((state) => { state.bears = 0; }),
          updateBears: (newBears) => set((state) => { state.bears = newBears; }),
        })
      ),
      {
        name: 'bear-storage',
        storage: createJSONStorage(() => localStorage), // Ejemplo con localStorage
      }
    ),
    { name: 'BearStore-DevTools' }
  )
)
```

## 7. Patrones Avanzados

### 7.1. Slices Pattern

Organiza stores complejos dividiéndolos en "slices" (partes) que se combinan al final. Cada slice define una porción del estado y sus acciones relacionadas.

```typescript
import { create, StateCreator } from 'zustand'

// Slice 1: Bears
interface BearSlice {
  bears: number;
  addBear: () => void;
}
// El tipo StateCreator<...> necesita el estado completo (BearSlice & FishSlice)
// y opcionalmente los mutators de middleware si se usan.
// El último argumento genérico es el tipo del slice actual.
const createBearSlice: StateCreator<BearSlice & FishSlice, [], [], BearSlice> = (set) => ({
  bears: 0,
  addBear: () => set((state) => ({ bears: state.bears + 1 })),
});

// Slice 2: Fishes
interface FishSlice {
  fishes: number;
  addFish: () => void;
}
const createFishSlice: StateCreator<BearSlice & FishSlice, [], [], FishSlice> = (set) => ({
  fishes: 0,
  addFish: () => set((state) => ({ fishes: state.fishes + 1 })),
});

// Store combinado
const useBoundStore = create<BearSlice & FishSlice>()((...a) => ({
  ...createBearSlice(...a),
  ...createFishSlice(...a),
}));

// Uso
function FishCounter() {
  const fishes = useBoundStore((state) => state.fishes);
  const addFish = useBoundStore((state) => state.addFish);
  return <button onClick={addFish}>Add Fish ({fishes})</button>;
}
function BearCounter() {
  const bears = useBoundStore((state) => state.bears);
  const addBear = useBoundStore((state) => state.addBear);
  return <button onClick={addBear}>Add Bear ({bears})</button>;
}
```
*   El `StateCreator` necesita tipos adicionales para funcionar correctamente con slices y middlewares. Consulta la documentación de TypeScript de Zustand para detalles (`Mutators`).

### 7.2. Stores Vanilla (sin React)

Puedes crear stores que funcionen fuera de React usando `createStore` de `zustand/vanilla`.

```typescript
import { createStore } from 'zustand/vanilla'

interface CountState {
  count: number;
  increment: () => void;
}

const vanillaStore = createStore<CountState>()((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

const { getState, setState, subscribe } = vanillaStore;

setState({ count: 1 });
const currentState = getState(); // { count: 1, increment: [Function] }

const unsubscribe = subscribe((newState) => {
  console.log('State changed:', newState);
});

// Para usarlo en React:
import { useStore } from 'zustand'

function VanillaCounter() {
  const count = useStore(vanillaStore, (state) => state.count);
  const increment = useStore(vanillaStore, (state) => state.increment);
  return <button onClick={increment}>Vanilla Count: {count}</button>;
}
```

### 7.3. Stores con Scope (Context API)

Para tener instancias independientes de un store (por ejemplo, un store por cada item de una lista), combina Zustand con React Context.

```jsx
import React, { createContext, useContext, useRef } from 'react'; // No se necesita useState aquí
import { createStore, useStore, StoreApi } from 'zustand'; // Importa StoreApi

// 1. Define el tipo de store y la función creadora
interface CounterState {
  count: number;
  increment: () => void;
}
// Define el tipo explícito para el store vanilla
type CounterStore = StoreApi<CounterState>;

const createCounterStore = () => createStore<CounterState>()((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// 2. Crea el Context (tipado correctamente)
const CounterContext = createContext<CounterStore | null>(null);

// 3. Crea el Provider
function CounterProvider({ children }) {
  const storeRef = useRef<CounterStore>(); // Usa el tipo CounterStore
  if (!storeRef.current) {
    storeRef.current = createCounterStore();
  }
  return (
    <CounterContext.Provider value={storeRef.current}>
      {children}
    </CounterContext.Provider>
  );
}

// 4. Crea un hook custom para usar el store del contexto
function useCounterContext<T>(selector: (state: CounterState) => T): T {
  const store = useContext(CounterContext);
  if (!store) {
    throw new Error('Missing CounterProvider');
  }
  // useStore funciona directamente con la StoreApi
  return useStore(store, selector);
}

// 5. Uso
function ScopedCounter() {
  const count = useCounterContext((state) => state.count);
  const increment = useCounterContext((state) => state.increment);
  return <button onClick={increment}>Scoped Count: {count}</button>;
}

// App.jsx
function App() {
  return (
    <div>
      <CounterProvider>
        <ScopedCounter /> {/* Instancia 1 */}
      </CounterProvider>
      <CounterProvider>
        <ScopedCounter /> {/* Instancia 2 */}
      </CounterProvider>
    </div>
  );
}
```

## 8. TypeScript Avanzado

*   **`combine`:** Middleware útil para inferir el tipo del estado inicial, evitando la necesidad de `create<T>()(...)` en casos simples.

    ```typescript
    import { create } from 'zustand'
    import { combine } from 'zustand/middleware'

    const useCombinedStore = create(
      combine({ bears: 0 }, (set) => ({ // Infiere {bears: number} como estado inicial
        // Las acciones se definen en el segundo argumento
        increase: (by: number) => set((state) => ({ bears: state.bears + by })),
      }))
    )
    // El tipo final del store es { bears: number, increase: (by: number) => void }
    ```
*   **`ExtractState`:** Helper para obtener el tipo del estado de un store inferido (útil con `combine`).
    ```typescript
    import { ExtractState } from 'zustand'
    type CombinedState = ExtractState<typeof useCombinedStore>;
    // CombinedState es { bears: number, increase: (by: number) => void }
    ```
*   **Tipado de Middlewares:** Requiere entender los `StoreMutatorIdentifier` y `Mutate`. Consulta la documentación oficial para ejemplos detallados si creas tus propios middlewares complejos.

## 9. Buenas Prácticas

*   **Inmutabilidad:** Esencial. Nunca mutes el estado directamente, excepto dentro de `immer`.
*   **Selectores:** Úsalos siempre para optimizar rendimiento. Selecciona solo los datos necesarios. Usa `shallow` para selectores que devuelven objetos/arrays no primitivos.
*   **Acciones Colocadas:** Generalmente es más simple y cohesivo mantener las acciones dentro del `create`.
*   **Stores Pequeños:** Prefiere varios stores pequeños y enfocados en lugar de un único store monolítico gigante (aunque Zustand lo maneja bien). Usa el patrón de slices si un store crece mucho.
*   **Nombres Claros:** Usa nombres descriptivos para stores, estados y acciones.

Esta guía cubre los aspectos fundamentales y algunos patrones avanzados para trabajar eficazmente con Zustand. ¡Experimenta y consulta la documentación oficial para profundizar más!
