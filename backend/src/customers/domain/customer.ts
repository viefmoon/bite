import { Address } from './address';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export class Customer {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  email: string | null;
  birthDate: Date | null;
  fullChatHistory: ChatMessage[] | null; // Historial completo de conversaciones
  relevantChatHistory: ChatMessage[] | null; // Historial relevante/resumido
  lastInteraction: Date | null; // Última interacción con el cliente
  totalOrders: number; // Total de pedidos realizados
  totalSpent: number; // Total gastado
  isActive: boolean; // Cliente activo
  addresses: Address[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
