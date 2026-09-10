import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

import { ReferralService } from '../../../core/services/referral.service';
import { ReferralHistoryService } from '../../../core/services/referral-history.service';
import { Referral, ReferralStatus } from '../../../core/models/referral.model';
import { ReferralStatusHistory } from '../../../core/models/referral-history.model';

@Component({
  selector: 'app-patient-referral-progress',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-referral-progress.component.html',
  styleUrls: ['./patient-referral-progress.component.css'],
})
export class PatientReferralProgressComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private referralService = inject(ReferralService);
  private historyService = inject(ReferralHistoryService);

  referral: Referral | null = null;
  history = this.historyService.history;
  nextStepsMessage = '';

  ngOnInit(): void {
    const referralId = this.route.snapshot.params['referralId'];
    this.loadReferral(referralId);
    this.loadHistory(referralId);
  }

  private loadReferral(referralId: number): void {
    this.referralService.get(referralId).subscribe((r) => {
      this.referral = r;
      this.updateNextStepsMessage(r.Status);
    });
  }

  private loadHistory(referralId: number): void {
    this.historyService.loadForReferral(referralId);
  }

  private updateNextStepsMessage(status: ReferralStatus): void {
    const messages: Record<ReferralStatus, string> = {
      'Draft': 'This referral is in draft. Submit it to send to the specialist.',
      'Submitted': 'Your referral has been submitted. Awaiting specialist review.',
      'Accepted': 'The specialist has accepted your referral. An appointment will be scheduled soon.',
      'Rejected': 'The specialist has declined this referral. Please contact your referring doctor for next steps.',
      'Completed': 'This referral has been completed. Thank you for using our service.',
    };
    this.nextStepsMessage = messages[status] || 'Status unknown.';
  }
}
