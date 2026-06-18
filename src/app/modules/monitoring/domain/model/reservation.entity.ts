export type ReservationStatus = 'pending' | 'active' | 'completed' | 'cancelled';

export interface Reservation {
  id: string;
  code: string;
  parkingId: string;
  spotId: string;
  date: string;
  startTime: string;
  duration: number; // in hours
  totalAmount: number;
  baseAmount?: number;
  status: ReservationStatus;
}
