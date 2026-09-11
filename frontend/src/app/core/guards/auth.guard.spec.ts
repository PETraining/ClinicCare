import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';

import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj<Router>('Router', ['parseUrl']);
  });

  it('should allow activation when the user is authenticated', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { isAuthenticated: () => true } },
        { provide: Router, useValue: routerSpy },
      ],
    });

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any),
    );

    expect(result).toBeTrue();
    expect(routerSpy.parseUrl).not.toHaveBeenCalled();
  });

  it('should redirect to /login when the user is not authenticated', () => {
    const urlTree = {} as UrlTree;
    routerSpy.parseUrl.and.returnValue(urlTree);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { isAuthenticated: () => false } },
        { provide: Router, useValue: routerSpy },
      ],
    });

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any),
    );

    expect(result).toBe(urlTree);
    expect(routerSpy.parseUrl).toHaveBeenCalledWith('/login');
  });
});
