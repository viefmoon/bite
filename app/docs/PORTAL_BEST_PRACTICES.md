# Mejores Prácticas para el Uso de Portales en React Native Paper

## Problema Identificado
Los Portales que se renderizan siempre (incluso cuando no son visibles) pueden crear capas invisibles que bloquean los clicks en otros elementos de la UI, especialmente en elementos del header como botones de navegación.

## Solución Recomendada

### ❌ Evitar - Portal siempre renderizado
```tsx
return (
  <Portal>
    <Modal visible={visible}>
      {/* contenido */}
    </Modal>
  </Portal>
);
```

### ✅ Correcto - Portal condicional
```tsx
return (
  <>
    {visible && (
      <Portal>
        <Modal visible={visible}>
          {/* contenido */}
        </Modal>
      </Portal>
    )}
  </>
);
```

## Componentes Corregidos
1. **PaymentModal.tsx** - Portal ahora condicional
2. **ChangeCalculatorModal.tsx** - Portal ahora condicional
3. **ConfirmationModal.tsx** - Portal ahora condicional
4. **ResponsiveModal.tsx** - Portal ahora condicional
5. **AudioOrderModal.tsx** - Portal ahora condicional
6. **AddProductsToOrderScreen.tsx** - Portales ahora condicionales

## Mejoras Adicionales para Elementos Clickeables

### Para botones en headers o áreas críticas:
1. Añadir `zIndex` apropiado
2. Aumentar el área táctil con padding
3. Usar `pointerEvents: 'none'` en elementos decorativos (como badges)
4. Añadir feedback visual (rippleColor)

### Ejemplo de botón mejorado:
```tsx
<View style={{ padding: 5, zIndex: 999 }}>
  <IconButton
    icon="cart"
    onPress={handlePress}
    rippleColor={theme.colors.primary + '20'}
  />
  <Badge style={{ pointerEvents: 'none', zIndex: 1000 }}>
    {count}
  </Badge>
</View>
```

## Checklist para Nuevos Modales
- [ ] Portal renderizado condicionalmente con `{visible && <Portal>}`
- [ ] Modal tiene prop `visible` correcta
- [ ] No hay elementos con z-index conflictivos
- [ ] Elementos decorativos tienen `pointerEvents: 'none'`
- [ ] Áreas táctiles tienen tamaño adecuado (mínimo 44x44 pts)