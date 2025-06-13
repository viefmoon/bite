export interface CustomerDeliveryInfo {
  id?: string;
  customerId: string;
  streetAddress: string;
  neighborhood?: string;
  postalCode?: string;
  city: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  pickupName?: string;
  additionalDetails?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CloudCustomer {
  id?: string;
  phoneNumber: string;
  deliveryInfo?: CustomerDeliveryInfo;
  lastInteraction?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}