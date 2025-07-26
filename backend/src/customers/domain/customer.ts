import { Address } from './address';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export class Customer {
  id: string;
  firstName: string | null;
  lastName: string | null;
  whatsappPhoneNumber: string;
  stripeCustomerId: string | null;
  email: string | null;
  birthDate: Date | null;
  fullChatHistory: ChatMessage[] | null;
  relevantChatHistory: ChatMessage[] | null;
  lastInteraction: Date | null;
  totalOrders: number;
  totalSpent: number;
  isActive: boolean;
  isBanned: boolean;
  bannedAt: Date | null;
  banReason: string | null;
  addresses: Address[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
