import React, { useState, useMemo, useEffect } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import {
  Text,
  Divider,
  List,
  Button,
  RadioButton,
  HelperText,
  Menu,
  IconButton,
  Modal,
  Portal,
} from "react-native-paper";
import { useAppTheme } from "@/app/styles/theme";
import { OrderTypeEnum, type OrderType } from "../types/orders.types"; // Importar OrderTypeEnum y el tipo OrderType
import { useGetAreas } from "@/modules/areasTables/services/areaService";
import OrderHeader from "./OrderHeader";
import AnimatedLabelSelector from "@/app/components/common/AnimatedLabelSelector";
import SpeechRecognitionInput from "@/app/components/common/SpeechRecognitionInput";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import ConfirmationModal from "@/app/components/common/ConfirmationModal";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useGetTablesByArea } from "@/modules/areasTables/services/tableService";
import type { Table } from "@/modules/areasTables/types/areasTables.types";
import { useCart, CartItem } from "../context/CartContext"; // Importar CartItem
import { useAuthStore } from "@/app/store/authStore"; // Importar authStore

// Definir la estructura esperada para los items en el DTO de backend
interface OrderItemDtoForBackend {
  productId: string;
  productVariantId?: string | null;
  quantity: number;
  basePrice: number;
  finalPrice: number;
  preparationNotes?: string | null;
}

// Definir la estructura completa del payload para onConfirmOrder (y exportarla)
export interface OrderDetailsForBackend {
  userId: string; // Añadido
  orderType: OrderType;
  subtotal: number; // Añadido
  total: number; // Añadido
  items: OrderItemDtoForBackend[];
  tableId?: string;
  scheduledAt?: Date;
  customerName?: string;
  phoneNumber?: string;
  deliveryAddress?: string;
  notes?: string;
}

interface OrderCartDetailProps {
  visible: boolean;
  onConfirmOrder: (details: OrderDetailsForBackend) => void;
  onClose?: () => void;
}

const OrderCartDetail: React.FC<OrderCartDetailProps> = ({
  visible,
  onConfirmOrder,
  onClose,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  // Obtener estado del carrito Y del formulario desde el contexto
  const {
    items, removeItem, updateItemQuantity, subtotal, total, isCartVisible, clearCart,
    orderType, setOrderType,
    selectedAreaId, setSelectedAreaId,
    selectedTableId, setSelectedTableId,
    scheduledTime, setScheduledTime,
    customerName, setCustomerName,
    phoneNumber, setPhoneNumber,
    deliveryAddress, setDeliveryAddress,
    orderNotes, setOrderNotes,
  } = useCart();
  const { user } = useAuthStore(); // Obtener usuario autenticado

  // Estados locales solo para UI (errores, visibilidad de menús/modales)
  const [areaMenuVisible, setAreaMenuVisible] = useState(false);
  const [tableMenuVisible, setTableMenuVisible] = useState(false);
  const [areaError, setAreaError] = useState<string | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);
  const [customerNameError, setCustomerNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  const [isTimeAlertVisible, setTimeAlertVisible] = useState(false);


  // --- Queries para Áreas y Mesas (sin cambios) ---
  const {
    data: areasData,
    isLoading: isLoadingAreas,
    error: errorAreas,
  } = useGetAreas();
  const {
    data: tablesData,
    isLoading: isLoadingTables,
    error: errorTables,
  } = useGetTablesByArea(selectedAreaId);

  // useEffect(() => { // ELIMINADO - Ya no necesitamos limpiar campos al cambiar tipo de orden
  //   // Resetear solo errores locales al cambiar tipo de orden
  //   setAreaError(null);
  //   setTableError(null);
  //   setCustomerNameError(null);
  //   setPhoneError(null);
  //   setAddressError(null);
  //   // Ya no limpiamos setSelectedAreaId, setSelectedTableId, etc.
  // }, [orderType]);

  // Limpiar errores locales al cambiar tipo de orden (más simple)
  useEffect(() => {
    setAreaError(null);
    setTableError(null);
    setCustomerNameError(null);
    setPhoneError(null);
    setAddressError(null);
  }, [orderType]);


  const handleConfirm = () => {
    setAreaError(null);
    setTableError(null);
    setCustomerNameError(null);
    setPhoneError(null);
    setAddressError(null);

    if (items.length === 0) {
      return;
    }

    let isValid = true;

    if (orderType === OrderTypeEnum.DINE_IN) { // Usar Enum
      if (!selectedAreaId) {
        setAreaError("Debe seleccionar un área");
        isValid = false;
      }
      if (!selectedTableId) {
        setTableError("Debe seleccionar una mesa");
        isValid = false;
      }
    } else if (orderType === OrderTypeEnum.TAKE_AWAY) { // Usar Enum
        if (!customerName || customerName.trim() === '') {
            setCustomerNameError("El nombre del cliente es obligatorio");
            isValid = false;
        }
        // Phone is optional for take away
    } else if (orderType === OrderTypeEnum.DELIVERY) { // Usar Enum
        // Customer name not required for delivery as per new spec
        if (!deliveryAddress || deliveryAddress.trim() === '') {
            setAddressError("La dirección es obligatoria para Domicilio");
            isValid = false;
        }
        if (!phoneNumber || phoneNumber.trim() === '') {
            setPhoneError("El teléfono es obligatorio para Domicilio");
            isValid = false;
        }
    }


    
    if (!isValid) {
      return;
    }

    
    // Mapear items del carrito al formato esperado por el DTO del backend
    const itemsForBackend: OrderItemDtoForBackend[] = items.map((item: CartItem) => ({
      productId: item.productId,
      productVariantId: item.variantId || null,
      quantity: item.quantity,
      basePrice: Number(item.unitPrice), // Asegurar que sea número
      finalPrice: Number(item.totalPrice / item.quantity), // Asegurar que sea número
      preparationNotes: item.preparationNotes || null,
      // Mapear modifiers si es necesario y la estructura del backend es diferente
    }));

    const orderDetails: OrderDetailsForBackend = {
      userId: user?.id || '', // Asegurarse de tener un userId
      orderType,
      subtotal,
      total,
      items: itemsForBackend,
      tableId: orderType === OrderTypeEnum.DINE_IN ? selectedTableId ?? undefined : undefined, // Usar Enum
      scheduledAt: scheduledTime ?? undefined,
      customerName: orderType === OrderTypeEnum.TAKE_AWAY ? customerName : undefined, // Only for TAKE_AWAY // Usar Enum
      phoneNumber: (orderType === OrderTypeEnum.TAKE_AWAY || orderType === OrderTypeEnum.DELIVERY) ? phoneNumber : undefined, // Usar Enum
      deliveryAddress: orderType === OrderTypeEnum.DELIVERY ? deliveryAddress : undefined, // Usar Enum
      notes: orderNotes || undefined,
    };

    if (!orderDetails.userId) {
        console.error("Error: Falta el ID del usuario al confirmar la orden.");
        return; // Detener el proceso si falta el userId
    }


    onConfirmOrder(orderDetails);
  };

  
  const selectedAreaName = useMemo(
    () => areasData?.find((a: any) => a.id === selectedAreaId)?.name,
    [areasData, selectedAreaId]
  );
  const selectedTableName = useMemo(
    () => tablesData?.find((t) => t.id === selectedTableId)?.name,
    [tablesData, selectedTableId]
  );

  const showTimePicker = () => setTimePickerVisible(true);
  const hideTimePicker = () => setTimePickerVisible(false);
  const handleTimeConfirm = (date: Date) => {
    const now = new Date();

    now.setSeconds(0, 0);
    date.setSeconds(0, 0);

    if (date < now) {
      hideTimePicker();
      setTimeAlertVisible(true);
      // Actualizar estado global del contexto
      setScheduledTime(date);
      hideTimePicker();
    }
  };

  const formattedScheduledTime = useMemo(() => {
    if (!scheduledTime) return null;
    try {
      return format(scheduledTime, "p", { locale: es });
    } catch (error) {
      console.error("Error formatting time:", error);
      return "Hora inválida";
    }
  }, [scheduledTime]);

  // Helper function to render fields in order
  const renderFields = () => {
    switch (orderType) {
      case OrderTypeEnum.DINE_IN: // Usar Enum
        return (
          <>
            {/* 1. Área */}
            <View style={styles.dineInSelectorsRow}>
              <View style={styles.dineInSelectorContainer}>
                <Menu
                  visible={areaMenuVisible}
                  onDismiss={() => setAreaMenuVisible(false)}
                  anchor={
                    <AnimatedLabelSelector
                      label="Área *"
                      value={selectedAreaName}
                      onPress={() => setAreaMenuVisible(true)}
                      isLoading={isLoadingAreas}
                      error={!!areaError || !!errorAreas}
                      disabled={isLoadingAreas}
                    />
                  }
                >
                  {areasData?.map((area: any) => (
                    <Menu.Item
                      key={area.id}
                      onPress={() => {
                        setSelectedAreaId(area.id);
                        setSelectedTableId(null);
                        setAreaMenuVisible(false);
                        setAreaError(null);
                      }}
                      title={area.name}
                    />
                  ))}
                  {errorAreas && (
                    <Menu.Item title="Error al cargar áreas" disabled />
                  )}
                </Menu>
                {areaError && !errorAreas && (
                  <HelperText type="error" visible={true} style={styles.helperTextFix}>
                    {areaError}
                  </HelperText>
                )}
                {errorAreas && (
                  <HelperText type="error" visible={true} style={styles.helperTextFix}>
                    Error al cargar áreas
                  </HelperText>
                )}
              </View>

              {/* 2. Mesa */}
              <View style={styles.dineInSelectorContainer}>
                <Menu
                  visible={tableMenuVisible}
                  onDismiss={() => setTableMenuVisible(false)}
                  anchor={
                    <AnimatedLabelSelector
                      label="Mesa *"
                      value={selectedTableName}
                      onPress={() => setTableMenuVisible(true)}
                      isLoading={isLoadingTables}
                      error={!!tableError || !!errorTables}
                      disabled={!selectedAreaId || isLoadingTables || isLoadingAreas}
                    />
                  }
                >
                  {tablesData?.map((table: Table) => (
                    <Menu.Item
                      key={table.id}
                      onPress={() => {
                        setSelectedTableId(table.id);
                        setTableMenuVisible(false);
                        setTableError(null);
                      }}
                      title={table.name}
                    />
                  ))}
                  {selectedAreaId && tablesData?.length === 0 && !isLoadingTables && !errorTables && (
                    <Menu.Item title="No hay mesas" disabled />
                  )}
                  {errorTables && (
                    <Menu.Item title="Error al cargar mesas" disabled />
                  )}
                </Menu>
                {tableError && !errorTables && (
                  <HelperText type="error" visible={true} style={styles.helperTextFix}>
                    {tableError}
                  </HelperText>
                )}
                {errorTables && (
                  <HelperText type="error" visible={true} style={styles.helperTextFix}>
                    Error al cargar mesas
                  </HelperText>
                )}
              </View>
            </View>

            {/* 3. Notas */}
            <View style={[styles.sectionCompact, styles.fieldContainer]}>
              <SpeechRecognitionInput
                label="Notas de la Orden (Opcional)"
                value={orderNotes}
                onChangeText={setOrderNotes}
                multiline
                speechLang="es-MX"
              />
            </View>

            {/* 4. Programar Hora */}
            <View style={[styles.sectionCompact, styles.fieldContainer]}>
              <AnimatedLabelSelector
                label="Programar Hora (Opcional)"
                value={formattedScheduledTime}
                onPress={showTimePicker}
                onClear={() => setScheduledTime(null)}
              />
            </View>
          </>
        );
      case OrderTypeEnum.TAKE_AWAY: // Usar Enum
        return (
          <>
            {/* 1. Nombre Cliente */}
            <View style={[styles.sectionCompact, styles.fieldContainer]}>
              <SpeechRecognitionInput
                label="Nombre del Cliente *"
                value={customerName}
                onChangeText={(text) => {
                  setCustomerName(text);
                  if (customerNameError) setCustomerNameError(null);
                }}
                error={!!customerNameError}
                speechLang="es-MX"
              />
              {customerNameError && (
                <HelperText type="error" visible={true} style={styles.helperTextFix}>
                  {customerNameError}
                </HelperText>
              )}
            </View>

            {/* 2. Teléfono */}
            <View style={[styles.sectionCompact, styles.fieldContainer]}>
              <SpeechRecognitionInput
                label="Teléfono (Opcional)"
                value={phoneNumber}
                onChangeText={(text) => {
                  setPhoneNumber(text);
                  if (phoneError) setPhoneError(null);
                }}
                keyboardType="phone-pad"
                error={!!phoneError} // Aunque opcional, puede tener errores de formato si se ingresa
                speechLang="es-MX"
              />
              {phoneError && (
                <HelperText type="error" visible={true} style={styles.helperTextFix}>
                  {phoneError}
                </HelperText>
              )}
            </View>

            {/* 3. Notas */}
            <View style={[styles.sectionCompact, styles.fieldContainer]}>
              <SpeechRecognitionInput
                label="Notas de la Orden (Opcional)"
                value={orderNotes}
                onChangeText={setOrderNotes}
                multiline
                speechLang="es-MX"
              />
            </View>

            {/* 4. Programar Hora */}
            <View style={[styles.sectionCompact, styles.fieldContainer]}>
              <AnimatedLabelSelector
                label="Programar Hora Recolección (Opcional)"
                value={formattedScheduledTime}
                onPress={showTimePicker}
                onClear={() => setScheduledTime(null)}
              />
            </View>
          </>
        );
      case OrderTypeEnum.DELIVERY: // Usar Enum
        return (
          <>
            {/* 1. Dirección */}
            <View style={[styles.sectionCompact, styles.fieldContainer]}>
              <SpeechRecognitionInput
                label="Dirección de Entrega *"
                value={deliveryAddress}
                onChangeText={(text) => {
                  setDeliveryAddress(text);
                  if (addressError) setAddressError(null);
                }}
                error={!!addressError}
                speechLang="es-MX"
                multiline
              />
              {addressError && (
                <HelperText type="error" visible={true} style={styles.helperTextFix}>
                  {addressError}
                </HelperText>
              )}
            </View>

            {/* 2. Teléfono */}
            <View style={[styles.sectionCompact, styles.fieldContainer]}>
              <SpeechRecognitionInput
                key="phone-input-delivery" // Key única y específica
                label="Teléfono *"
                value={phoneNumber}
                onChangeText={(text) => { // Asegurar que la función esté bien definida aquí
                  setPhoneNumber(text);
                  if (phoneError) {
                    setPhoneError(null);
                  }
                }}
                keyboardType="phone-pad"
                error={!!phoneError}
                speechLang="es-MX"
              />
              {phoneError && (
                <HelperText type="error" visible={true} style={styles.helperTextFix}>
                  {phoneError}
                </HelperText>
              )}
            </View>

            {/* 3. Notas */}
            <View style={[styles.sectionCompact, styles.fieldContainer]}>
              <SpeechRecognitionInput
                key="notes-input-delivery" // Key única y específica
                label="Notas de la Orden (Opcional)"
                value={orderNotes}
                onChangeText={setOrderNotes}
                multiline
                speechLang="es-MX"
              />
            </View>

            {/* 4. Programar Hora */}
            <View style={[styles.sectionCompact, styles.fieldContainer]}>
              <AnimatedLabelSelector
                label="Programar Hora Entrega (Opcional)"
                value={formattedScheduledTime}
                onPress={showTimePicker}
                onClear={() => setScheduledTime(null)}
              />
            </View>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={styles.modalContent}
      >
        <View style={styles.container}>
          <OrderHeader
            title="Resumen de Orden"
            onBackPress={onClose}
            itemCount={items.length}
            onCartPress={() => {}}
            isCartVisible={isCartVisible}
          />

          <ScrollView style={styles.scrollView}>
            {/* Order Type Selection */}
            <View style={styles.sectionCompact}>
              <RadioButton.Group
                onValueChange={(newValue) =>
                  setOrderType(newValue as OrderType)
                }
                value={orderType}
              >
                <View style={styles.radioGroupHorizontal}>
                  <RadioButton.Item
                    label="COMER AQUÍ"
                    value={OrderTypeEnum.DINE_IN} // Usar Enum
                    style={styles.radioButtonItem}
                    labelStyle={styles.radioLabel}
                    position="leading"
                  />
                  <RadioButton.Item
                    label="PARA LLEVAR"
                    value={OrderTypeEnum.TAKE_AWAY} // Usar Enum
                    style={styles.radioButtonItem}
                    labelStyle={styles.radioLabel}
                    position="leading"
                  />
                  <RadioButton.Item
                    label="DOMICILIO"
                    value={OrderTypeEnum.DELIVERY} // Usar Enum
                    style={styles.radioButtonItem}
                    labelStyle={styles.radioLabel}
                    position="leading"
                  />
                </View>
              </RadioButton.Group>
            </View>

            {/* Render fields based on order type */}
            {renderFields()}

            <Divider style={styles.divider} />

            {/* Cart Items */}
            <List.Section>
              {items.map((item) => {
                return (
                  <List.Item
                    key={item.id}
                    // Mover title y description a un View contenedor para controlar el ancho
                    title={() => (
                      <View style={styles.itemTextContainer}>
                        {/* Eliminar numberOfLines para permitir expansión */}
                        <Text style={styles.itemTitleText}>
                          {`${item.quantity}x ${String(item.productName ?? "")}${item.variantName ? ` (${String(item.variantName ?? "")})` : ""}`}
                        </Text>
                        {(() => { // Render description condicionalmente
                          const modifierString =
                            item.modifiers && item.modifiers.length > 0
                              ? item.modifiers.map((mod) => mod.name).join(", ")
                              : "";
                          const notesString = item.preparationNotes
                            ? `Notas: ${item.preparationNotes}`
                            : "";

                          if (modifierString && notesString) {
                            return (
                              // Comentario eliminado o corregido si es necesario
                              <Text style={styles.itemDescription}>
                                {/* Usar template literal para interpretar \n */}
                                {`${modifierString}\n${notesString}`}
                              </Text>
                            );
                          } else if (modifierString) {
                            // Comentario eliminado o corregido si es necesario
                            return <Text style={styles.itemDescription}>{modifierString}</Text>;
                          } else if (notesString) {
                            // Comentario eliminado o corregido si es necesario
                            return <Text style={styles.itemDescription}>{notesString}</Text>;
                          } else {
                            return null;
                          }
                        })()}
                      </View>
                    )}
                    // titleNumberOfLines y description ya no se usan directamente aquí
                    right={() => ( // Usar paréntesis para retorno implícito si es una sola expresión
                      <View style={styles.itemActionsContainer}>
                        <View style={styles.quantityActions}>
                          <IconButton
                            icon="minus-circle-outline"
                            size={24} // Reducir tamaño
                            onPress={() =>
                              updateItemQuantity(item.id, item.quantity - 1)
                            }
                            style={styles.quantityButton}
                            disabled={item.quantity <= 1} // Deshabilitar si es 1
                          />
                          <Text style={styles.quantityText}>{item.quantity}</Text>
                          <IconButton
                            icon="plus-circle-outline"
                            size={24} // Reducir tamaño
                            onPress={() =>
                              updateItemQuantity(item.id, item.quantity + 1)
                            }
                            style={styles.quantityButton}
                          />
                        </View>
                        <Text style={styles.itemPrice}>
                          ${item.totalPrice.toFixed(2)}
                        </Text>
                        <IconButton
                          icon="delete-outline"
                          size={24} // Reducir tamaño
                          onPress={() => removeItem(item.id)}
                          style={styles.deleteButton}
                          iconColor={theme.colors.error}
                        />
                      </View>
                    )}
                    style={styles.listItem}
                  />
                );
              })}
            </List.Section>

            <Divider style={styles.divider} />

            {/* Totals */}
            <View style={styles.totalsContainer}>
              <Text style={styles.totalsText}>Subtotal:</Text>
              <Text style={styles.totalsValue}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.totalsContainer}>
              <Text style={[styles.totalsText, styles.totalLabel]}>Total:</Text>
              <Text style={[styles.totalsValue, styles.totalValue]}>
                ${total.toFixed(2)}
              </Text>
            </View>
          </ScrollView>

          {/* Footer Button */}
          <View style={styles.footer}>
            <Button
              mode="contained"
              onPress={handleConfirm}
              disabled={
                items.length === 0 ||
                (orderType === OrderTypeEnum.DINE_IN && (!selectedAreaId || !selectedTableId)) || // Usar Enum
                (orderType === OrderTypeEnum.TAKE_AWAY && (!customerName || customerName.trim() === '')) || // Usar Enum
                (orderType === OrderTypeEnum.DELIVERY && (!deliveryAddress || deliveryAddress.trim() === '')) || // Usar Enum
                (orderType === OrderTypeEnum.DELIVERY && (!phoneNumber || phoneNumber.trim() === '')) // Usar Enum
              }
              style={styles.confirmButton}
            >
              Enviar Orden
            </Button>
          </View>
        </View>

        {/* Modals */}
        <DateTimePickerModal
          isVisible={isTimePickerVisible}
          mode="time"
          minimumDate={new Date()}
          onConfirm={handleTimeConfirm}
          onCancel={hideTimePicker}
          date={scheduledTime || new Date()}
          locale="es_ES"
          minuteInterval={15}
        />

        <ConfirmationModal
          visible={isTimeAlertVisible}
          title="Hora Inválida"
          message="No puedes seleccionar una hora que ya ha pasado. Por favor, elige una hora futura."
          confirmText="Entendido"
          onConfirm={() => setTimeAlertVisible(false)}
        />
      </Modal>
    </Portal>
  );
};


const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
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
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
      paddingHorizontal: theme.spacing.s, // Restaurar padding pequeño
    },
    divider: {
      marginVertical: theme.spacing.s,
    },
    // List Item Styles
    listItem: {
      flexDirection: 'row',           // 1) Fila
      alignItems: 'center',
      justifyContent: 'space-between',// 2) Separar título y acciones
      paddingVertical: theme.spacing.s,
      paddingHorizontal: theme.spacing.s, // controla el “gap” desde el borde
    },

    itemTextContainer: { // Contenedor para título y descripción
      flex: 1,                        // que el texto ocupe todo lo que pueda
      // paddingHorizontal: theme.spacing.m, // Eliminar padding interno, usar el del ScrollView/List.Item
      justifyContent: 'center', // Centrar texto verticalmente
      // backgroundColor: 'lightyellow', // Debug
    },
    itemTitleText: { // Estilo para el texto del título
      fontSize: 14, // Ajustar tamaño si es necesario
      fontWeight: '500',
      color: theme.colors.onSurface,
    },
    itemDescription: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    itemActionsContainer: { // Contenedor para acciones (cantidad, precio, borrar)
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",    // empuja hijos al extremo derecho
      flex: 1,                        // ocupa el espacio sobrante
      // marginLeft: 'auto', // Quitar
      // paddingRight: theme.spacing.m, // Eliminar padding interno
      // backgroundColor: 'lightblue', // Debug
    },
    quantityActions: {
      flexDirection: "row",
      alignItems: "center",
      // marginRight: theme.spacing.s, // Adjust spacing as needed
    }, // <<< COMA RESTAURADA
    // quantityButton: { // <<< ESTILO DUPLICADO/INCORRECTO ELIMINADO
    //    margin: 0,
    //    // backgroundColor: 'lightgreen',
    // },
    //   flexDirection: "row", // <<< CÓDIGO INCORRECTO ELIMINADO
    //   alignItems: "center",
    //   // marginRight: theme.spacing.xs,
    // },
    quantityButton: { // <<< ESTILO CORRECTO
        marginHorizontal: 0, // Sin margen horizontal extra en los botones
        // backgroundColor: 'lightgreen', // Debug
    }, // <<< COMA RESTAURADA
    quantityText: {
        fontSize: 14, // Reducir tamaño
        fontWeight: 'bold',
        minWidth: 20, // Reducir ancho mínimo
        textAlign: 'center',
        marginHorizontal: 2, // Reducir margen horizontal mínimo para el número
        // backgroundColor: 'pink', // Debug
    }, // <<< COMA RESTAURADA
    itemPrice: {
      alignSelf: "center",
      // marginHorizontal: 4, // Reemplazar con marginRight específico
      marginRight: theme.spacing.s, // Añadir espacio a la derecha del precio
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
      fontWeight: 'bold',
      minWidth: 55, // Reducir ancho mínimo
      textAlign: "right",
      // backgroundColor: 'lightcoral', // Debug
    }, // <<< COMA RESTAURADA
    deleteButton: {
      margin: 0, // Asegurar sin margen vertical
      marginLeft: theme.spacing.s,    // opcional: un gap extra sobre el precio
      // marginRight : 0, // No es necesario si el contenedor ya está a la derecha
      // backgroundColor: 'gold', // Debug
    }, // <<< COMA RESTAURADA
    // End List Item Styles
    totalsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: theme.spacing.xs,
      paddingHorizontal: theme.spacing.xs,
    }, // <<< COMA RESTAURADA
    totalsText: {
      fontSize: 16,
    }, // <<< COMA RESTAURADA
    totalsValue: {
      fontSize: 16,
      fontWeight: "bold",
    }, // <<< COMA RESTAURADA
    totalLabel: {
      fontWeight: "bold",
      fontSize: 18,
    }, // <<< COMA RESTAURADA
    totalValue: {
      fontSize: 18,
      color: theme.colors.primary,
    }, // <<< COMA RESTAURADA
    section: {
      marginBottom: theme.spacing.m,
      marginTop: theme.spacing.s,
    }, // <<< COMA RESTAURADA
    sectionCompact: {
      marginBottom: 0,
      paddingBottom: 0,
    }, // <<< COMA RESTAURADA
    dineInSelectorsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 0,
      gap: theme.spacing.s,
      marginTop: theme.spacing.s,
    }, // <<< COMA RESTAURADA
    dineInSelectorContainer: {
      flex: 1,
    }, // <<< COMA RESTAURADA
    selectorLoader: {
    }, // <<< COMA RESTAURADA
    sectionTitleContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: theme.spacing.xs,
    }, // <<< COMA RESTAURADA
    sectionTitle: {
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: theme.spacing.xs,
    }, // <<< COMA RESTAURADA
    sectionTitleOptional: {
      ...theme.fonts.bodySmall,
      color: theme.colors.onSurfaceVariant,
      marginLeft: theme.spacing.xs,
    }, // <<< COMA RESTAURADA
    radioGroupHorizontal: {
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
      width: "100%",
      paddingVertical: theme.spacing.xs,
    }, // <<< COMA RESTAURADA
    radioLabel: {
      marginLeft: 0,
      fontSize: 11,
      textTransform: "uppercase",
      textAlign: 'center',
    }, // <<< COMA RESTAURADA
    radioButtonItem: {
      paddingHorizontal: 0,
      paddingVertical: 4,
      flexShrink: 1,
      flex: 1,
      marginHorizontal: 2,
    }, // <<< COMA RESTAURADA
    dropdownAnchor: {
    }, // <<< COMA RESTAURADA
    dropdownContent: {
    }, // <<< COMA RESTAURADA
    dropdownLabel: {
    }, // <<< COMA RESTAURADA
    helperTextFix: {
      marginTop: -6,
      marginBottom: 0,
      paddingHorizontal: 12,
    }, // <<< COMA RESTAURADA
    errorText: {
    }, // <<< COMA RESTAURADA
    footer: {
      padding: theme.spacing.m,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
    }, // <<< COMA RESTAURADA
    confirmButton: {
      paddingVertical: theme.spacing.xs,
    }, // <<< COMA RESTAURADA
    input: {
    }, // <<< COMA RESTAURADA
    fieldContainer: {
      marginTop: theme.spacing.s,
    }, // <<< COMA RESTAURADA (Último estilo antes del cierre)
  });
export default OrderCartDetail;
