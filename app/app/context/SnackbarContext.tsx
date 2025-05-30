import { createContext, useContext, useState, ReactNode } from "react"
import { Snackbar } from "react-native-paper"
import { StyleSheet } from "react-native"
import { useAppTheme } from "@/utils/useAppTheme"

interface SnackbarContextType {
  showMessage: (message: string, type?: "success" | "error") => void
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined)

export const SnackbarProvider = ({ children }: { children: ReactNode }) => {
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState("")
  const [type, setType] = useState<"success" | "error">("success")
  const { theme } = useAppTheme()

  const showMessage = (text: string, messageType: "success" | "error" = "success") => {
    setMessage(text)
    setType(messageType)
    setVisible(true)
  }

  return (
    <SnackbarContext.Provider value={{ showMessage }}>
      {children}
      <Snackbar
        visible={visible}
        onDismiss={() => setVisible(false)}
        duration={3000}
        style={[
          styles.snackbar,
          {
            backgroundColor: type === "success" ? theme.colors.success : theme.colors.error,
          },
        ]}
        wrapperStyle={styles.wrapper}
      >
        {message}
      </Snackbar>
    </SnackbarContext.Provider>
  )
}

const styles = StyleSheet.create({
  snackbar: {
    borderRadius: 0,
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
  },
  wrapper: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    zIndex: 9999,
  },
})

export const useSnackbar = () => {
  const context = useContext(SnackbarContext)
  if (!context) throw new Error("useSnackbar must be used within a SnackbarProvider")
  return context
}
