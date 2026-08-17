import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { PatientAuthService } from '../services/patient-auth.service';

export const patientAuthGuard: CanActivateFn = () => {
  const auth = inject(PatientAuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? true : router.parseUrl('/patient-portal/login');
};
