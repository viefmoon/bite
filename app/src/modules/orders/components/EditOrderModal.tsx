// src/modules/orders/components/EditOrderModal.tsx
import React, { useState, useMemo, useEffect } from "react";
import { View, ScrollView, StyleSheet, ActivityIndicator } from "react-native"; // Añadir ActivityIndicator
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
  Appbar,
} from "react-native-paper";
import { useAppTheme, AppTheme } from "@/app/styles/theme";
import { Order, OrderTypeEnum, type OrderType } from "../types/orders.types";
import { CartItem, CartItemModifier } from "../context/CartContext";
import { useGetAreas } from "@/modules/areasTables/services/areaService";
import AnimatedLabelSelector from "@/app/components/common/AnimatedLabelSelector";
import SpeechRecognitionInput from "@/app/components/common/SpeechRecognitionInput";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import ConfirmationModal from "@/app/components/common/ConfirmationModal";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useGetTablesByArea } from "@/modules/areasTables/services/tableService";
import type { Table } from "@/modules/areasTables/types/areasTables.types";
import { useGetOrderByIdQuery } from "../hooks/useOrdersQueries"; // Importar hook
import { getApiErrorMessage } from "@/app/lib/errorMapping"; // Importar para errores

// ... (interfaces OrderItemDtoForBackend, UpdateOrderPayload) ...
export interface UpdateOrderPayload {
  orderType?: OrderType;
  items?: OrderItemDtoForBackend[];
  tableId?: string | null;
  scheduledAt?: Date | null;
  customerName?: string;
  phoneNumber?: string;
  deliveryAddress?: string;
  notes?: string | null;
  status?: Order['orderStatus'];
  total?: number;
}
interface OrderItemDtoForBackend {
  id?: string;
  productId: string;
  productVariantId?: string | null;
  quantity: number;
  basePrice: number;
  finalPrice: number;
  preparationNotes?: string | null;
}


interface EditOrderModalProps {
  visible: boolean;
  orderId: string | null; // Cambiado de 'order' a 'orderId'
  onSaveChanges: (orderId: string, payload: UpdateOrderPayload) => Promise<void>;
  onClose: () => void;
}

const EditOrderModal: React.FC<EditOrderModalProps> = ({
  visible,
  orderId, // Usar orderId
  onSaveChanges,
  onClose,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  

  // --- Fetching Order Details ---
  const {
      data: orderData, // Renombrado para claridad
      isLoading: isLoadingOrder,
      isError: isErrorOrder,
      error: errorOrder,
      refetch: refetchOrder, // Para reintentar si falla
  } = useGetOrderByIdQuery(orderId, { enabled: visible && !!orderId });

  // Estados para los campos editables
  const [orderType, setOrderType] = useState<OrderType>(OrderTypeEnum.DINE_IN);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [areaMenuVisible, setAreaMenuVisible] = useState(false);
  const [tableMenuVisible, setTableMenuVisible] = useState(false);
  const [areaError, setAreaError] = useState<string | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);
  const [scheduledTime, setScheduledTime] = useState<Date | null>(null);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerNameError, setCustomerNameError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [addressError, setAddressError] = useState<string | null>(null);
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [isTimeAlertVisible, setTimeAlertVisible] = useState(false);
  const [currentItems, setCurrentItems] = useState<CartItem[]>([]);
  

  // --- Carga de datos relacionados (Áreas, Mesas) ---
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

  // --- Efecto para inicializar el estado del formulario cuando los datos de la orden cargan ---
  useEffect(() => {
    if (!orderId || !visible) {
      // Reset when modal is closed or no order selected
      if (!visible) {
        setOrderType(OrderTypeEnum.DINE_IN);
        setSelectedAreaId(null);
        setSelectedTableId(null);
        setScheduledTime(null);
        setCustomerName('');
        setPhoneNumber('');
        setDeliveryAddress('');
        setOrderNotes('');
        setCurrentItems([]);
      }
      return;
    }
    
    if (orderData && !isLoadingOrder) { // Only process when data is loaded
      
      // Set form fields
      setOrderType(orderData.orderType);
      setSelectedTableId(orderData.tableId ?? null);
      setScheduledTime(orderData.scheduledAt ? new Date(orderData.scheduledAt) : null);
      setCustomerName(orderData.customerName ?? '');
      setPhoneNumber(orderData.phoneNumber ?? '');
      setDeliveryAddress(orderData.deliveryAddress ?? '');
      setOrderNotes(orderData.notes ?? '');
      
      // Map orderItems to the expected format
      if (orderData.orderItems && Array.isArray(orderData.orderItems)) {
        const mappedItems: CartItem[] = orderData.orderItems.map((item: any) => {
          const mappedItem: CartItem = {
            id: item.id,
            productId: item.productId,
            productName: item.product?.name || 'Producto desconocido',
            quantity: Number(item.quantity) || 1,
            unitPrice: parseFloat(item.basePrice || '0'),
            totalPrice: parseFloat(item.finalPrice || '0'), // finalPrice ya incluye la cantidad
            modifiers: (item.modifiers || []).map((mod: any) => ({
              id: mod.id,
              name: mod.productModifier?.name || mod.name || 'Modificador',
              price: parseFloat(mod.price || '0'),
            })),
            variantId: item.productVariantId || undefined,
            variantName: item.productVariant?.name || undefined,
            preparationNotes: item.preparationNotes || undefined,
          };
          return mappedItem;
        });
        setCurrentItems(mappedItems);
      } else {
        setCurrentItems([]);
      }
    }
  }, [orderData, isLoadingOrder, orderId, visible]); // Add visible to dependencies

  // --- Lógica para manejar cambios en tipo de orden (sin cambios) ---
   useEffect(() => {
     setAreaError(null);
     setTableError(null);
     setCustomerNameError(null);
     setPhoneError(null);
     setAddressError(null);
     // Note: This effect should NOT clear form fields when editing an existing order
     // Only clear fields when orderType changes due to user interaction
   }, [orderType]);

  // --- Lógica para calcular totales (sin cambios) ---
  const subtotal = useMemo(() => currentItems.reduce((sum, item) => sum + item.totalPrice, 0), [currentItems]);
  const total = useMemo(() => subtotal, [subtotal]);

  // --- Funciones para manejar selectores y time picker (sin cambios) ---
  const selectedAreaName = useMemo(() => areasData?.find((a: any) => a.id === selectedAreaId)?.name, [areasData, selectedAreaId]);
  const selectedTableName = useMemo(() => tablesData?.find((t) => t.id === selectedTableId)?.name, [tablesData, selectedTableId]);
  const showTimePicker = () => setTimePickerVisible(true);
  const hideTimePicker = () => setTimePickerVisible(false);
  const handleTimeConfirm = (date: Date) => { /* ... */ const now = new Date(); now.setSeconds(0, 0); date.setSeconds(0, 0); if (date < now) { hideTimePicker(); setTimeAlertVisible(true); } else { setScheduledTime(date); hideTimePicker(); } };
  const formattedScheduledTime = useMemo(() => { /* ... */ if (!scheduledTime) return null; try { return format(scheduledTime, "p", { locale: es }); } catch (error) { console.error("Error formatting time:", error); return "Hora inválida"; } }, [scheduledTime]);

  // --- Lógica para añadir/editar/eliminar items (sin cambios) ---
  const handleAddItem = () => { console.log("TODO: Añadir item"); };
  const handleRemoveItem = (itemId: string) => setCurrentItems(prev => prev.filter(item => item.id !== itemId));
  const handleUpdateItemQuantity = (itemId: string, newQuantity: number) => {
    console.log('[EditOrderModal] Updating quantity for item:', itemId, 'to:', newQuantity);
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    
    setCurrentItems(prev => {
      const updated = prev.map(item => {
        if (item.id === itemId) {
          const modifiersPrice = item.modifiers.reduce((sum, mod) => sum + mod.price, 0);
          const newTotalPrice = (item.unitPrice + modifiersPrice) * newQuantity;
          return {
            ...item,
            quantity: newQuantity,
            totalPrice: newTotalPrice
          };
        }
        return item;
      });
      console.log('[EditOrderModal] Updated items:', updated);
      return updated;
    });
  };

  // --- Lógica para guardar cambios ---
  const handleSaveChanges = async () => {
    if (!orderId) return; // Usar orderId en lugar de order

    // Resetear errores
    setAreaError(null); setTableError(null); setCustomerNameError(null); setPhoneError(null); setAddressError(null);

    let isValid = true;
    // Validaciones (sin cambios, usan estados locales)
    if (orderType === OrderTypeEnum.DINE_IN) { if (!selectedAreaId) { setAreaError("Debe seleccionar un área"); isValid = false; } if (!selectedTableId) { setTableError("Debe seleccionar una mesa"); isValid = false; } } else if (orderType === OrderTypeEnum.TAKE_AWAY) { if (!customerName || customerName.trim() === '') { setCustomerNameError("El nombre del cliente es obligatorio"); isValid = false; } } else if (orderType === OrderTypeEnum.DELIVERY) { if (!deliveryAddress || deliveryAddress.trim() === '') { setAddressError("La dirección es obligatoria para Domicilio"); isValid = false; } if (!phoneNumber || phoneNumber.trim() === '') { setPhoneError("El teléfono es obligatorio para Domicilio"); isValid = false; } }
    if (!isValid) return;

    // Mapear items
    console.log('[EditOrderModal] Current items before mapping:', currentItems);
    const itemsForBackend: OrderItemDtoForBackend[] = currentItems.map(item => ({
      id: item.id,
      productId: item.productId,
      productVariantId: item.variantId || null,
      quantity: item.quantity,
      basePrice: Number(item.unitPrice),
      finalPrice: Number(item.unitPrice), // finalPrice should be unit price, not total/quantity
      preparationNotes: item.preparationNotes || null, // Use preparationNotes, not notes
    }));
    console.log('[EditOrderModal] Items for backend:', itemsForBackend);

    // Calculate new total based on current items
    const newTotal = currentItems.reduce((sum, item) => sum + item.totalPrice, 0);
    
    // Construir payload (comparar con orderData de la query)
    const updatePayload: UpdateOrderPayload = {
      orderType: orderType !== orderData?.orderType ? orderType : undefined,
      items: itemsForBackend,
      tableId: orderType === OrderTypeEnum.DINE_IN ? selectedTableId : null,
      scheduledAt: scheduledTime,
      customerName: orderType === OrderTypeEnum.TAKE_AWAY ? customerName : undefined,
      phoneNumber: (orderType === OrderTypeEnum.TAKE_AWAY || orderType === OrderTypeEnum.DELIVERY) ? phoneNumber : undefined,
      deliveryAddress: orderType === OrderTypeEnum.DELIVERY ? deliveryAddress : undefined,
      notes: orderNotes !== orderData?.notes ? orderNotes : undefined,
      total: newTotal, // Add total to update
    };

    // Filtrar payload (sin cambios)
    const filteredPayload = Object.entries(updatePayload).reduce((acc, [key, value]) => { if (value !== undefined) { acc[key as keyof UpdateOrderPayload] = value; } return acc; }, {} as Partial<UpdateOrderPayload>);
    
    console.log('[EditOrderModal] Final payload being sent:', filteredPayload);

    try {
        await onSaveChanges(orderId, filteredPayload); // Usar orderId
        onClose();
    } catch (error) {
        console.error("Error guardando cambios:", error);
    }
  };

  // --- Renderizado ---
  const renderFields = () => { /* ... (sin cambios internos, usa estados locales) ... */
     switch (orderType) {
       case OrderTypeEnum.DINE_IN:
         return (
           <>
             {/* Área y Mesa */}
             <View style={styles.dineInSelectorsRow}>
               <View style={styles.dineInSelectorContainer}>
                 {/* Selector Área */}
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
                   {areasData?.map((area: any) => ( <Menu.Item key={area.id} onPress={() => { setSelectedAreaId(area.id); setSelectedTableId(null); setAreaMenuVisible(false); setAreaError(null); }} title={area.name} /> ))}
                   {errorAreas && ( <Menu.Item title="Error al cargar áreas" disabled /> )}
                 </Menu>
                 {areaError && !errorAreas && ( <HelperText type="error" visible={true} style={styles.helperTextFix}>{areaError}</HelperText> )}
                 {errorAreas && ( <HelperText type="error" visible={true} style={styles.helperTextFix}>Error al cargar áreas</HelperText> )}
               </View>
               <View style={styles.dineInSelectorContainer}>
                 {/* Selector Mesa */}
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
                   {tablesData?.map((table: Table) => ( <Menu.Item key={table.id} onPress={() => { setSelectedTableId(table.id); setTableMenuVisible(false); setTableError(null); }} title={table.name} /> ))}
                   {selectedAreaId && tablesData?.length === 0 && !isLoadingTables && !errorTables && ( <Menu.Item title="No hay mesas" disabled /> )}
                   {errorTables && ( <Menu.Item title="Error al cargar mesas" disabled /> )}
                 </Menu>
                 {tableError && !errorTables && ( <HelperText type="error" visible={true} style={styles.helperTextFix}>{tableError}</HelperText> )}
                 {errorTables && ( <HelperText type="error" visible={true} style={styles.helperTextFix}>Error al cargar mesas</HelperText> )}
               </View>
             </View>
             {/* Notas */}
             <View style={[styles.sectionCompact, styles.fieldContainer]}>
               <SpeechRecognitionInput key="notes-input-dine-in" label="Notas de la Orden (Opcional)" value={orderNotes} onChangeText={setOrderNotes} multiline speechLang="es-MX" />
             </View>
             {/* Programar Hora */}
             <View style={[styles.sectionCompact, styles.fieldContainer]}>
               <AnimatedLabelSelector label="Programar Hora (Opcional)" value={formattedScheduledTime} onPress={showTimePicker} onClear={() => setScheduledTime(null)} />
             </View>
           </>
         );
       case OrderTypeEnum.TAKE_AWAY:
         return (
           <>
             {/* Nombre Cliente */}
             <View style={[styles.sectionCompact, styles.fieldContainer]}>
               <SpeechRecognitionInput key="customer-name-input" label="Nombre del Cliente *" value={customerName} onChangeText={(text) => { setCustomerName(text); if (customerNameError) setCustomerNameError(null); }} error={!!customerNameError} speechLang="es-MX" />
               {customerNameError && ( <HelperText type="error" visible={true} style={styles.helperTextFix}>{customerNameError}</HelperText> )}
             </View>
             {/* Teléfono */}
             <View style={[styles.sectionCompact, styles.fieldContainer]}>
               <SpeechRecognitionInput key="phone-input-takeaway" label="Teléfono (Opcional)" value={phoneNumber} onChangeText={(text) => { setPhoneNumber(text); if (phoneError) setPhoneError(null); }} keyboardType="phone-pad" error={!!phoneError} speechLang="es-MX" />
               {phoneError && ( <HelperText type="error" visible={true} style={styles.helperTextFix}>{phoneError}</HelperText> )}
             </View>
             {/* Notas */}
             <View style={[styles.sectionCompact, styles.fieldContainer]}>
               <SpeechRecognitionInput key="notes-input-takeaway" label="Notas de la Orden (Opcional)" value={orderNotes} onChangeText={setOrderNotes} multiline speechLang="es-MX" />
             </View>
             {/* Programar Hora */}
             <View style={[styles.sectionCompact, styles.fieldContainer]}>
               <AnimatedLabelSelector label="Programar Hora Recolección (Opcional)" value={formattedScheduledTime} onPress={showTimePicker} onClear={() => setScheduledTime(null)} />
             </View>
           </>
         );
       case OrderTypeEnum.DELIVERY:
         return (
           <>
             {/* Dirección */}
             <View style={[styles.sectionCompact, styles.fieldContainer]}>
               <SpeechRecognitionInput key="address-input-delivery" label="Dirección de Entrega *" value={deliveryAddress} onChangeText={(text) => { setDeliveryAddress(text); if (addressError) setAddressError(null); }} error={!!addressError} speechLang="es-MX" multiline />
               {addressError && ( <HelperText type="error" visible={true} style={styles.helperTextFix}>{addressError}</HelperText> )}
             </View>
             {/* Teléfono */}
             <View style={[styles.sectionCompact, styles.fieldContainer]}>
               <SpeechRecognitionInput key="phone-input-delivery" label="Teléfono *" value={phoneNumber} onChangeText={(text) => { setPhoneNumber(text); if (phoneError) { setPhoneError(null); } }} keyboardType="phone-pad" error={!!phoneError} speechLang="es-MX" />
               {phoneError && ( <HelperText type="error" visible={true} style={styles.helperTextFix}>{phoneError}</HelperText> )}
             </View>
             {/* Notas */}
             <View style={[styles.sectionCompact, styles.fieldContainer]}>
               <SpeechRecognitionInput key="notes-input-delivery" label="Notas de la Orden (Opcional)" value={orderNotes} onChangeText={setOrderNotes} multiline speechLang="es-MX" />
             </View>
             {/* Programar Hora */}
             <View style={[styles.sectionCompact, styles.fieldContainer]}>
               <AnimatedLabelSelector label="Programar Hora Entrega (Opcional)" value={formattedScheduledTime} onPress={showTimePicker} onClear={() => setScheduledTime(null)} />
             </View>
           </>
         );
       default:
         return null;
     }
  };

  // Mostrar loading o error si la query principal está en esos estados
  if (isLoadingOrder) {
      return (
          <Portal>
              <Modal visible={visible} onDismiss={onClose} contentContainerStyle={[styles.modalContent, styles.centeredContent]}>
                  <ActivityIndicator animating={true} size="large" />
                  <Text style={styles.loadingText}>Cargando detalles de la orden...</Text>
              </Modal>
          </Portal>
      );
  }

  if (isErrorOrder) {
      return (
          <Portal>
              <Modal visible={visible} onDismiss={onClose} contentContainerStyle={[styles.modalContent, styles.centeredContent]}>
                  <Text style={styles.errorText}>Error al cargar la orden: {getApiErrorMessage(errorOrder)}</Text>
                  <Button onPress={() => refetchOrder()}>Reintentar</Button>
                  <Button onPress={onClose} style={{marginTop: 10}}>Cerrar</Button>
              </Modal>
          </Portal>
      );
  }

  // Si no hay datos después de cargar (poco probable si no hubo error, pero por si acaso)
  if (!orderData) {
       return (
          <Portal>
              <Modal visible={visible} onDismiss={onClose} contentContainerStyle={[styles.modalContent, styles.centeredContent]}>
                  <Text>No se encontraron datos para esta orden.</Text>
                   <Button onPress={onClose} style={{marginTop: 10}}>Cerrar</Button>
              </Modal>
          </Portal>
      );
  }


  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={styles.modalContent}
      >
        <View style={styles.container}>
          <Appbar.Header style={styles.appBar} elevated>
            <Appbar.BackAction onPress={onClose} />
            <Appbar.Content 
              title={`Editar Orden #${orderData.dailyNumber} - ${format(new Date(orderData.createdAt), 'dd/MM/yyyy', { locale: es })}`} 
              titleStyle={styles.appBarTitle} 
            />
          </Appbar.Header>

          <ScrollView style={styles.scrollView}>
            {/* Selección Tipo de Orden */}
            <View style={styles.sectionCompact}>
              <RadioButton.Group onValueChange={(newValue) => setOrderType(newValue as OrderType)} value={orderType}>
                <View style={styles.radioGroupHorizontal}>
                  <RadioButton.Item label="COMER AQUÍ" value={OrderTypeEnum.DINE_IN} style={styles.radioButtonItem} labelStyle={styles.radioLabel} position="leading"/>
                  <RadioButton.Item label="PARA LLEVAR" value={OrderTypeEnum.TAKE_AWAY} style={styles.radioButtonItem} labelStyle={styles.radioLabel} position="leading"/>
                  <RadioButton.Item label="DOMICILIO" value={OrderTypeEnum.DELIVERY} style={styles.radioButtonItem} labelStyle={styles.radioLabel} position="leading"/>
                </View>
              </RadioButton.Group>
            </View>

            {/* Campos dinámicos */}
            {renderFields()}
            <Divider style={styles.divider} />

            {/* Lista de Items */}
            <List.Section title="Productos">
              {currentItems.length === 0 && !isLoadingOrder && (
                <Text style={{ padding: theme.spacing.m, textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
                  No hay productos en esta orden
                </Text>
              )}
              {currentItems.map((item, index) => (
                <List.Item
                  key={item.id || `item-${index}`}
                  title={`${item.quantity}x ${item.productName}${item.variantName ? ` (${item.variantName})` : ''}`}
                  description={
                    item.modifiers.length > 0
                      ? item.modifiers.map(m => m.name).join(', ')
                      : item.preparationNotes || undefined
                  }
                  descriptionNumberOfLines={2}
                  right={() => (
                    <View style={styles.itemActionsContainer}>
                      <View style={styles.quantityActions}>
                        <IconButton
                          icon="minus-circle-outline"
                          size={24}
                          onPress={() => handleUpdateItemQuantity(item.id, item.quantity - 1)}
                          style={styles.quantityButton}
                          disabled={item.quantity <= 1}
                        />
                        <Text style={styles.quantityText}>{item.quantity}</Text>
                        <IconButton
                          icon="plus-circle-outline"
                          size={24}
                          onPress={() => handleUpdateItemQuantity(item.id, item.quantity + 1)}
                          style={styles.quantityButton}
                        />
                      </View>
                      <Text style={styles.itemPrice}>${item.totalPrice.toFixed(2)}</Text>
                      <IconButton
                        icon="delete-outline"
                        size={24}
                        onPress={() => handleRemoveItem(item.id)}
                        style={styles.deleteButton}
                        iconColor={theme.colors.error}
                      />
                    </View>
                  )}
                  style={styles.listItem}
                />
              ))}
              <Button onPress={handleAddItem} mode="outlined" style={{marginTop: 10}}>Añadir Producto</Button>
            </List.Section>

            <Divider style={styles.divider} />

            {/* Totales */}
            <View style={styles.totalsContainer}>
              <Text style={styles.totalsText}>Subtotal:</Text>
              <Text style={styles.totalsValue}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.totalsContainer}>
              <Text style={[styles.totalsText, styles.totalLabel]}>Total:</Text>
              <Text style={[styles.totalsValue, styles.totalValue]}>${total.toFixed(2)}</Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Button mode="contained" onPress={handleSaveChanges} style={styles.confirmButton}>
              Guardar Cambios
            </Button>
          </View>
        </View>

        {/* Modals auxiliares */}
        <DateTimePickerModal isVisible={isTimePickerVisible} mode="time" minimumDate={new Date()} onConfirm={handleTimeConfirm} onCancel={hideTimePicker} date={scheduledTime || new Date()} locale="es_ES" minuteInterval={15} />
        <ConfirmationModal visible={isTimeAlertVisible} title="Hora Inválida" message="No puedes seleccionar una hora que ya ha pasado. Por favor, elige una hora futura." confirmText="Entendido" onConfirm={() => setTimeAlertVisible(false)} />
      </Modal>
    </Portal>
  );
};

// Reutilizar estilos (adaptados)
const createStyles = (theme: AppTheme) => StyleSheet.create({
    modalContent: { backgroundColor: theme.colors.background, width: "100%", height: "100%", margin: 0, padding: 0, position: "absolute", top: 0, left: 0, },
    container: { flex: 1, backgroundColor: theme.colors.background, },
    appBar: { backgroundColor: theme.colors.elevation.level2, },
    appBarTitle: { ...theme.fonts.titleMedium, color: theme.colors.onSurface, fontWeight: 'bold', },
    scrollView: { flex: 1, paddingHorizontal: theme.spacing.s, },
    sectionCompact: { marginBottom: 0, paddingBottom: 0, },
    radioGroupHorizontal: { flexDirection: "row", justifyContent: "space-around", alignItems: "center", width: "100%", paddingVertical: theme.spacing.xs, },
    radioButtonItem: { paddingHorizontal: 0, paddingVertical: 4, flexShrink: 1, flex: 1, marginHorizontal: 2, },
    radioLabel: { marginLeft: 0, fontSize: 11, textTransform: "uppercase", textAlign: 'center', },
    dineInSelectorsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 0, gap: theme.spacing.s, marginTop: theme.spacing.s, },
    dineInSelectorContainer: { flex: 1, },
    fieldContainer: { marginTop: theme.spacing.s, },
    helperTextFix: { marginTop: -6, marginBottom: 0, paddingHorizontal: 12, },
    divider: { marginVertical: theme.spacing.s, },
    listItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: theme.spacing.s, paddingHorizontal: theme.spacing.s, },
    itemActionsContainer: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", flex: 1, },
    quantityActions: { flexDirection: "row", alignItems: "center", },
    quantityButton: { marginHorizontal: 0, },
    quantityText: { fontSize: 14, fontWeight: 'bold', minWidth: 20, textAlign: 'center', marginHorizontal: 2, },
    itemPrice: { alignSelf: "center", marginRight: theme.spacing.s, color: theme.colors.onSurfaceVariant, fontSize: 14, fontWeight: 'bold', minWidth: 55, textAlign: "right", },
    deleteButton: { margin: 0, marginLeft: theme.spacing.s, },
    totalsContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: theme.spacing.xs, paddingHorizontal: theme.spacing.xs, },
    totalsText: { fontSize: 16, },
    totalsValue: { fontSize: 16, fontWeight: "bold", },
    totalLabel: { fontWeight: "bold", fontSize: 18, },
    totalValue: { fontSize: 18, color: theme.colors.primary, },
    footer: { padding: theme.spacing.m, borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surface, },
    confirmButton: { paddingVertical: theme.spacing.xs, },
    centeredContent: { // Estilo para centrar contenido de carga/error
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.l,
    },
    loadingText: {
        marginTop: theme.spacing.m,
    },
    errorText: {
        color: theme.colors.error,
        textAlign: 'center',
        marginBottom: theme.spacing.m,
    },
});

export default EditOrderModal;