export type NotificationEventType = 'Submitted' | 'Accepted' | 'Rejected' | 'Completed';

export interface NotificationEvent {
  NotificationId: number;
  ReferralId: number;
  EventType: NotificationEventType;
  Timestamp: string;
  Message: string;
  PatientId: number | null;
  Read: boolean;
}
