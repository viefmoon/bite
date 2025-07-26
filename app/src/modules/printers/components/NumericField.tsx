import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
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
    value !== undefined ? String(value) : '',
  );
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused && value !== undefined) {
      setDisplayValue(String(value));
    }
  }, [value, isFocused]);

  const handleChangeText = (text: string) => {
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
      containerStyle={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
});

export default NumericField;
