export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface Address {
  id: string;
  name: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  deliveryInstructions?: string;
  latitude?: number;
  longitude?: number;
  geocodedAddress?: string;
  isDefault: boolean;
  customerId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  email?: string | null;
  birthDate?: Date | null;
  fullChatHistory?: ChatMessage[] | null;
  relevantChatHistory?: ChatMessage[] | null;
  lastInteraction?: Date | null;
  totalOrders: number;
  totalSpent: number;
  isActive: boolean;
  isBanned: boolean;
  bannedAt?: Date | null;
  banReason?: string | null;
  whatsappMessageCount: number;
  lastWhatsappMessageTime?: Date | null;
  addresses: Address[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface CreateCustomerDto {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  email?: string;
  birthDate?: string;
  isActive?: boolean;
  isBanned?: boolean;
  whatsappMessageCount?: number;
  lastWhatsappMessageTime?: string;
  addresses?: CreateAddressDto[];
}

export interface UpdateCustomerDto {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string | null;
  email?: string | null;
  birthDate?: string | null;
  isActive?: boolean;
  isBanned?: boolean;
  bannedAt?: string;
  banReason?: string | null;
  whatsappMessageCount?: number;
  lastWhatsappMessageTime?: string;
  fullChatHistory?: ChatMessage[];
  relevantChatHistory?: ChatMessage[];
  lastInteraction?: string;
}

export interface CreateAddressDto {
  name: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  deliveryInstructions?: string;
  latitude?: number;
  longitude?: number;
  geocodedAddress?: string;
  isDefault?: boolean;
}

export interface UpdateAddressDto {
  name?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  deliveryInstructions?: string;
  latitude?: number;
  longitude?: number;
  geocodedAddress?: string;
  isDefault?: boolean;
}

export interface FindAllCustomersQuery {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  isActive?: boolean;
  isBanned?: boolean;
  lastInteractionAfter?: Date;
  page?: number;
  limit?: number;
}
