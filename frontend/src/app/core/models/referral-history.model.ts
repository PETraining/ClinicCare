export interface ReferralStatusHistory {
  HistoryId: number;
  ReferralId: number;
  OldStatus: string;
  NewStatus: string;
  ChangedAt: string;
  Reason: string | null;
}
