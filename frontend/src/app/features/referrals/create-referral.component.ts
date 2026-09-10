import { Component, OnInit, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';

import { DoctorService } from '../../core/services/doctor.service';
import { PatientService } from '../../core/services/patient.service';
import { ReferralService } from '../../core/services/referral.service';
import { ReferralCreate, ReferralPriority } from '../../core/models/referral.model';

@Component({
  selector: 'app-create-referral',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './create-referral.component.html',
  styleUrl: './create-referral.component.css',
})
export class CreateReferralComponent implements OnInit {
  patientService = inject(PatientService);
  doctorService = inject(DoctorService);
  private referralService = inject(ReferralService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  prefilledPatientId = toSignal(
    this.route.queryParamMap.pipe(map((params) => {
      const raw = params.get('patientId');
      return raw ? Number(raw) : undefined;
    })),
    { initialValue: undefined },
  );

  form: ReferralCreate = {
    PatientId: 0,
    ReferringDoctorId: 0,
    SpecialistId: 0,
    Reason: '',
    Priority: 'Routine' as ReferralPriority,
  };

  priorities: ReferralPriority[] = ['Routine', 'Urgent', 'Emergent'];
  errorMessage = signal<string | null>(null);
  submitting = signal(false);

  ngOnInit(): void {
    this.patientService.search();
    this.doctorService.search();
    const prefilled = this.prefilledPatientId();
    if (prefilled) {
      this.form.PatientId = prefilled;
    }
  }

  submit(): void {
    this.errorMessage.set(null);
    this.submitting.set(true);
    this.referralService.create(this.form).subscribe({
      next: (referral) => {
        this.submitting.set(false);
        this.router.navigate(['/patients/referrals'], { queryParams: { created: referral.ReferralId } });
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(err?.error?.detail ?? 'Failed to create referral.');
      },
    });
  }
}
