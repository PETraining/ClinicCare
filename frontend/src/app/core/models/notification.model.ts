export type NotificationEventType = 'Submitted' | 'Accepted' | 'Rejected' | 'Completed' | 'AuthorizationUpdated';

export interface NotificationEvent {
  NotificationId: number;
  ReferralId: number;
  EventType: NotificationEventType;
  Timestamp: string;
  Message: string;
}
