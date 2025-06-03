import React, { useEffect, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import {
  Modal,
  Portal,
  Card,
  TextInput,
  Button,
  Switch,
  Text,
  HelperText,
} from "react-native-paper";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProductVariant } from "../schema/products.schema";
import { productVariantSchema } from "../../../app/schemas/domain/product-variant.schema";
import { useAppTheme } from "@/app/styles/theme";

interface VariantFormModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (data: ProductVariant) => void; 
  initialData?: Partial<ProductVariant>; 
}

function VariantFormModal({
  visible,
  onDismiss,
  onSubmit,
  initialData,
}: VariantFormModalProps): JSX.Element {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isEditing = !!initialData?.name;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductVariant>({
    resolver: zodResolver(productVariantSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      price: initialData?.price ?? 0,
      isActive: initialData?.isActive ?? true,
      id: initialData?.id,
    },
  });

  useEffect(() => {
    if (visible) {
      reset({
        name: initialData?.name ?? "",
        price: initialData?.price ?? 0,
        isActive: initialData?.isActive ?? true,
        id: initialData?.id,
      });
    } else {
    }
  }, [visible, initialData, reset]);

  const handleFormSubmit = (data: ProductVariant) => {
    const finalData = {
      ...data,
      ...(initialData?.id && { id: initialData.id }),
    };
    onSubmit(finalData);
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <Card style={styles.card}>
          <Card.Title
            title={isEditing ? "Editar Variante" : "Nueva Variante"}
          />
          <Card.Content style={styles.content}>
            <View style={styles.fieldContainer}>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Nombre Variante *"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={!!errors.name}
                    style={styles.input}
                    autoFocus={!isEditing}
                  />
                )}
              />
              {errors.name && (
                <HelperText type="error" visible={!!errors.name}>
                  {errors.name.message}
                </HelperText>
              )}
            </View>

            <View style={styles.fieldContainer}>
              <Controller
                control={control}
                name="price"
                render={({ field }) => {
                  // Usar estado local para el texto del input
                  const [inputValue, setInputValue] = React.useState<string>(
                    field.value !== undefined && field.value !== null
                      ? String(field.value)
                      : ""
                  );

                  // Actualizar el estado local cuando cambia el valor del formulario
                  React.useEffect(() => {
                    setInputValue(
                      field.value !== undefined && field.value !== null
                        ? String(field.value)
                        : ""
                    );
                  }, [field.value]);

                  return (
                    <TextInput
                      label="Precio *"
                      value={inputValue}
                      onChangeText={(text) => {
                        // Reemplazar comas por puntos
                        const formattedText = text.replace(/,/g, ".");

                        // Validar que solo tenga números y como máximo un punto decimal
                        if (/^(\d*\.?\d*)$/.test(formattedText)) {
                          // Actualizar el estado local directamente sin conversión
                          setInputValue(formattedText);

                          // Actualizar el valor del formulario solo si es un número válido o vacío
                          if (formattedText === "") {
                            field.onChange(undefined); // Usar undefined si está vacío
                          } else if (formattedText !== ".") {
                            // Solo actualizar el valor numérico si no es solo un punto
                            const numericValue = parseFloat(formattedText);
                            if (!isNaN(numericValue)) {
                              field.onChange(numericValue);
                            }
                          }
                          // Si es solo ".", no actualizamos el valor numérico todavía
                        }
                      }}
                      onBlur={field.onBlur}
                      error={!!errors.price}
                      style={styles.input}
                      keyboardType="decimal-pad"
                    />
                  );
                }}
              />
              {errors.price && (
                <HelperText type="error" visible={!!errors.price}>
                  {errors.price.message}
                </HelperText>
              )}
            </View>

            <View style={[styles.fieldContainer, styles.switchContainer]}>
              <Text style={styles.label}>Variante Activa</Text>
              <Controller
                control={control}
                name="isActive"
                render={({ field: { onChange, value } }) => (
                  <Switch value={!!value} onValueChange={onChange} />
                )}
              />
            </View>
          </Card.Content>
          <Card.Actions style={styles.actions}>
            <Button onPress={onDismiss} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit(handleFormSubmit)}
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Guardar
            </Button>
          </Card.Actions>
        </Card>
      </Modal>
    </Portal>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    modalContainer: {
      padding: theme.spacing.l, // Más padding exterior
    },
    card: {
      backgroundColor: theme.colors.inverseOnSurface,
      borderRadius: theme.roundness * 3, // Un poco más redondeado
    },
    content: {
      paddingHorizontal: theme.spacing.m, // Padding horizontal para el contenido
      paddingBottom: theme.spacing.s, // Pequeño padding inferior antes de las acciones
    },
    fieldContainer: {
      marginBottom: theme.spacing.m, // Espacio uniforme debajo de cada campo/grupo
    },
    input: {
    },
    switchContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    label: {
      color: theme.colors.onSurfaceVariant,
    },
    actions: {
      justifyContent: "flex-end",
      padding: theme.spacing.m, // Padding uniforme para las acciones
    },
  });

export default VariantFormModal;
