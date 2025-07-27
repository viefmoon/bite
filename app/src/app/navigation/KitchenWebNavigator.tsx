import { useState } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { WebDrawer } from './components/WebDrawer';
import { WebDrawerContent } from './components/WebDrawerContent';
import KitchenOrdersScreen from '../../modules/kitchen/screens/KitchenOrdersScreen';
import { useAppTheme } from '../styles/theme';
import { useResponsive } from '../hooks/useResponsive';
import { KitchenProvider } from '../../modules/kitchen/context/KitchenContext';
import { useKitchenHeader } from './components/KitchenHeader';

export function KitchenWebNavigator() {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const kitchenHeader = useKitchenHeader({
    onMenuPress: () => setDrawerOpen(true),
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      backgroundColor: theme.colors.primary,
      height: responsive.isWeb ? 80 : responsive.dimensions.headerHeight,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: responsive.spacingPreset.m,
      elevation: 2,
    },
    headerContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    content: {
      flex: 1,
    },
  });

  return (
    <KitchenProvider>
      <View style={styles.container}>
        <StatusBar
          backgroundColor={theme.colors.primary}
          barStyle={theme.dark ? 'light-content' : 'dark-content'}
        />

        <WebDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          drawerWidth={
            responsive.isWeb ? 320 : responsive.dimensions.drawerWidth
          }
          drawerContent={
            <WebDrawerContent onClose={() => setDrawerOpen(false)} />
          }
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <kitchenHeader.MenuButton />

              <View style={styles.headerContent}>
                <kitchenHeader.Title />
                <kitchenHeader.RightActions />
              </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
              <KitchenOrdersScreen />
            </View>
          </View>
        </WebDrawer>
      </View>
    </KitchenProvider>
  );
}
