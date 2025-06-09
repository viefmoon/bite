import React, { useRef, useCallback } from 'react';
import { TouchableOpacity, View, Platform, findNodeHandle, AccessibilityInfo } from 'react-native';

interface InputFocusWrapperProps {
  children: React.ReactElement;
  onFocus?: () => void;
  disabled?: boolean;
}

/**
 * Wrapper para solucionar problemas de focus en inputs dentro de modales
 * Especialmente útil cuando se requiere doble click para enfocar
 */
const InputFocusWrapper: React.FC<InputFocusWrapperProps> = ({ children, onFocus, disabled = false }) => {
  const childRef = useRef<any>(null);
  const isFocused = useRef(false);

  const handlePress = useCallback(() => {
    if (disabled) return;
    
    const focusInput = () => {
      if (childRef.current) {
        // Primero intentar el método focus directo
        if (childRef.current.focus) {
          childRef.current.focus();
        }
        // Si es un componente wrapped, buscar el TextInput interno
        else if (childRef.current._inputRef?.current?.focus) {
          childRef.current._inputRef.current.focus();
        }
        // Para AnimatedLabelInput que podría tener una estructura diferente
        else if (childRef.current.getNode?.()?.focus) {
          childRef.current.getNode().focus();
        }
        
        // Notificar a accessibility que este elemento está enfocado
        const nodeHandle = findNodeHandle(childRef.current);
        if (nodeHandle) {
          AccessibilityInfo.setAccessibilityFocus(nodeHandle);
        }
        
        isFocused.current = true;
        onFocus?.();
      }
    };

    // Usar diferentes estrategias según la plataforma
    if (Platform.OS === 'android') {
      // En Android, usar requestAnimationFrame para mejor timing
      requestAnimationFrame(() => {
        focusInput();
      });
    } else {
      // En iOS, un pequeño delay suele funcionar mejor
      setTimeout(focusInput, 10);
    }
  }, [disabled, onFocus]);

  // Clonar el hijo y añadir la ref y handlers mejorados
  const childWithRef = React.cloneElement(children, {
    ref: childRef,
    onPress: (e: any) => {
      // Llamar al handler original si existe
      if (children.props.onPress) {
        children.props.onPress(e);
      }
      handlePress();
    },
    onStartShouldSetResponder: () => true,
    onResponderGrant: handlePress,
  });

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handlePress}
      style={{ width: '100%' }}
      disabled={disabled}
    >
      <View pointerEvents={disabled ? 'none' : 'box-only'}>
        {childWithRef}
      </View>
    </TouchableOpacity>
  );
};

export default InputFocusWrapper;