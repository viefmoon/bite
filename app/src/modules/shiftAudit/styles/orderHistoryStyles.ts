import { StyleSheet } from 'react-native';
import { useAppTheme } from '@/app/styles/theme';

export const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      backgroundColor: theme.colors.surface,
      elevation: 2,
    },
    content: {
      flex: 1,
      padding: theme.spacing.m,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.l,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.l,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.l,
    },
    emptyText: {
      marginTop: theme.spacing.m,
      textAlign: 'center',
      color: theme.colors.onSurface,
    },
    errorText: {
      marginTop: theme.spacing.m,
      textAlign: 'center',
      color: theme.colors.error,
    },
    historyItem: {
      marginBottom: theme.spacing.m,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      overflow: 'hidden',
    },
    historyItemHeader: {
      padding: theme.spacing.m,
    },
    historyItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    historyItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    historyItemRight: {
      alignItems: 'flex-end',
    },
    operationIcon: {
      marginRight: theme.spacing.m,
    },
    historyItemInfo: {
      flex: 1,
    },
    operationBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    operationBadge: {
      paddingHorizontal: theme.spacing.s,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.roundness,
      marginRight: theme.spacing.s,
    },
    operationBadgeText: {
      fontWeight: '500',
    },
    statusChip: {
      height: 24,
    },
    statusChipText: {
      fontSize: 10,
      lineHeight: 12,
    },
    userText: {
      color: theme.colors.onSurfaceVariant,
    },
    timestampText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 11,
    },
    expandedContent: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.outlineVariant,
      padding: theme.spacing.m,
    },
    dividerMargin: {
      marginVertical: theme.spacing.s,
    },
    changesContainer: {
      marginTop: theme.spacing.s,
    },
    summaryText: {
      marginBottom: theme.spacing.s,
      fontWeight: '500',
    },
    sectionTitle: {
      marginTop: theme.spacing.m,
      marginBottom: theme.spacing.s,
      fontWeight: '500',
    },
    orderDetailsContainer: {
      padding: theme.spacing.m,
      borderRadius: theme.roundness,
      marginBottom: theme.spacing.m,
    },
    orderDetailsTitle: {
      marginBottom: theme.spacing.s,
      fontWeight: '500',
    },
    fieldRow: {
      marginBottom: theme.spacing.xs,
    },
    fieldLabel: {
      fontWeight: '500',
    },
    changeRow: {
      marginBottom: theme.spacing.s,
    },
    changeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.xs,
    },
    productItemBorder: {
      borderLeftWidth: 3,
      paddingLeft: theme.spacing.m,
      paddingRight: theme.spacing.m,
      paddingVertical: theme.spacing.s,
      marginBottom: theme.spacing.s,
      borderRadius: theme.roundness,
    },
    productNameText: {
      fontWeight: '500',
      marginBottom: theme.spacing.xs,
    },
    modifierText: {
      fontSize: 12,
      marginBottom: theme.spacing.xs,
    },
    quantityText: {
      fontSize: 12,
      fontWeight: '500',
    },
    priceText: {
      fontSize: 12,
      fontWeight: '500',
    },
    itemDescriptionContainer: {
      padding: theme.spacing.s,
      borderRadius: theme.roundness,
      marginTop: theme.spacing.s,
    },
    batchTitle: {
      marginBottom: theme.spacing.s,
      fontWeight: '500',
    },
    batchOperationContainer: {
      borderLeftWidth: 2,
      paddingLeft: theme.spacing.m,
      paddingRight: theme.spacing.m,
      paddingVertical: theme.spacing.s,
    },
    batchOperationMarginBottom: {
      marginBottom: theme.spacing.m,
    },
    batchOperationNoMargin: {
      marginBottom: 0,
    },
    batchOperationRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    batchBulletText: {
      fontSize: 16,
      marginRight: theme.spacing.s,
      marginTop: 2,
    },
    batchOperationContent: {
      flex: 1,
    },
    batchOperationLabel: {
      fontWeight: '500',
      marginBottom: theme.spacing.xs,
    },
    batchOperationDescription: {
      padding: theme.spacing.s,
      borderRadius: theme.roundness,
      marginTop: theme.spacing.xs,
    },
    batchUpdateMargin: {
      marginTop: theme.spacing.s,
    },
    batchFieldContainer: {
      marginBottom: theme.spacing.s,
    },
    batchFieldLabel: {
      marginBottom: theme.spacing.xs,
    },
    primaryContainer: {
      paddingHorizontal: theme.spacing.s,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.roundness,
    },
    labelSmallMedium: {
      fontWeight: '500',
    },
    marginHorizontal4: {
      marginHorizontal: 4,
    },
    marginTop4: {
      marginTop: theme.spacing.xs,
    },
    emptyIcon: {
      marginBottom: theme.spacing.m,
    },
    errorIcon: {
      marginBottom: theme.spacing.m,
    },
    retryButton: {
      marginTop: theme.spacing.m,
    },
    loadingText: {
      marginTop: theme.spacing.m,
    },
    listContent: {
      paddingBottom: theme.spacing.l,
    },
  });