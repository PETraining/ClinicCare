import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { PatientContextService } from '../services/patient-context.service';

export const patientSelectedGuard: CanActivateFn = () => {
  const ctx = inject(PatientContextService);
  const router = inject(Router);

  if (ctx.patientId() !== null) {
    return true;
  }
  return router.parseUrl('/select-patient');
};
