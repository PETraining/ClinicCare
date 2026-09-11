import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';

const STORAGE_KEY = 'referraliq_demo_user';
const DEMO_USER = 'Dr. Rohan Sharma';

describe('AuthService', () => {
  afterEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  it('should initialize as not authenticated when localStorage is empty', () => {
    localStorage.removeItem(STORAGE_KEY);
    TestBed.configureTestingModule({});
    const service = TestBed.inject(AuthService);

    expect(service.isAuthenticated()).toBeFalse();
    expect(service.currentUser()).toBeNull();
  });

  it('should initialize as authenticated when localStorage has the demo user', () => {
    localStorage.setItem(STORAGE_KEY, DEMO_USER);
    TestBed.configureTestingModule({});
    const service = TestBed.inject(AuthService);

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.currentUser()).toBe(DEMO_USER);
  });

  it('should log in and set localStorage + signals', () => {
    localStorage.removeItem(STORAGE_KEY);
    TestBed.configureTestingModule({});
    const service = TestBed.inject(AuthService);

    service.login();

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.currentUser()).toBe(DEMO_USER);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(DEMO_USER);
  });

  it('should log out and clear localStorage + signals', () => {
    localStorage.setItem(STORAGE_KEY, DEMO_USER);
    TestBed.configureTestingModule({});
    const service = TestBed.inject(AuthService);

    service.logout();

    expect(service.isAuthenticated()).toBeFalse();
    expect(service.currentUser()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
