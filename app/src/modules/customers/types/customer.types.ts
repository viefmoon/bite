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
  interiorNumber?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  deliveryInstructions?: string;
  latitude?: number;
  longitude?: number;
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
  whatsappPhoneNumber: string;
  stripeCustomerId?: string | null;
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

export interface FindAllCustomersQuery {
  firstName?: string;
  lastName?: string;
  email?: string;
  whatsappPhoneNumber?: string;
  isActive?: boolean;
  isBanned?: boolean;
  lastInteractionAfter?: Date;
  page?: number;
  limit?: number;
}
