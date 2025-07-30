import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text, Icon, Surface } from 'react-native-paper';
import { AppTheme } from '@/app/styles/theme';
import { useResponsive } from '@/app/hooks/useResponsive';
import { GenderEnum } from '../schema/user.schema';

interface GenderSelectorProps {
  value: GenderEnum | null;
  onChange: (value: GenderEnum) => void;
  options: Array<{
    value: GenderEnum;
    label: string;
    icon: string;
    color: string;
  }>;
  theme: AppTheme;
  responsive: ReturnType<typeof useResponsive>;
}

export const GenderSelector = React.memo(
  ({ value, onChange, options, theme, responsive }: GenderSelectorProps) => {
    const styles = getStyles(theme, responsive);

    return (
      <View style={styles.inputContainer}>
        <View style={styles.fieldLabelContainer}>
          <Icon
            source="gender-transgender"
            size={20}
            color={theme.colors.primary}
          />
          <Text style={styles.sectionTitle} variant="titleMedium">
            Género
          </Text>
        </View>
        <View style={[styles.genderContainer, { marginTop: theme.spacing.s }]}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => onChange(option.value)}
              activeOpacity={0.7}
            >
              <Surface
                style={[
                  styles.genderOption,
                  value === option.value && styles.genderOptionActive,
                ]}
                elevation={value === option.value ? 3 : 1}
              >
                <View
                  style={[
                    styles.genderIconContainer,
                    value === option.value && {
                      backgroundColor: option.color + '20',
                    },
                  ]}
                >
                  <Icon
                    source={option.icon}
                    size={20}
                    color={
                      value === option.value
                        ? option.color
                        : theme.colors.onSurfaceVariant
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.genderLabel,
                    value === option.value && styles.genderLabelActive,
                  ]}
                  variant="labelMedium"
                >
                  {option.label}
                </Text>
              </Surface>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  },
);

GenderSelector.displayName = 'GenderSelector';

const getStyles = (
  theme: AppTheme,
  responsive: ReturnType<typeof useResponsive>,
) =>
  StyleSheet.create({
    inputContainer: {
      marginBottom: theme.spacing.xs,
    },
    fieldLabelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.s,
    },
    sectionTitle: {
      fontWeight: '600',
      color: theme.colors.onSurface,
      fontSize: responsive.isTablet ? 14 : 13,
      flex: 1,
    },
    genderContainer: {
      flexDirection: 'row',
      gap: theme.spacing.s,
      justifyContent: 'flex-start',
    },
    genderOption: {
      borderRadius: theme.roundness * 2,
      padding: theme.spacing.s,
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      flex: 1,
      minWidth: 80,
      maxWidth: responsive.isTablet ? 120 : 100,
      borderWidth: 1.5,
      borderColor: theme.colors.outlineVariant,
    },
    genderOptionActive: {
      backgroundColor: theme.colors.primaryContainer,
      borderColor: theme.colors.primary,
    },
    genderIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.xs,
    },
    genderLabel: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 11,
      textAlign: 'center',
    },
    genderLabelActive: {
      color: theme.colors.onPrimaryContainer,
      fontWeight: '600',
    },
  });
