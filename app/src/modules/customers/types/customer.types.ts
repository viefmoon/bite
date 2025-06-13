export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface Address {
  id: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  reference?: string;
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
  addresses?: CreateAddressDto[];
}

export interface UpdateCustomerDto {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string | null;
  email?: string | null;
  birthDate?: string | null;
  isActive?: boolean;
  fullChatHistory?: ChatMessage[];
  relevantChatHistory?: ChatMessage[];
  lastInteraction?: string;
}

export interface CreateAddressDto {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  reference?: string;
  latitude?: number;
  longitude?: number;
  geocodedAddress?: string;
  isDefault?: boolean;
}

export interface UpdateAddressDto {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  reference?: string;
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
  lastInteractionAfter?: Date;
  page?: number;
  limit?: number;
}