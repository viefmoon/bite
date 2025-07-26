import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Surface, Text, IconButton, Switch } from 'react-native-paper';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import { useResponsive } from '@/app/hooks/useResponsive';

interface AvailabilityListItemProps {
  title: string;
  subtitle: string;
  icon: string;
  isActive: boolean;
  onToggle?: (value: boolean) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  children?: React.ReactNode;
}

export const AvailabilityListItem: React.FC<AvailabilityListItemProps> = ({
  title,
  subtitle,
  icon,
  isActive,
  onToggle,
  isExpanded = false,
  onToggleExpand,
  children,
}) => {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const styles = React.useMemo(
    () => createStyles(theme, responsive),
    [theme, responsive],
  );

  return (
    <Surface
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
      elevation={1}
    >
      <TouchableOpacity
        style={[
          styles.header,
          styles.headerBackground,
          isActive ? styles.activeHeader : styles.inactiveHeader,
        ]}
        onPress={onToggleExpand}
        activeOpacity={0.7}
        disabled={!onToggleExpand}
      >
        <View style={styles.left}>
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: isActive
                  ? theme.colors.primaryContainer
                  : theme.colors.surfaceVariant,
              },
            ]}
          >
            <IconButton
              icon={icon}
              size={20}
              iconColor={isActive ? theme.colors.primary : theme.colors.outline}
              style={styles.iconButton}
            />
          </View>
          <View style={styles.info}>
            <Text
              style={[styles.title, { color: theme.colors.onSurface }]}
              numberOfLines={1}
            >
              {title}
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {subtitle}
            </Text>
          </View>
        </View>

        <View style={styles.right}>
          {onToggle && (
            <Switch
              value={isActive}
              onValueChange={onToggle}
              color={theme.colors.primary}
              style={styles.switch}
            />
          )}
          {onToggleExpand && (
            <IconButton
              icon={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              iconColor={theme.colors.onSurfaceVariant}
              style={styles.iconButton}
            />
          )}
        </View>
      </TouchableOpacity>

      {isExpanded && children && (
        <View
          style={[
            styles.expandedContent,
            { backgroundColor: theme.colors.elevation.level1 },
          ]}
        >
          {children}
        </View>
      )}
    </Surface>
  );
};

const createStyles = (
  theme: AppTheme,
  responsive: ReturnType<typeof useResponsive>,
) =>
  StyleSheet.create({
    container: {
      marginHorizontal: responsive.spacing(theme.spacing.m),
      borderRadius: 16,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: responsive.spacing(theme.spacing.m),
    },
    left: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    iconContainer: {
      width: responsive.isTablet ? 32 : 40,
      height: responsive.isTablet ? 32 : 40,
      borderRadius: responsive.isTablet ? 16 : 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: responsive.spacing(theme.spacing.m),
    },
    info: {
      flex: 1,
    },
    title: {
      fontSize: responsive.fontSize(16),
      fontWeight: '600',
      marginBottom: 2,
    },
    subtitle: {
      fontSize: responsive.fontSize(12),
      opacity: 0.8,
    },
    right: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    switch: {
      marginHorizontal: responsive.spacing(theme.spacing.s),
    },
    expandedContent: {
      paddingHorizontal: responsive.spacing(theme.spacing.m),
      paddingBottom: responsive.spacing(theme.spacing.m),
    },
    headerBackground: {
      backgroundColor: theme.colors.elevation.level2,
    },
    activeHeader: {
      opacity: 1,
    },
    inactiveHeader: {
      opacity: 0.7,
    },
    iconButton: {
      margin: 0,
    },
  });
