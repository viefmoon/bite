import React, { useState, useEffect } from 'react';
import AnimatedLabelInput from '../../../app/components/common/AnimatedLabelInput';

interface NumericFieldProps {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  onBlur: () => void;
  error?: boolean;
  disabled?: boolean;
  defaultValue: number;
}

const NumericField: React.FC<NumericFieldProps> = ({
  label,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  defaultValue,
}) => {
  const [displayValue, setDisplayValue] = useState(() => 
    value !== undefined ? String(value) : ''
  );
  const [isFocused, setIsFocused] = useState(false);

  // Sincronizar valor externo con display solo cuando no está enfocado
  useEffect(() => {
    if (!isFocused && value !== undefined) {
      setDisplayValue(String(value));
    }
  }, [value, isFocused]);

  const handleChangeText = (text: string) => {
    // Permitir solo números
    const numericText = text.replace(/[^0-9]/g, '');
    setDisplayValue(numericText);
    
    if (numericText === '') {
      onChange(undefined);
    } else {
      const numValue = parseInt(numericText, 10);
      if (!isNaN(numValue)) {
        onChange(numValue);
      }
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Si no hay valor válido, restaurar valor por defecto
    if (value === undefined || isNaN(Number(value))) {
      onChange(defaultValue);
      setDisplayValue(String(defaultValue));
    }
    onBlur();
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  return (
    <AnimatedLabelInput
      label={label}
      value={displayValue}
      onChangeText={handleChangeText}
      onBlur={handleBlur}
      onFocus={handleFocus}
      error={error}
      disabled={disabled}
      keyboardType="number-pad"
      containerStyle={{ marginBottom: 12 }}
    />
  );
};

export default NumericField; 