export enum PrinterConnectionType {
  NETWORK = 'NETWORK',
  USB = 'USB',
  SERIAL = 'SERIAL',
  BLUETOOTH = 'BLUETOOTH',
}

export class ThermalPrinter {
  id: string;

  name: string;

  connectionType: PrinterConnectionType;

  ipAddress: string | null;

  port: number | null;

  path: string | null;

  isActive: boolean;

  macAddress: string | null;

  isDefaultPrinter: boolean;

  autoDeliveryPrint: boolean;

  autoPickupPrint: boolean;

  paperWidth: number;

  charactersPerLine: number;

  cutPaper: boolean;

  feedLines: number;

  createdAt: Date;

  updatedAt: Date;

  deletedAt: Date | null;
}
