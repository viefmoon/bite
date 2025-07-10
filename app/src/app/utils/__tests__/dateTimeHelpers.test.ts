import {
  safeTimeStringToDate,
  safeDateToTimeString,
  createScheduledDateTime,
  roundMinutesToFive,
  parseDateFromBackend,
  getNextAvailableTime,
} from '../dateTimeHelpers';

describe('dateTimeHelpers', () => {
  describe('safeTimeStringToDate', () => {
    it('debe convertir string de hora a Date correctamente', () => {
      const result = safeTimeStringToDate('14:30');
      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(30);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it('debe lanzar error con formato inválido', () => {
      expect(() => safeTimeStringToDate('14:30:00')).toThrow();
      expect(() => safeTimeStringToDate('25:00')).toThrow();
      expect(() => safeTimeStringToDate('14:60')).toThrow();
    });

    it('debe usar fecha base si se proporciona', () => {
      const baseDate = new Date('2024-01-15');
      const result = safeTimeStringToDate('10:00', baseDate);
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(0); // Enero
      expect(result.getDate()).toBe(15);
    });
  });

  describe('safeDateToTimeString', () => {
    it('debe convertir Date a string HH:mm', () => {
      const date = new Date();
      date.setHours(9, 5);
      expect(safeDateToTimeString(date)).toBe('09:05');

      date.setHours(23, 59);
      expect(safeDateToTimeString(date)).toBe('23:59');
    });

    it('debe lanzar error con fecha inválida', () => {
      expect(() => safeDateToTimeString(new Date('invalid'))).toThrow();
    });
  });

  describe('roundMinutesToFive', () => {
    it('debe redondear minutos correctamente', () => {
      expect(roundMinutesToFive(0)).toBe(0);
      expect(roundMinutesToFive(2)).toBe(0);
      expect(roundMinutesToFive(3)).toBe(5);
      expect(roundMinutesToFive(7)).toBe(5);
      expect(roundMinutesToFive(8)).toBe(10);
      expect(roundMinutesToFive(12)).toBe(10);
      expect(roundMinutesToFive(13)).toBe(15);
      expect(roundMinutesToFive(57)).toBe(55);
      expect(roundMinutesToFive(58)).toBe(60);
    });
  });

  describe('parseDateFromBackend', () => {
    it('debe parsear fechas ISO correctamente', () => {
      const isoString = '2024-01-15T14:30:00.000Z';
      const result = parseDateFromBackend(isoString);
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe(isoString);
    });

    it('debe retornar null para valores inválidos', () => {
      expect(parseDateFromBackend(null)).toBeNull();
      expect(parseDateFromBackend(undefined)).toBeNull();
      expect(parseDateFromBackend('')).toBeNull();
      expect(parseDateFromBackend('invalid-date')).toBeNull();
    });
  });

  describe('getNextAvailableTime', () => {
    it('debe obtener siguiente hora disponible redondeada', () => {
      const mockNow = new Date('2024-01-15T14:22:00');
      jest.spyOn(global, 'Date').mockImplementation(() => mockNow);

      const result = getNextAvailableTime(30);

      // Debe ser al menos 30 minutos en el futuro
      expect(result.getTime()).toBeGreaterThan(mockNow.getTime());

      // Los minutos deben estar redondeados a múltiplo de 5
      expect(result.getMinutes() % 5).toBe(0);

      // No debe tener segundos ni milisegundos
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);

      (global.Date as any).mockRestore();
    });
  });
});
