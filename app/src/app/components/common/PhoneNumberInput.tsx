import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Menu, Button, HelperText } from 'react-native-paper';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import { useResponsive } from '@/app/hooks/useResponsive';

interface Country {
  code: string;
  name: string;
  prefix: string;
  flag: string;
}

// Lista de países más comunes en América
// IMPORTANTE: Ordenados con prefijos más largos primero para evitar conflictos
const COUNTRIES: Country[] = [
  // Países con prefijos de 4 dígitos
  { code: 'DO', name: 'Rep. Dominicana', prefix: '+1809', flag: '🇩🇴' },
  { code: 'PR', name: 'Puerto Rico', prefix: '+1787', flag: '🇵🇷' },

  // Países con prefijos de 3 dígitos
  { code: 'EC', name: 'Ecuador', prefix: '+593', flag: '🇪🇨' },
  { code: 'BO', name: 'Bolivia', prefix: '+591', flag: '🇧🇴' },
  { code: 'PY', name: 'Paraguay', prefix: '+595', flag: '🇵🇾' },
  { code: 'UY', name: 'Uruguay', prefix: '+598', flag: '🇺🇾' },
  { code: 'GT', name: 'Guatemala', prefix: '+502', flag: '🇬🇹' },
  { code: 'SV', name: 'El Salvador', prefix: '+503', flag: '🇸🇻' },
  { code: 'HN', name: 'Honduras', prefix: '+504', flag: '🇭🇳' },
  { code: 'NI', name: 'Nicaragua', prefix: '+505', flag: '🇳🇮' },
  { code: 'CR', name: 'Costa Rica', prefix: '+506', flag: '🇨🇷' },
  { code: 'PA', name: 'Panamá', prefix: '+507', flag: '🇵🇦' },

  // Países con prefijos de 2 dígitos
  { code: 'MX', name: 'México', prefix: '+52', flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina', prefix: '+54', flag: '🇦🇷' },
  { code: 'BR', name: 'Brasil', prefix: '+55', flag: '🇧🇷' },
  { code: 'CL', name: 'Chile', prefix: '+56', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia', prefix: '+57', flag: '🇨🇴' },
  { code: 'PE', name: 'Perú', prefix: '+51', flag: '🇵🇪' },
  { code: 'VE', name: 'Venezuela', prefix: '+58', flag: '🇻🇪' },
  { code: 'CU', name: 'Cuba', prefix: '+53', flag: '🇨🇺' },
  { code: 'ES', name: 'España', prefix: '+34', flag: '🇪🇸' },

  // Países con prefijo de 1 dígito (al final)
  { code: 'US', name: 'Estados Unidos', prefix: '+1', flag: '🇺🇸' },
  { code: 'CA', name: 'Canadá', prefix: '+1', flag: '🇨🇦' },
];

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
