import { FC } from "react"
import { View, ViewStyle, TextStyle } from "react-native"
import { Text, Button } from "@/components"
import { spacing, Theme } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"

export interface ConfigFormProps {
  title: string
  children: React.ReactNode
  onSubmit: () => void
  isSubmitting: boolean
  style?: ViewStyle
}

export const ConfigForm: FC<ConfigFormProps> = ({
  title,
  children,
  onSubmit,
  isSubmitting,
  style,
}) => {
  const { theme } = useAppTheme()

  return (
    <View style={[style, $container(theme)]}>
      <Text preset="heading" text={title} style={$title(theme)} />
      <View style={$content}>{children}</View>
      <Button
        text={isSubmitting ? "Enviando..." : "Guardar configuración"}
        onPress={onSubmit}
        disabled={isSubmitting}
        style={$submitButton(theme)}
      />
    </View>
  )
}

const $container = (theme: Theme): ViewStyle => ({
  marginBottom: spacing.lg,
  padding: spacing.md,
  backgroundColor: theme.colors.background,
  borderRadius: 8,
})

const $title = (theme: Theme): TextStyle => ({
  fontSize: 18,
  marginBottom: spacing.sm,
  color: theme.colors.text,
})

const $content: ViewStyle = {
  marginBottom: spacing.md,
}

const $submitButton = (theme: Theme): ViewStyle => ({
  backgroundColor: theme.colors.tint,
})
