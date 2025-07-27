import { useState, useCallback } from 'react';
import {
  audioOrderService,
  type AIOrderItem,
} from '@/services/audioOrderService';
import { useSnackbarStore } from '@/app/store/snackbarStore';
import { Product, FullMenuModifierGroup } from '../../schema/orders.schema';
import { CartItemModifier } from '../../utils/cartUtils';

interface UseAudioOrderProps {
  menu: any;
  handleAddItem: (
    product: Product,
    quantity: number,
    selectedVariantId?: string,
    selectedModifiers?: CartItemModifier[],
    preparationNotes?: string,
    selectedPizzaCustomizations?: any[],
    pizzaExtraCost?: number,
  ) => void;
  setDeliveryInfo?: (info: any) => void;
  setOrderType?: (type: 'DELIVERY' | 'TAKE_AWAY' | 'DINE_IN') => void;
  setScheduledTime?: (time: Date | null) => void;
  cartButtonRef: React.RefObject<{ animate: () => void } | null>;
}

export const useAudioOrder = ({
  menu,
  handleAddItem,
  setDeliveryInfo,
  setOrderType,
  setScheduledTime,
  cartButtonRef,
}: UseAudioOrderProps) => {
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [audioOrderData, setAudioOrderData] = useState<any>(null);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | undefined>();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  const handleAudioRecordingComplete = useCallback(
    async (audioUri: string, transcription: string) => {
      setIsProcessingAudio(true);
      setShowAudioModal(true);
      setAudioError(undefined);

      try {
        const response = await audioOrderService.processAudioOrder(
          audioUri,
          transcription,
        );

        if (response.success && response.data) {
          setAudioOrderData(response.data);
        } else {
          setAudioError(response.error?.message || 'Error procesando la orden');
        }
      } catch (error) {
        setAudioError('Error al procesar la orden por voz');
      } finally {
        setIsProcessingAudio(false);
      }
    },
    [],
  );

  const handleAudioError = useCallback(
    (error: string) => {
      showSnackbar({
        message: error,
        type: 'error',
      });
    },
    [showSnackbar],
  );

  const handleConfirmAudioOrder = async (
    items: AIOrderItem[],
    deliveryInfo?: any,
    scheduledDelivery?: any,
    orderType?: 'DELIVERY' | 'TAKE_AWAY' | 'DINE_IN',
  ) => {
    try {
      if (!menu) {
        throw new Error('El menú no está disponible');
      }

      let addedCount = 0;
      let failedCount = 0;

      for (const item of items) {
        let foundProduct: Product | null = null;

        outer: for (const category of menu) {
          for (const subcategory of category.subcategories || []) {
            for (const product of subcategory.products || []) {
              if (product.id === item.productId) {
                foundProduct = product;
                break outer;
              }
            }
          }
        }

        if (foundProduct) {
          const selectedModifiers: CartItemModifier[] = [];
          if (item.modifiers && item.modifiers.length > 0) {
            for (const modName of item.modifiers) {
              for (const modGroup of foundProduct.modifierGroups || []) {
                const modifier = (
                  modGroup as FullMenuModifierGroup
                ).productModifiers?.find((m) => m.name === modName);
                if (modifier) {
                  selectedModifiers.push({
                    id: modifier.id,
                    modifierGroupId: modGroup.id,
                    name: modifier.name,
                    price: modifier.price || 0,
                  });
                  break;
                }
              }
            }
          }

          const pizzaCustomizations = item.pizzaCustomizations?.map((pc) => ({
            pizzaCustomizationId: pc.customizationId,
            half: pc.half as any,
            action: pc.action as any,
          }));

          handleAddItem(
            foundProduct,
            item.quantity,
            item.variantId,
            selectedModifiers,
            undefined,
            pizzaCustomizations,
            0,
          );

          addedCount++;
        } else {
          failedCount++;
        }
      }

      if (addedCount > 0 && failedCount === 0) {
        showSnackbar({
          message: `Se agregaron ${addedCount} producto${addedCount > 1 ? 's' : ''} al carrito`,
          type: 'success',
        });
      } else if (addedCount > 0 && failedCount > 0) {
        showSnackbar({
          message: `Se agregaron ${addedCount} producto${addedCount > 1 ? 's' : ''}, ${failedCount} no se encontraron`,
          type: 'warning',
        });
      } else {
        showSnackbar({
          message: 'No se pudieron agregar los productos al carrito',
          type: 'error',
        });
      }

      if (
        deliveryInfo &&
        Object.keys(deliveryInfo).length > 0 &&
        setDeliveryInfo
      ) {
        setDeliveryInfo(deliveryInfo);
      }

      if (orderType && setOrderType) {
        setOrderType(orderType);
      }

      if (scheduledDelivery && setScheduledTime) {
        // Convertir la fecha de scheduledDelivery a Date object si es necesario
        const scheduledDate =
          scheduledDelivery.date && scheduledDelivery.time
            ? new Date(`${scheduledDelivery.date}T${scheduledDelivery.time}`)
            : null;
        setScheduledTime(scheduledDate);
      }

      setShowAudioModal(false);
      setAudioOrderData(null);

      if (addedCount > 0) {
        cartButtonRef.current?.animate();
      }
    } catch (error) {
      showSnackbar({
        message: 'Error al agregar los productos al carrito',
        type: 'error',
      });
    }
  };

  return {
    showAudioModal,
    audioOrderData,
    isProcessingAudio,
    audioError,
    handleAudioRecordingComplete,
    handleAudioError,
    handleConfirmAudioOrder,
    setShowAudioModal,
    setAudioOrderData,
    setAudioError,
  };
};
