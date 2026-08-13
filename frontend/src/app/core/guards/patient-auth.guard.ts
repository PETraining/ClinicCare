import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { PatientAuthService } from '../services/patient-auth.service';

export const patientAuthGuard: CanActivateFn = () => {
  const patientAuth = inject(PatientAuthService);
  const router = inject(Router);

  if (patientAuth.isAuthenticated()) {
    return true;
  }
  return router.parseUrl('/patient-portal/login');
};
