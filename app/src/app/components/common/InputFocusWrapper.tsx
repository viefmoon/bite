import React, { useRef } from 'react';
import { TouchableOpacity, View, Platform } from 'react-native';

interface InputFocusWrapperProps {
  children: React.ReactElement;
  onFocus?: () => void;
}

/**
 * Wrapper para solucionar problemas de focus en inputs dentro de modales
 * Especialmente útil cuando se requiere doble click para enfocar
 */
const InputFocusWrapper: React.FC<InputFocusWrapperProps> = ({ children, onFocus }) => {
  const childRef = useRef<any>(null);

  const handlePress = () => {
    // En Android, a veces necesitamos un pequeño delay
    if (Platform.OS === 'android') {
      setTimeout(() => {
        childRef.current?.focus?.();
        onFocus?.();
      }, 50);
    } else {
      childRef.current?.focus?.();
      onFocus?.();
    }
  };

  // Clonar el hijo y añadir la ref
  const childWithRef = React.cloneElement(children, {
    ref: childRef,
  });

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handlePress}
      style={{ width: '100%' }}
    >
      <View pointerEvents="box-only">
        {childWithRef}
      </View>
    </TouchableOpacity>
  );
};

export default InputFocusWrapper;