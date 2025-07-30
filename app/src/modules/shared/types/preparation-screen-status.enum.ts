// app/src/modules/shared/types/preparation-screen-status.enum.ts

export enum PreparationScreenStatus {
  PENDING = 'PENDING',
  IN_PREPARATION = 'IN_PREPARATION', 
  READY = 'READY',
}

export const PreparationScreenStatusColors = {
  [PreparationScreenStatus.PENDING]: '#FFA726', // Naranja - esperando
  [PreparationScreenStatus.IN_PREPARATION]: '#42A5F5', // Azul - en preparación
  [PreparationScreenStatus.READY]: '#66BB6A', // Verde - listo
} as const;

export const PreparationScreenStatusLabels = {
  [PreparationScreenStatus.PENDING]: 'Pendiente',
  [PreparationScreenStatus.IN_PREPARATION]: 'En preparación',
  [PreparationScreenStatus.READY]: 'Listo',
} as const;