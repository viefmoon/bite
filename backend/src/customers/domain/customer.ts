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
  isBanned: boolean; // Si el cliente está baneado
  bannedAt: Date | null; // Fecha de baneo
  banReason: string | null; // Razón del baneo
  whatsappMessageCount: number; // Contador de mensajes de WhatsApp
  lastWhatsappMessageTime: Date | null; // Última vez que envió mensaje de WhatsApp
  addresses: Address[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
