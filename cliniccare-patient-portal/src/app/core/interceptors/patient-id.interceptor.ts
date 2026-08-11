import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { PatientContextService } from '../services/patient-context.service';

export const patientIdInterceptor: HttpInterceptorFn = (req, next) => {
  const ctx = inject(PatientContextService);
  const id = ctx.patientId();
  if (id === null) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { 'X-Patient-Id': String(id) } }));
};
