import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

import { PatientContextService } from '../core/services/patient-context.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent {
  private ctx = inject(PatientContextService);
  private router = inject(Router);

  get currentPatientName(): string | null {
    return this.ctx.currentPatientName;
  }

  switchPatient(): void {
    this.ctx.clear();
    this.router.navigate(['/select-patient']);
  }
}
