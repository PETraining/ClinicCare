import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { DEMO_PATIENTS, PatientContextService } from '../../core/services/patient-context.service';

@Component({
  selector: 'app-patient-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-select.component.html',
  styleUrl: './patient-select.component.css',
})
export class PatientSelectComponent {
  private ctx = inject(PatientContextService);
  private router = inject(Router);

  patients = DEMO_PATIENTS;

  select(id: number): void {
    this.ctx.select(id);
    this.router.navigate(['/documents']);
  }
}
