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
  phoneNumber: string;
  whatsappPhoneNumber: string | null; // Número de WhatsApp único
  email: string | null;
  birthDate: Date | null;
  fullChatHistory: ChatMessage[] | null; // Historial completo de conversaciones
  relevantChatHistory: ChatMessage[] | null; // Historial relevante/resumido
  lastInteraction: Date | null; // Última interacción con el cliente
  totalOrders: number; // Total de pedidos realizados
  totalSpent: number; // Total gastado
  isActive: boolean; // Cliente activo
  isBanned: boolean; // Si el cliente está baneado
  bannedAt: Date | null; // Fecha de baneo
  banReason: string | null; // Razón del baneo
  addresses: Address[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
