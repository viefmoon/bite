import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text, Icon, Surface } from 'react-native-paper';
import { AppTheme } from '@/app/styles/theme';
import { useResponsive } from '@/app/hooks/useResponsive';

interface RoleSelectorProps {
  value: number;
  onChange: (value: number) => void;
  roles: Array<{
    value: number;
    label: string;
    icon: string;
    description: string;
  }>;
  theme: AppTheme;
  responsive: ReturnType<typeof useResponsive>;
}

export const RoleSelector = React.memo(
  ({ value, onChange, roles, theme, responsive }: RoleSelectorProps) => {
    const styles = getStyles(theme, responsive);

    return (
      <View style={styles.inputContainer}>
        <View style={styles.fieldLabelContainer}>
          <Icon source="badge-account" size={20} color={theme.colors.primary} />
          <Text style={styles.sectionTitle} variant="titleMedium">
            Rol del usuario
          </Text>
        </View>
        <View style={[styles.rolesGrid, { marginTop: theme.spacing.s }]}>
          {roles.map((role) => (
            <Surface
              key={role.value}
              style={[
                styles.roleCard,
                value === role.value && styles.roleCardActive,
              ]}
              elevation={value === role.value ? 2 : 0}
            >
              <TouchableOpacity
                onPress={() => onChange(role.value)}
                style={styles.roleCardContent}
              >
                <Icon
                  source={role.icon}
                  size={24}
                  color={
                    value === role.value
                      ? theme.colors.primary
                      : theme.colors.onSurfaceVariant
                  }
                />
                <Text
                  style={[
                    styles.roleLabel,
                    value === role.value && styles.roleLabelActive,
                  ]}
                  variant="labelMedium"
                >
                  {role.label}
                </Text>
                <Text
                  style={styles.roleDescription}
                  variant="bodySmall"
                  numberOfLines={1}
                >
                  {role.description}
                </Text>
              </TouchableOpacity>
            </Surface>
          ))}
        </View>
      </View>
    );
  },
);

RoleSelector.displayName = 'RoleSelector';

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
    rolesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
      justifyContent: 'space-between',
    },
    roleCard: {
      borderRadius: theme.roundness * 2,
      padding: theme.spacing.s,
      backgroundColor: theme.colors.surface,
      width: responsive.isTablet ? '30%' : '48%',
      minWidth: responsive.isTablet ? 120 : 100,
      borderWidth: 1.5,
      borderColor: theme.colors.outlineVariant,
      elevation: 1,
      marginBottom: theme.spacing.xs,
    },
    roleCardActive: {
      backgroundColor: theme.colors.primaryContainer,
      borderColor: theme.colors.primary,
      elevation: 3,
    },
    roleCardContent: {
      alignItems: 'center',
    },
    roleLabel: {
      color: theme.colors.onSurfaceVariant,
      marginTop: theme.spacing.xs,
      fontWeight: '500',
    },
    roleLabelActive: {
      color: theme.colors.onPrimaryContainer,
      fontWeight: '700',
    },
    roleDescription: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
      fontSize: 10,
      textAlign: 'center',
    },
  });
