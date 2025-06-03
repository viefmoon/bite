import React, { useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  TextInput,
  Button,
  HelperText,
  Checkbox,
  TouchableRipple,
} from "react-native-paper";
import { useAppTheme } from "../../../app/styles/theme";
import { loginSchema, LoginFormInputs } from "../schema/auth.schema";

interface LoginFormProps {
  onSubmit: (data: LoginFormInputs, rememberMe: boolean) => void;
  isLoading: boolean;
  initialEmailOrUsername?: string;
  initialPassword?: string;
  initialRememberMe?: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  isLoading,
  initialEmailOrUsername = "",
  initialPassword = "",
  initialRememberMe = false,
}) => {
  const theme = useAppTheme();
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [rememberMe, setRememberMe] = useState(initialRememberMe);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrUsername: initialEmailOrUsername,
      password: initialPassword,
    },
  });

  React.useEffect(() => {
    if (initialEmailOrUsername || initialPassword) {
      reset({
        emailOrUsername: initialEmailOrUsername || "",
        password: initialPassword || "",
      });
    }
  }, [initialEmailOrUsername, initialPassword, reset]);

  const toggleSecureEntry = () => {
    setSecureTextEntry(!secureTextEntry);
  };

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          width: "100%",
        },
        input: {
          marginBottom: 8,
        },
        button: {
          marginTop: 16,
        },
        helperText: {
          marginBottom: 8,
        },
        checkboxContainer: {
          flexDirection: "row",
          alignItems: "center",
          marginTop: 8,
          marginBottom: 8,
        },
        checkbox: {},
        checkboxLabel: {
          color: theme.colors.onSurface,
          marginLeft: 8,
        },
      }),
    [theme]
  );

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="emailOrUsername"
        render={({ field: { onChange, onBlur, value } }) => (
          <View>
            <TextInput
              label="Correo o Usuario"
              mode="outlined"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={!!errors.emailOrUsername}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              disabled={isLoading}
            />
            {errors.emailOrUsername && (
              <HelperText
                type="error"
                visible={!!errors.emailOrUsername}
                style={styles.helperText}
              >
                <Text>{errors.emailOrUsername?.message}</Text>
              </HelperText>
            )}
          </View>
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <View>
            <TextInput
              label="Contraseña"
              mode="outlined"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              secureTextEntry={secureTextEntry}
              error={!!errors.password}
              style={styles.input}
              right={
                <TextInput.Icon
                  icon={secureTextEntry ? "eye" : "eye-off"}
                  onPress={toggleSecureEntry}
                  forceTextInputFocus={false}
                  color={errors.password ? theme.colors.error : undefined}
                />
              }
              disabled={isLoading}
            />
            {errors.password && (
              <HelperText
                type="error"
                visible={!!errors.password}
                style={styles.helperText}
              >
                <Text>{errors.password?.message}</Text>
              </HelperText>
            )}
          </View>
        )}
      />

      <TouchableRipple
        onPress={() => !isLoading && setRememberMe(!rememberMe)}
        style={styles.checkboxContainer}
        disabled={isLoading}
      >
        <>
          <Checkbox
            status={rememberMe ? "checked" : "unchecked"}
            onPress={() => setRememberMe(!rememberMe)}
            disabled={isLoading}
          />
          <Text style={styles.checkboxLabel} disabled={isLoading}>
            Recordarme
          </Text>
        </>
      </TouchableRipple>

      <Button
        mode="contained"
        onPress={handleSubmit((data) => onSubmit(data, rememberMe))}
        loading={isLoading}
        disabled={isLoading}
        style={styles.button}
      >
        <Text>{isLoading ? "Ingresando..." : "Ingresar"}</Text>
      </Button>
    </View>
  );
};

export default LoginForm;
