import { FC, useState } from "react"
import { ViewStyle, View, ScrollView, TextStyle } from "react-native"
import { AppStackScreenProps } from "@/navigators"
import { Button, Screen, Text, ListItem, Card } from "@/components"
import { Switch } from "@/components/Toggle"
import { spacing } from "@/theme"
import { supabase } from "@/services/supabase"
import { Icon } from "@/components"
import { IconTypes } from "@/components/Icon"
import { useAppTheme } from "@/utils/useAppTheme"
import { Theme } from "@/theme"

interface DashboardScreenProps extends AppStackScreenProps<"Dashboard"> {}

export const DashboardScreen: FC<DashboardScreenProps> = (_props) => {
  const { navigation } = _props
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const { theme, setThemeContextOverride } = useAppTheme()

  async function handleLogout() {
    try {
      await supabase.auth.signOut()
      navigation.navigate("Login")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  const menuItems: Array<{ icon: IconTypes; label: string; onPress: () => void }> = [
    {
      icon: "settings",
      label: "Configuración de dispositivos",
      onPress: () => navigation.navigate("BLE"),
    },
  ]

  return (
    <Screen
      preset="fixed"
      contentContainerStyle={$screenContentContainer}
      safeAreaEdges={["top", "bottom"]}
    >
      <View style={$container}>
        {/* Sidebar */}
        <View style={isSidebarOpen ? $sidebar(theme) : { ...$sidebar(theme), ...$sidebarClosed }}>
          <View style={$sidebarHeader(theme)}>
            <Icon icon="menu" size={24} onPress={() => setIsSidebarOpen(!isSidebarOpen)} />
          </View>

          <ScrollView style={$menuContainer}>
            {menuItems.map((item, index) => (
              <ListItem
                key={index}
                leftIcon={item.icon}
                text={isSidebarOpen ? item.label : ""}
                onPress={item.onPress}
                style={$menuItem(theme)}
              />
            ))}
          </ScrollView>

          {/* Renderiza el toggle de tema sólo si el sidebar está expandido */}
          {isSidebarOpen && (
            <View style={$themeToggleContainer(theme)}>
              <Text text="Tema Oscuro" style={$themeToggleText} />
              <Switch
                value={theme.isDark}
                onValueChange={(value) => setThemeContextOverride(value ? "dark" : "light")}
              />
            </View>
          )}

          <View style={!isSidebarOpen ? $hidden : undefined}>
            <Button
              preset="reversed"
              text={isSidebarOpen ? "Cerrar Sesión" : ""}
              style={{ ...$logoutButton, backgroundColor: theme.colors.error }}
              onPress={handleLogout}
            />
          </View>
        </View>

        {/* Main Content */}
        <View style={$content(theme)}>
          <View style={$headerContent}>
            <Text preset="heading" text="Bienvenido al Dashboard" />
            <Text
              preset="subheading"
              text="Selecciona una opción del menú para comenzar"
              style={$subtitle(theme)}
            />
          </View>
          <View style={$mainContent}>
            {/* Aquí puedes agregar el contenido principal */}
            <Card
              preset="reversed"
              heading="Panel Principal"
              content="Este es el contenido del dashboard. Aquí podrás ver toda la información relevante."
              style={$card}
            />
          </View>
        </View>
      </View>
    </Screen>
  )
}

const $screenContentContainer: ViewStyle = {
  flex: 1,
}

const $container: ViewStyle = {
  flex: 1,
  flexDirection: "row",
}

const $sidebar = (theme: Theme): ViewStyle => ({
  width: 250,
  backgroundColor: theme.colors.background,
  height: "100%",
  padding: spacing.sm,
  justifyContent: "space-between",
  borderRightWidth: 1,
  borderRightColor: theme.colors.border,
})

const $sidebarClosed: ViewStyle = {
  width: 60,
}

const $sidebarHeader = (theme: Theme): ViewStyle => ({
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: spacing.md,
  marginBottom: spacing.sm,
  borderBottomWidth: 1,
  borderBottomColor: theme.colors.border,
})

const $menuContainer: ViewStyle = {
  flex: 1,
}

const $menuItem = (theme: Theme): ViewStyle => ({
  backgroundColor: "transparent",
  borderBottomWidth: 1,
  borderBottomColor: theme.colors.border,
  paddingVertical: spacing.xs,
  marginVertical: spacing.xxs,
})

const $content = (theme: Theme): ViewStyle => ({
  flex: 1,
  padding: spacing.lg,
  backgroundColor: theme.colors.background,
})

const $logoutButton: ViewStyle = {
  marginTop: spacing.md,
}

const $headerContent: ViewStyle = {
  marginBottom: spacing.xl,
}

const $subtitle = (theme: Theme): TextStyle => ({
  marginTop: spacing.sm,
  color: theme.colors.textDim,
})

const $mainContent: ViewStyle = {
  flex: 1,
}

const $card: ViewStyle = {
  marginBottom: spacing.lg,
}

const $themeToggleContainer = (theme: Theme): ViewStyle => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginVertical: spacing.sm,
  paddingVertical: spacing.xs,
  borderTopWidth: 1,
  borderTopColor: theme.colors.border,
})

const $themeToggleText: TextStyle = {
  marginRight: spacing.sm,
}

const $hidden: ViewStyle = {
  display: "none",
}
