import apiClient from '@/app/services/apiClient';
import { API_PATHS } from '@/app/constants/apiPaths';

export interface ShiftStatus {
  OPEN: 'OPEN';
  CLOSED: 'CLOSED';
}

export interface Shift {
  id: string;
  date: string;
  globalShiftNumber: number;
  shiftNumber: number;
  status: keyof ShiftStatus;
  openedAt: string;
  closedAt: string | null;
  openedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  closedBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  initialCash: number;
  finalCash: number | null;
  totalSales: number | null;
  totalOrders: number | null;
  cashDifference: number | null;
  expectedCash?: number | null;
  notes: string | null;
  closeNotes: string | null;
}

export interface OpenShiftDto {
  initialCash: number;
  notes?: string;
  date?: string;
}

export interface CloseShiftDto {
  finalCash: number;
  closeNotes?: string;
}

class ShiftsService {
  /**
   * Obtener el turno actual
   */
  async getCurrentShift(): Promise<Shift | null> {
    try {
      const response = await apiClient.get(API_PATHS.SHIFTS_CURRENT);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Abrir un nuevo turno
   */
  async openShift(data: OpenShiftDto): Promise<Shift> {
    const response = await apiClient.post(API_PATHS.SHIFTS_OPEN, data);

    if (!response.ok) {
      throw (
        response.data ||
        response.originalError ||
        new Error('Error al abrir el turno')
      );
    }

    return response.data;
  }

  /**
   * Cerrar el turno actual
   */
  async closeShift(data: CloseShiftDto): Promise<Shift> {
    const response = await apiClient.post(API_PATHS.SHIFTS_CLOSE, data);

    if (!response.ok) {
      throw (
        response.data ||
        response.originalError ||
        new Error('Error al cerrar el turno')
      );
    }

    return response.data;
  }

  /**
   * Obtener historial de turnos
   */
  async getHistory(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<Shift[]> {
    const queryParams = new URLSearchParams();

    if (params?.startDate) {
      queryParams.append('startDate', params.startDate);
    }
    if (params?.endDate) {
      queryParams.append('endDate', params.endDate);
    }

    const url = queryParams.toString()
      ? `${API_PATHS.SHIFTS_HISTORY}?${queryParams.toString()}`
      : API_PATHS.SHIFTS_HISTORY;

    const response = await apiClient.get(url);
    return response.data;
  }

  /**
   * Obtener un turno por ID
   */
  async getById(id: string): Promise<Shift> {
    const response = await apiClient.get(
      API_PATHS.SHIFTS_DETAIL.replace(':id', id),
    );
    return response.data;
  }

  /**
   * Verificar si hay un turno abierto
   */
  async isShiftOpen(): Promise<boolean> {
    const currentShift = await this.getCurrentShift();
    return currentShift !== null && currentShift.status === 'OPEN';
  }
}

export const shiftsService = new ShiftsService();
