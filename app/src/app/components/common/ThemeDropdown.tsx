import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Menu, Icon, HelperText } from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';

export interface DropdownOption {
  id: string;
  label: string;
  disabled?: boolean;
  subtitle?: string;
  icon?: string;
}

interface ThemeDropdownProps {
  label: string;
  value?: string | null;
  options: DropdownOption[];
  placeholder?: string;
  onSelect: (option: DropdownOption) => void;
  onOpen?: () => void;
  disabled?: boolean;
  loading?: boolean;
  error?: boolean;
  helperText?: string;
  required?: boolean;
}

export const ThemeDropdown: React.FC<ThemeDropdownProps> = ({
  label,
  value,
  options,
  placeholder = 'Seleccionar...',
  onSelect,
  onOpen,
  disabled = false,
  loading = false,
  error = false,
  helperText,
  required = false,
}) => {
  const theme = useAppTheme();
  const [visible, setVisible] = useState(false);
  
  const selectedOption = options.find((option) => option.id === value);
  const displayValue = selectedOption?.label || '';
  
  const styles = useMemo(
    () => createStyles(theme),
    [theme]
  );

  const handleOpen = useCallback(() => {
    if (disabled || loading) return;
    
    if (onOpen) {
      onOpen();
    }
    setVisible(true);
  }, [disabled, loading, onOpen]);

  const handleClose = useCallback(() => {
    setVisible(false);
  }, []);

  const handleSelect = useCallback((option: DropdownOption) => {
    if (option.disabled) return;
    
    onSelect(option);
    setVisible(false);
  }, [onSelect]);

  const borderColor = error
    ? theme.colors.error
    : disabled
    ? theme.colors.outline
    : theme.colors.primary;

  return (
    <View style={styles.container}>
      <Menu
        visible={visible}
        onDismiss={handleClose}
        contentStyle={styles.menuContent}
        anchor={
          <TouchableOpacity
            style={[
              styles.inputContainer,
              {
                borderColor,
                backgroundColor: disabled 
                  ? theme.colors.surfaceDisabled 
                  : theme.colors.surface,
              },
            ]}
            onPress={handleOpen}
            disabled={disabled || loading}
            activeOpacity={0.7}
          >
            <View style={styles.labelContainer}>
              <Text style={[
                styles.label,
                { color: error ? theme.colors.error : theme.colors.onSurfaceVariant }
              ]}>
                {label}{required && ' *'}
              </Text>
            </View>
            
            <View style={styles.valueContainer}>
              <Text
                style={[
                  styles.valueText,
                  {
                    color: disabled
                      ? theme.colors.onSurfaceDisabled
                      : displayValue
                      ? theme.colors.onSurface
                      : theme.colors.onSurfaceVariant,
                  },
                ]}
                numberOfLines={1}
              >
                {loading ? '' : displayValue || placeholder}
              </Text>
              
              <View style={styles.iconContainer}>
                {loading ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.primary}
                  />
                ) : (
                  <Icon
                    source={visible ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={
                      disabled
                        ? theme.colors.onSurfaceDisabled
                        : theme.colors.onSurfaceVariant
                    }
                  />
                )}
              </View>
            </View>
          </TouchableOpacity>
        }
      >
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={true}
          persistentScrollbar={true}
        >
          {options.length === 0 ? (
            <Menu.Item
              title="No hay opciones disponibles"
              disabled
              titleStyle={styles.emptyText}
            />
          ) : (
            options.map((option) => (
              <Menu.Item
                key={option.id}
                title={option.label}
                onPress={() => handleSelect(option)}
                disabled={option.disabled}
                titleStyle={[
                  styles.menuItemTitle,
                  option.disabled && { color: theme.colors.onSurfaceDisabled },
                  option.id === value && { 
                    color: theme.colors.primary,
                    fontWeight: '600',
                  },
                ]}
                style={[
                  styles.menuItem,
                  option.id === value && {
                    backgroundColor: theme.colors.primaryContainer,
                  },
                ]}
              />
            ))
          )}
        </ScrollView>
      </Menu>
      
      {helperText && (
        <HelperText
          type={error ? 'error' : 'info'}
          visible={!!helperText}
          style={styles.helperText}
        >
          {helperText}
        </HelperText>
      )}
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      marginVertical: theme.spacing.xs,
    },
    inputContainer: {
      borderWidth: 1,
      borderRadius: theme.roundness,
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
      minHeight: 56,
      justifyContent: 'center',
    },
    labelContainer: {
      position: 'absolute',
      top: -8,
      left: theme.spacing.s,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 4,
      zIndex: 1,
    },
    label: {
      fontSize: 12,
      fontWeight: '500',
    },
    valueContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    valueText: {
      fontSize: 16,
      flex: 1,
      marginRight: theme.spacing.s,
    },
    iconContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      width: 20,
      height: 20,
    },
    menuContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      marginTop: 4,
      elevation: 4,
      shadowColor: theme.colors.shadow,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      maxHeight: 280, // Altura más grande para más opciones
    },
    scrollView: {
      maxHeight: 280,
    },
    menuItem: {
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
      minHeight: 48, // Un poco más alto para mejor usabilidad
    },
    menuItemTitle: {
      fontSize: 16,
      color: theme.colors.onSurface,
    },
    emptyText: {
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
    },
    helperText: {
      fontSize: 12,
      marginTop: theme.spacing.xxs,
      paddingHorizontal: theme.spacing.s,
    },
  });