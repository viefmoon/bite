import { FC, useState } from "react"
import { TextStyle, ViewStyle } from "react-native"
import { AppStackScreenProps } from "@/navigators"
import { Button, Screen, Text, TextField } from "@/components"
import { colors, spacing } from "@/theme"
import { supabase } from "@/services/supabase"

interface LoginScreenProps extends AppStackScreenProps<"Login"> {}

export const LoginScreen: FC<LoginScreenProps> = (_props) => {
  const { navigation } = _props
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin() {
    // Validación básica
    if (!email || !password) {
      setError("Por favor ingresa email y contraseña")
      return
    }

    // Validación simple de formato de email
    if (!email.includes("@")) {
      setError("Por favor ingresa un email válido")
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.session) {
        navigation.navigate("Dashboard")
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen
      preset="auto"
      contentContainerStyle={$screenContentContainer}
      safeAreaEdges={["top", "bottom"]}
    >
      <Text text="Iniciar Sesión" preset="heading" style={$signIn} />

      {error && <Text text={error} preset="formHelper" style={$error} />}

      <TextField
        value={email}
        onChangeText={setEmail}
        containerStyle={$textField}
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        keyboardType="email-address"
        label="Email"
        placeholder="Ingresa tu email"
        helper={error || undefined}
        status={error ? "error" : undefined}
      />

      <TextField
        value={password}
        onChangeText={setPassword}
        containerStyle={$textField}
        autoCapitalize="none"
        autoComplete="password"
        autoCorrect={false}
        secureTextEntry
        label="Contraseña"
        placeholder="Ingresa tu contraseña"
        helper={error || undefined}
        status={error ? "error" : undefined}
      />

      <Button
        text={loading ? "Iniciando sesión..." : "Iniciar Sesión"}
        style={$tapButton}
        preset="reversed"
        onPress={handleLogin}
        disabled={loading}
      />
    </Screen>
  )
}

const $screenContentContainer: ViewStyle = {
  paddingVertical: spacing.xxl,
  paddingHorizontal: spacing.lg,
}

const $signIn: TextStyle = {
  marginBottom: spacing.sm,
}

const $textField: ViewStyle = {
  marginBottom: spacing.lg,
}

const $tapButton: ViewStyle = {
  marginTop: spacing.xs,
}

const $error: TextStyle = {
  color: colors.error,
  marginBottom: spacing.sm,
}
