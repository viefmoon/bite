import React, { useState, useEffect, useMemo } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Modal,
  Portal,
  Text,
  Button,
  RadioButton,
  Checkbox,
  Divider,
  Appbar, // Importar Appbar
  Title,
  TouchableRipple,
  IconButton,
} from "react-native-paper";
import { Image } from "expo-image";
import { useForm, Controller, FieldValues } from "react-hook-form";
import { useAppTheme } from "@/app/styles/theme";
import SpeechRecognitionInput from "@/app/components/common/SpeechRecognitionInput"; // Importar SpeechRecognitionInput
import {
  Product,
  ProductVariant,
  Modifier,
  ModifierGroup,
} from "../types/orders.types";
import { CartItemModifier } from "../context/CartContext";
import { getImageUrl } from "@/app/lib/imageUtils";
import { AppTheme } from "@/app/styles/theme";

interface ProductCustomizationModalProps {
  visible: boolean;
  onDismiss: () => void;
  product: Product;
  onAddToCart: (
    product: Product,
    quantity: number,
    variantId?: string,
    modifiers?: CartItemModifier[],
    preparationNotes?: string
  ) => void;
}

interface NotesFormData extends FieldValues {
  preparationNotes: string;
}

const ProductCustomizationModal: React.FC<ProductCustomizationModalProps> = ({
  visible,
  onDismiss,
  product,
  onAddToCart,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { control, reset, watch } = useForm<NotesFormData>({
    defaultValues: { preparationNotes: "" },
  });
  const watchedPreparationNotes = watch("preparationNotes");

  const [selectedVariantId, setSelectedVariantId] = useState<
    string | undefined
  >(
    product &&
      product.variants &&
      Array.isArray(product.variants) &&
      product.variants.length > 0
      ? product.variants[0].id
      : undefined
  );
  const [selectedModifiersByGroup, setSelectedModifiersByGroup] = useState<
    Record<string, CartItemModifier[]>
  >({});

  const selectedModifiers = useMemo(() => {
    return Object.values(selectedModifiersByGroup).flat();
  }, [selectedModifiersByGroup]);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!product) return;

    if (
      product.variants &&
      Array.isArray(product.variants) &&
      product.variants.length > 0
    ) {
      setSelectedVariantId(product.variants[0].id);
    } else {
      setSelectedVariantId(undefined);
    }
    setSelectedModifiersByGroup({});
    setQuantity(1);
    reset({ preparationNotes: "" });
  }, [product, reset]);

  const handleVariantSelect = (variantId: string) => {
    setSelectedVariantId(variantId);
  };

  const handleModifierToggle = (modifier: Modifier, group: ModifierGroup) => {
    const currentGroupModifiers = selectedModifiersByGroup[group.id] || [];
    const isSelected = currentGroupModifiers.some(
      (mod) => mod.id === modifier.id
    );

    const updatedModifiersByGroup = { ...selectedModifiersByGroup };

    if (isSelected) {
      updatedModifiersByGroup[group.id] = currentGroupModifiers.filter(
        (mod) => mod.id !== modifier.id
      );
    } else {
      const newModifier: CartItemModifier = {
        id: modifier.id,
        name: modifier.name,
        price: Number(modifier.price) || 0,
      };

      if (!group.allowMultipleSelections) {
        updatedModifiersByGroup[group.id] = [newModifier];
      } else {
        if (currentGroupModifiers.length < group.maxSelection) {
          updatedModifiersByGroup[group.id] = [
            ...currentGroupModifiers,
            newModifier,
          ];
        } else {
          alert(
            `Solo puedes seleccionar hasta ${group.maxSelection} opciones en ${group.name}`
          );
          return;
        }
      }
    }

    setSelectedModifiersByGroup(updatedModifiersByGroup);
  };

  const handleAddToCart = () => {
    onAddToCart(
      product,
      quantity,
      selectedVariantId,
      selectedModifiers,
      watchedPreparationNotes
    );
    onDismiss();
  };

  const increaseQuantity = () => setQuantity((prev) => prev + 1);
  const decreaseQuantity = () =>
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  if (!product) {
    return null;
  }

  const selectedVariant =
    product.variants && Array.isArray(product.variants)
      ? product.variants.find(
          (variant: ProductVariant) => variant.id === selectedVariantId
        )
      : undefined;

  const basePrice = selectedVariant
    ? Number(selectedVariant.price)
    : Number(product.price) || 0;
  const modifiersPrice = selectedModifiers.reduce(
    (sum, mod) => sum + Number(mod.price || 0),
    0
  );
  const totalPrice = (basePrice + modifiersPrice) * quantity;

  const imageUrl = product.photo ? getImageUrl(product.photo.path) : null;

  const blurhash =
    "|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[";

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContent}
      >
        {/* Encabezado Refactorizado con Appbar */}
        <Appbar.Header style={styles.appBar} elevated>
          <Appbar.BackAction onPress={onDismiss} color={theme.colors.onSurface} />
          <Appbar.Content
            title={product?.name || "Producto"}
            titleStyle={styles.appBarTitle}
            style={styles.appBarContent}
          />
          {/* Espaciador si no hay acción a la derecha */}
          <View style={styles.appBarSpacer} />
        </Appbar.Header>

        <ScrollView style={styles.scrollView}>
          {product.hasVariants &&
            product.variants &&
            Array.isArray(product.variants) &&
            product.variants.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Variantes</Text>
                <RadioButton.Group
                  onValueChange={(value) => handleVariantSelect(value)}
                  value={selectedVariantId || ""}
                >
                  {product.variants.map((variant: ProductVariant) => (
                    <View key={variant.id} style={styles.optionContainer}>
                      <View style={styles.optionRow}>
                        <RadioButton.Item
                          label={variant.name}
                          labelStyle={styles.modifierTitle}
                          value={variant.id}
                          position="leading"
                          style={styles.radioItem}
                        />
                        {/* Aplicar color de precio consistente */}
                        <Text style={styles.variantPrice}>
                          ${Number(variant.price).toFixed(2)}
                        </Text>
                      </View>
                      <Divider style={styles.optionDivider} />
                    </View>
                  ))}
                </RadioButton.Group>
              </View>
            )}

          {product.modifierGroups &&
            Array.isArray(product.modifierGroups) &&
            product.modifierGroups.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Modificadores</Text>
                {product.modifierGroups.map((group: ModifierGroup) => (
                  <View key={group.id} style={styles.modifierGroup}>
                    <View style={styles.modifierGroupHeader}>
                      <Text style={styles.groupTitle}>{group.name}</Text>
                      {group.isRequired ? (
                        <Text style={styles.requiredText}>Obligatorio</Text>
                      ) : (
                        <Text style={styles.optionalText}>Opcional</Text>
                      )}
                    </View>
                    {group.minSelection !== undefined &&
                      group.maxSelection !== undefined && (
                        <Text style={styles.selectionRules}>
                          {group.minSelection === 0 && group.maxSelection === 1
                            ? "Puedes elegir hasta 1 opción"
                            : group.minSelection === group.maxSelection
                              ? `Debes elegir ${group.maxSelection}`
                              : `Mín. ${group.minSelection}, máx. ${group.maxSelection}`}
                        </Text>
                      )}

                    {group.allowMultipleSelections ? (
                      <>
                        {Array.isArray(group.productModifiers) &&
                          group.productModifiers.map((modifier: Modifier) => {
                            const groupModifiers =
                              selectedModifiersByGroup[group.id] || [];
                            const isSelected = groupModifiers.some(
                              (mod) => mod.id === modifier.id
                            );

                            return (
                              <View
                                key={modifier.id}
                                style={styles.optionContainer}
                              >
                                <TouchableRipple
                                  onPress={() =>
                                    handleModifierToggle(modifier, group)
                                  }
                                  style={styles.optionTouchable}
                                >
                                  <View style={styles.optionRow}>
                                    <View style={styles.checkbox}>
                                      <Checkbox
                                        status={
                                          isSelected ? "checked" : "unchecked"
                                        }
                                        onPress={() =>
                                          handleModifierToggle(modifier, group)
                                        }
                                      />
                                    </View>
                                    {/* optionContent ahora solo contiene el título */}
                                    <View style={styles.optionContent}>
                                      <Text style={styles.modifierTitle}>
                                        {modifier.name}
                                      </Text>
                                    </View>
                                    {/* Mover el precio fuera de optionContent y aplicar marginLeft: 'auto' */}
                                    {Number(modifier.price) > 0 && (
                                      <Text style={styles.modifierPrice}>
                                        +${Number(modifier.price).toFixed(2)}
                                      </Text>
                                    )}
                                  </View>
                                </TouchableRipple>
                                <Divider style={styles.optionDivider} />
                              </View>
                            );
                          })}
                      </>
                    ) : (
                      <RadioButton.Group
                        onValueChange={(value) => {
                          const modifier = group.productModifiers.find(
                            (m: Modifier) => m.id === value
                          );
                          if (modifier) {
                            handleModifierToggle(modifier, group);
                          }
                        }}
                        value={
                          selectedModifiersByGroup[group.id]?.[0]?.id || ""
                        }
                      >
                        {Array.isArray(group.productModifiers) &&
                          group.productModifiers.map((modifier: Modifier) => (
                            <View
                              key={modifier.id}
                              style={styles.optionContainer}
                            >
                              {/* Mover el precio fuera del RadioButton.Item y aplicar marginLeft: 'auto' */}
                              <View style={styles.optionRow}>
                                <RadioButton.Item
                                  label={modifier.name}
                                  labelStyle={styles.modifierTitle}
                                  value={modifier.id}
                                  position="leading"
                                  style={styles.radioItem} // radioItem debe tener flex: 1 para empujar el precio
                                />
                                {Number(modifier.price) > 0 && (
                                  <Text style={styles.modifierPrice}>
                                    +${Number(modifier.price).toFixed(2)}
                                  </Text>
                                )}
                              </View>
                              <Divider style={styles.optionDivider} />
                            </View>
                          ))}
                      </RadioButton.Group>
                    )}
                  </View>
                ))}
              </View>
            )}

          {/* Sección Cantidad - Estilo OrderCartDetail */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cantidad</Text>
            <View style={styles.quantityContainer}>
              <IconButton
                icon="minus-circle-outline"
                size={32} // Tamaño similar a OrderCartDetail
                onPress={decreaseQuantity}
                style={styles.quantityIconButton}
                disabled={quantity <= 1} // Deshabilitar si la cantidad es 1
              />
              <Text style={styles.quantityText}>{quantity}</Text>
              <IconButton
                icon="plus-circle-outline"
                size={32} // Tamaño similar a OrderCartDetail
                onPress={increaseQuantity}
                style={styles.quantityIconButton}
              />
            </View>
          </View>

          {/* Sección Notas de Preparación - Integrada como en OrderCartDetail */}
          <View style={styles.section}>
            {/* Eliminar título de sección separado */}
            {/* <View style={styles.sectionTitleContainer}>...</View> */}
            <Controller
              control={control}
              name="preparationNotes"
              render={({ field: { onChange, onBlur, value } }) => (
                <SpeechRecognitionInput
                  key="preparation-notes-input"
                  // Usar el label del propio componente
                  label="Notas de Preparación (Opcional)"
                  value={value}
                  onChangeText={onChange}
                  // onBlur={onBlur}
                  // multiline
                  // numberOfLines={3}
                  style={styles.preparationInput}
                  speechLang="es-MX"
                  // placeholder="Ej. Sin cebolla, extra picante..." // Eliminar placeholder redundante
                />
              )}
            />
          </View>

          {/* Sección Resumen - Estilo OrderCartDetail */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resumen</Text>
            <View style={styles.summaryRow}>
              <Text>Precio base:</Text>
              <Text>${basePrice.toFixed(2)}</Text>
            </View>
            {selectedModifiers.length > 0 && (
              <View style={styles.summaryRow}>
                <Text>Modificadores:</Text>
                <Text>${modifiersPrice.toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text>Cantidad:</Text>
              <Text>{quantity}</Text>
            </View>
            {/* Divider opcional si se quiere separar el total */}
            {/* <Divider style={styles.divider} /> */}
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>${totalPrice.toFixed(2)}</Text>
            </View>
          </View>
        </ScrollView>

        {/* Footer Button - Estilo OrderCartDetail */}
        <View style={styles.footer}>
          <Button
            mode="contained"
            onPress={handleAddToCart}
            style={styles.confirmButton} // Usar estilo de OrderCartDetail
            icon="cart-plus"
            // Podrías agregar lógica de disabled si es necesario
            // disabled={!isValidSelection()}
          >
            Agregar al Carrito {/* Texto simplificado */}
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};
const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    modalContent: {
      backgroundColor: theme.colors.background,
      width: "100%",
      height: "100%",
      margin: 0,
      padding: 0,
      position: "absolute",
      top: 0,
      left: 0,
    },
    // Estilos del Appbar
    appBar: {
      backgroundColor: theme.colors.elevation.level2, // Coincidir con OrderHeader
    },
    appBarTitle: { // Estilo para el TÍTULO dentro de Appbar.Content
      ...theme.fonts.titleMedium, // Fuente consistente con OrderHeader
      color: theme.colors.onSurface,
      fontWeight: 'bold', // Añadir negritas al título
      // textAlign: 'center', // El centrado lo maneja appBarContent
      // flex: 1, // Quitar flex para permitir centrado vertical por appBarContent
    },
    appBarContent: { // Contenedor del título
      flex: 1, // Ocupar espacio disponible para centrar
      justifyContent: 'center', // Centrar verticalmente el contenido (título)
      alignItems: 'center', // Centrar horizontalmente el contenido (título)
      // marginLeft: -48, // Compensar el botón de back si es necesario (ajustar)
    },
    appBarSpacer: { // Espaciador para equilibrar el botón de retroceso
      width: 48, // Ancho estándar de IconButton
    },
    // --- Fin estilos Appbar ---
    modifierGroup: {
      marginBottom: theme.spacing.s,
    },
    modifierGroupHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 2,
    },
    groupTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: theme.colors.onSurface,
    },
    groupDescription: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    requiredText: {
      fontSize: 12,
      color: theme.colors.error,
      fontWeight: "500",
    },
    optionalText: {
      fontSize: 12,
      color: theme.colors.primary,
      fontWeight: "500",
    },
    selectionRules: {
      fontSize: 10,
      color: theme.colors.onSurfaceVariant,
      marginBottom: theme.spacing.xs,
      fontStyle: "italic",
    },
    // title: { // Estilo obsoleto, reemplazado por appBarTitle
    //   flex: 1,
    //   fontSize: 22,
    //   textAlign: "center",
    //   fontWeight: "bold",
    //   color: theme.colors.primary,
    //   marginHorizontal: 40,
    // },
    productImage: {
      height: 150,
      borderRadius: theme.roundness,
      marginBottom: theme.spacing.m,
    },
    imagePlaceholder: {
      backgroundColor: theme.colors.surfaceVariant,
      justifyContent: "center",
      alignItems: "center",
    },
    placeholderText: {
      fontSize: 50,
      color: theme.colors.onSurfaceVariant,
    },
    scrollView: {
      flex: 1,
      padding: theme.spacing.m,
    },
    section: {
      marginBottom: theme.spacing.s,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: theme.spacing.s,
      color: theme.colors.primary,
    },
    optionContainer: {
      marginBottom: 2,
    },
    optionTouchable: {
      paddingVertical: 4,
    },
    optionRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      paddingVertical: 8,
    },
    optionContent: { // Contenedor solo para el título del modificador (Checkbox)
      flex: 1, // Ocupa el espacio restante
      justifyContent: "center", // Centra verticalmente el texto si es necesario
      // Quitar justifyContent: 'space-between'
      // alignItems: "center", // Ya está en optionRow
      // paddingRight: 8, // No necesario si el precio está fuera
    },
    checkbox: {
      marginRight: 8,
    },
    optionDivider: {
      height: 1,
      backgroundColor: theme.colors.outlineVariant,
    },
    radioItem: {
      flex: 1,
      paddingVertical: 4,
    },
    modifierTitle: {
      fontSize: 16,
      fontWeight: "500",
      color: theme.colors.onSurface, // Color estándar para texto
    },
    variantPrice: { // Estilo específico para precio de variante
      fontSize: 14,
      fontWeight: "bold",
      color: theme.colors.onSurfaceVariant, // Color secundario consistente
      marginLeft: "auto",
      marginRight: 8,
    },
    modifierPrice: { // Estilo para precio de modificador (Checkbox y Radio)
      fontSize: 14,
      fontWeight: "bold",
      color: theme.colors.onSurfaceVariant, // Color secundario consistente
      marginLeft: 'auto', // Empujar a la derecha
      paddingHorizontal: 8, // Añadir padding similar a variantPrice
    },
    quantityContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center", // Mantener una sola instancia
      // alignItems: "center", // Eliminar duplicado
      marginVertical: theme.spacing.s, // Añadir espacio vertical
    },
    quantityIconButton: { // Estilo para IconButton de cantidad
      margin: 0, // Quitar margen por defecto
      // backgroundColor: theme.colors.surfaceVariant, // Fondo sutil opcional - Eliminado para mayor consistencia si no se usa en OrderCartDetail
      borderRadius: 18, // Hacerlo circular
    },
    quantityText: { // Estilo consistente con OrderCartDetail
      fontSize: 18, // Tamaño de fuente
      fontWeight: 'bold',
      minWidth: 40, // Ancho mínimo
      textAlign: 'center',
      marginHorizontal: theme.spacing.s, // Margen horizontal
      color: theme.colors.onSurface,
    },
    // Estilos de Resumen - Consistentes con OrderCartDetail
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.xs, // Añadir padding horizontal
    },
    totalRow: { // Estilo adicional para la fila del total
      marginTop: theme.spacing.s,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      paddingTop: theme.spacing.s,
    },
    totalLabel: { // Estilo consistente con OrderCartDetail
      fontWeight: "bold",
      fontSize: 18,
      color: theme.colors.onSurface,
    },
    totalValue: { // Estilo consistente con OrderCartDetail para el TOTAL FINAL
      fontWeight: "bold",
      fontSize: 18,
      color: theme.colors.primary, // Color primario para el total final
    },
    // Estilos de Footer y Botón - Consistentes con OrderCartDetail
    footer: {
      padding: theme.spacing.m,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface, // Fondo consistente
    },
    confirmButton: { // Reemplaza addButton
      paddingVertical: theme.spacing.s, // Padding consistente
      // width: "100%", // Ya es el comportamiento por defecto del botón en un View
    },
    // Estilo para SpeechRecognitionInput (una sola línea)
    preparationInput: {
      // backgroundColor: theme.colors.surfaceVariant, // Opcional: mantener fondo
      marginVertical: theme.spacing.xs,
      textAlignVertical: 'center', // Intentar centrar verticalmente el placeholder/texto
      // minHeight: 80, // Eliminar altura mínima, ya no es multilínea
    },
    // Eliminar estilos no usados
    // sectionTitleContainer: { ... },
    // sectionTitleOptional: { ... },
    divider: { // Estilo de Divider si se usa
      marginVertical: theme.spacing.s,
      backgroundColor: theme.colors.outlineVariant,
    },
  });

export default ProductCustomizationModal;