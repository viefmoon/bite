import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import {
  Text,
  Chip,
  IconButton,
  Surface,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme, AppTheme } from '../../../app/styles/theme';
import { PreparationScreen } from '../schema/preparationScreen.schema';

interface PreparationScreenListItemProps {
  item: PreparationScreen;
  onPress: (item: PreparationScreen) => void;
  onManageProducts?: (item: PreparationScreen) => void;
}

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      marginHorizontal: theme.spacing.m,
      marginVertical: theme.spacing.s,
      borderRadius: theme.roundness * 2,
      overflow: 'hidden',
      elevation: 2,
      backgroundColor: theme.colors.surface,
    },
    pressable: {
      borderRadius: theme.roundness * 2,
    },
    colorBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: 6,
    },
    content: {
      padding: theme.spacing.m,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.s,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.m,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      flex: 1,
    },
    statusChip: {
      paddingHorizontal: theme.spacing.s,
    },
    description: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: theme.spacing.m,
      lineHeight: 20,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: theme.spacing.m,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
    },
    statsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.l,
    },
    stat: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    statIcon: {
      opacity: 0.7,
    },
    statText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    actionButton: {
      margin: -8,
    },
  });

const PreparationScreenListItem: React.FC<PreparationScreenListItemProps> = ({
  item,
  onPress,
  onManageProducts,
}) => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => getStyles(theme), [theme]);

  const userCount = item.users?.length || 0;
  const productCount = item.products?.length || 0;
  const isActive = item.isActive ?? true;

  // Get gradient colors based on screen name
  const getGradientColors = () => {
    const name = item.name.toLowerCase();
    if (name.includes('pizza')) {
      return ['#FF6B6B', '#FF8E53'];
    } else if (name.includes('hamburguesa')) {
      return ['#4ECDC4', '#44A08D'];
    } else if (name.includes('bar')) {
      return ['#667EEA', '#764BA2'];
    }
    return [theme.colors.primary, theme.colors.secondary];
  };

  // Get icon based on screen name
  const getIcon = () => {
    const name = item.name.toLowerCase();
    if (name.includes('pizza')) return 'pizza';
    if (name.includes('hamburguesa')) return 'hamburger';
    if (name.includes('bar')) return 'glass-cocktail';
    return 'monitor-dashboard';
  };

  const gradientColors = getGradientColors();

  return (
    <Surface style={styles.container}>
      <Pressable
        style={styles.pressable}
        onPress={() => onPress(item)}
        android_ripple={{ borderless: false }}
      >
        <View
          style={[styles.colorBar, { backgroundColor: gradientColors[0] }]}
        />

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: `${gradientColors[0]}20` },
                ]}
              >
                <Icon name={getIcon()} size={24} color={gradientColors[0]} />
              </View>
              <Text style={styles.title} numberOfLines={1}>
                {item.name}
              </Text>
            </View>

            <Chip
              mode="flat"
              compact
              style={[
                styles.statusChip,
                {
                  backgroundColor: isActive
                    ? theme.colors.successContainer
                    : theme.colors.surfaceVariant,
                },
              ]}
              textStyle={{
                color: isActive
                  ? theme.colors.onSuccessContainer
                  : theme.colors.onSurfaceVariant,
                fontSize: 12,
              }}
            >
              {isActive ? 'Activa' : 'Inactiva'}
            </Chip>
          </View>

          {item.description && (
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          <View style={styles.footer}>
            <View style={styles.statsContainer}>
              <View style={styles.stat}>
                <Icon
                  name="account-group"
                  size={16}
                  color={theme.colors.onSurfaceVariant}
                  style={styles.statIcon}
                />
                <Text style={styles.statText}>
                  {userCount} {userCount === 1 ? 'usuario' : 'usuarios'}
                </Text>
              </View>

              <View style={styles.stat}>
                <Icon
                  name="food"
                  size={16}
                  color={theme.colors.onSurfaceVariant}
                  style={styles.statIcon}
                />
                <Text style={styles.statText}>
                  {productCount} {productCount === 1 ? 'producto' : 'productos'}
                </Text>
              </View>
            </View>

            {onManageProducts && (
              <IconButton
                icon="link-variant"
                size={20}
                onPress={() => onManageProducts(item)}
                style={styles.actionButton}
              />
            )}
          </View>
        </View>
      </Pressable>
    </Surface>
  );
};

export default PreparationScreenListItem;
