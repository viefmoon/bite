export interface WhatsAppMessage {
  from: string;
  type: 'text' | 'interactive' | 'audio' | 'image' | 'document';
  id: string;
  timestamp: string;
  text?: { body: string };
  interactive?: {
    type: string;
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string };
  };
  audio?: { id: string };
  context?: { id: string };
}

export interface WebhookEntry {
  changes: Array<{
    value: {
      messages?: WhatsAppMessage[];
      metadata?: {
        display_phone_number: string;
        phone_number_id: string;
      };
    };
  }>;
}

export interface WebhookBody {
  object: string;
  entry: WebhookEntry[];
}