import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';

import { PatientAuthService } from '../services/patient-auth.service';

export const patientIdInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(PatientAuthService);
  const id = auth.currentPatientId();
  if (id === null) return next(req);
  return next(req.clone({ setHeaders: { 'X-Patient-Id': String(id) } }));
};
