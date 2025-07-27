import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Menu, Button, HelperText } from 'react-native-paper';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import { useResponsive } from '@/app/hooks/useResponsive';
import { COUNTRIES, Country } from '@/app/constants/countries';

interface PhoneNumberInputProps {
  value: string;
  onChange: (fullNumber: string) => void;
  error?: boolean;
  helperText?: string;
  placeholder?: string;
}

export default function PhoneNumberInput({
  value,
  onChange,
  error,
  helperText,
  placeholder = 'Teléfono',
}: PhoneNumberInputProps) {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const styles = React.useMemo(
    () => getStyles(theme, responsive),
    [theme, responsive],
  );

  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);

  // Detectar país y número al recibir un valor completo
  useEffect(() => {
    if (value && value.startsWith('+')) {
      // Ordenar países por longitud de prefijo (más largos primero) para evitar coincidencias erróneas
      const sortedCountries = [...COUNTRIES].sort(
        (a, b) => b.prefix.length - a.prefix.length,
      );

      // Encontrar el país por el prefijo
      const country = sortedCountries.find((c) => value.startsWith(c.prefix));
      if (country) {
        setSelectedCountry(country);
        setPhoneNumber(value.substring(country.prefix.length));
      } else {
        // Si no encontramos el país, usar el default y mostrar todo el número
        setPhoneNumber(value);
      }
    } else {
      setPhoneNumber(value || '');
    }
  }, [value]);

  const handlePhoneChange = (text: string) => {
    // Solo permitir números y limitar a 15 dígitos (estándar internacional)
    const cleaned = text.replace(/[^\d]/g, '').slice(0, 15);
    setPhoneNumber(cleaned);

    // Actualizar el valor completo
    if (cleaned) {
      onChange(`${selectedCountry.prefix}${cleaned}`);
    } else {
      onChange('');
    }
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setMenuVisible(false);

    // Actualizar el valor completo con el nuevo país
    if (phoneNumber) {
      onChange(`${country.prefix}${phoneNumber}`);
    }
  };

  return (
    <View>
      <View style={styles.container}>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setMenuVisible(true)}
              style={styles.countryButton}
              labelStyle={styles.countryButtonLabel}
            >
              {selectedCountry.flag} {selectedCountry.prefix}
            </Button>
          }
          contentStyle={styles.menuContent}
        >
          <ScrollView
            style={styles.menuScrollView}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            {COUNTRIES.map((country) => (
              <Menu.Item
                key={country.code}
                onPress={() => handleCountrySelect(country)}
                title={`${country.flag} ${country.name} (${country.prefix})`}
                titleStyle={styles.menuItem}
              />
            ))}
          </ScrollView>
        </Menu>

        <TextInput
          value={phoneNumber}
          onChangeText={handlePhoneChange}
          placeholder={placeholder}
          keyboardType="phone-pad"
          mode="outlined"
          error={error}
          style={styles.input}
          outlineStyle={styles.inputOutline}
          maxLength={15}
        />
      </View>

      {helperText && (
        <HelperText type="error" visible={error}>
          {helperText}
        </HelperText>
      )}
    </View>
  );
}

const getStyles = (
  theme: AppTheme,
  responsive: ReturnType<typeof useResponsive>,
) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: responsive.spacing(theme.spacing.s),
    },
    countryButton: {
      minWidth: responsive.isTablet ? 85 : 90,
      height: responsive.isTablet ? 48 : 56,
      justifyContent: 'center',
    },
    countryButtonLabel: {
      fontSize: responsive.fontSize(16),
    },
    menuContent: {
      maxHeight: responsive.isTablet ? 400 : 350,
      backgroundColor: theme.colors.surface,
    },
    menuScrollView: {
      maxHeight: responsive.isTablet ? 390 : 340,
    },
    menuItem: {
      fontSize: responsive.fontSize(14),
    },
    input: {
      flex: 1,
      height: responsive.isTablet ? 48 : 56,
    },
    inputOutline: {
      borderRadius: theme.roundness * 2,
    },
  });
