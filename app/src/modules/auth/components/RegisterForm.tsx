import React from "react";
import { StyleSheet, View } from "react-native";
import { Button, HelperText, TextInput } from "react-native-paper";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";

import { RegisterFormInputs, registerSchema } from "../schema/auth.schema"; // Corregida ruta de importación
import { authService } from "../services/authService";
import { useAppTheme } from "../../../app/styles/theme";
import { useSnackbarStore } from "../../../app/store/snackbarStore";
import { getApiErrorMessage } from "../../../app/lib/errorMapping";

export function RegisterForm() {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const { mutate: register, isPending } = useMutation({
    mutationFn: (data: RegisterFormInputs) => authService.register(data),
    onSuccess: () => {
      showSnackbar({
        message: "Registro exitoso. Por favor verifica tu correo electrónico.",
        type: "success",
      });
      navigation.goBack();
    },
    onError: (error: unknown) => {
      const userMessage = getApiErrorMessage(error);
      showSnackbar({
        message: userMessage,
        type: "error",
        duration: 5000,
      });
    },
  });

  const onSubmit = (data: RegisterFormInputs) => {
    register(data);
  };

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          gap: theme.spacing.m,
        },
        input: {
          backgroundColor: theme.colors.background,
        },
      }),
    [theme]
  );

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="firstName"
        render={({ field: { onChange, onBlur, value } }) => (
          <>
            <TextInput
              label="Nombre"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={!!errors.firstName}
              style={styles.input}
              disabled={isPending}
            />
            {errors.firstName && (
              <HelperText type="error">{errors.firstName.message}</HelperText>
            )}
          </>
        )}
      />

      <Controller
        control={control}
        name="lastName"
        render={({ field: { onChange, onBlur, value } }) => (
          <>
            <TextInput
              label="Apellido"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={!!errors.lastName}
              style={styles.input}
              disabled={isPending}
            />
            {errors.lastName && (
              <HelperText type="error">{errors.lastName.message}</HelperText>
            )}
          </>
        )}
      />

      <Controller
        control={control}
        name="username"
        render={({ field: { onChange, onBlur, value } }) => (
          <>
            <TextInput
              label="Nombre de usuario"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={!!errors.username}
              style={styles.input}
              autoCapitalize="none"
              disabled={isPending}
            />
            {errors.username && (
              <HelperText type="error">{errors.username.message}</HelperText>
            )}
          </>
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <>
            <TextInput
              label="Correo electrónico"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={!!errors.email}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              disabled={isPending}
            />
            {errors.email && (
              <HelperText type="error">{errors.email.message}</HelperText>
            )}
          </>
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <>
            <TextInput
              label="Contraseña"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={!!errors.password}
              style={styles.input}
              secureTextEntry
              disabled={isPending}
            />
            {errors.password && (
              <HelperText type="error">{errors.password.message}</HelperText>
            )}
          </>
        )}
      />

      <Button
        mode="contained"
        onPress={handleSubmit(onSubmit)}
        loading={isPending}
        disabled={isPending}
      >
        Registrarse
      </Button>
    </View>
  );
}
