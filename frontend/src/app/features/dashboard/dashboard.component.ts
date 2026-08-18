import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ReferralService } from '../../core/services/referral.service';
import { ReferralStatus } from '../../core/models/referral.model';

const STATUSES: ReferralStatus[] = [
  'Draft',
  'Submitted',
  'Accepted',
  'Rejected',
  'Completed',
];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private referralService = inject(ReferralService);

  statuses = STATUSES;

  counts = computed(() => {
    const referrals = this.referralService.referrals();
    const byStatus: Record<string, number> = {};
    for (const status of STATUSES) {
      byStatus[status] = referrals.filter((r) => r.Status === status).length;
    }
    return byStatus;
  });

  total = computed(() => this.referralService.referrals().length);

  ngOnInit(): void {
    console.log('DashboardComponent initialized');
    this.referralService.loadAll();
  }
}
