import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';

import { patientAuthGuard } from './patient-auth.guard';
import { PatientAuthService } from '../services/patient-auth.service';

function configureAndRun(isAuthenticated: boolean) {
  const parseUrlSpy = jasmine.createSpy('parseUrl').and.callFake((url: string) => url as any);

  TestBed.configureTestingModule({
    providers: [
      { provide: PatientAuthService, useValue: { isAuthenticated: () => isAuthenticated } },
      { provide: Router, useValue: { parseUrl: parseUrlSpy } },
    ],
  });

  const result = TestBed.runInInjectionContext(() =>
    patientAuthGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
  );
  return { result, parseUrlSpy };
}

describe('patientAuthGuard', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('returns true when the patient is authenticated', () => {
    const { result } = configureAndRun(true);
    expect(result).toBeTrue();
  });

  it('calls router.parseUrl with /patient-portal/login when not authenticated', () => {
    const { result, parseUrlSpy } = configureAndRun(false);
    expect(parseUrlSpy).toHaveBeenCalledWith('/patient-portal/login');
    expect(result).toBe('/patient-portal/login');
  });
});
