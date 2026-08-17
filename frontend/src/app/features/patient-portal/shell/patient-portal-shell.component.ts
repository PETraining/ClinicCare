import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { PatientAuthService } from '../../../core/services/patient-auth.service';

@Component({
  selector: 'app-patient-portal-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './patient-portal-shell.component.html',
  styleUrl: './patient-portal-shell.component.css',
})
export class PatientPortalShellComponent {
  protected auth = inject(PatientAuthService);
  private router = inject(Router);

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/patient-portal/login']);
  }
}
