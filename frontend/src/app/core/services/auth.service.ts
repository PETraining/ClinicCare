import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'referraliq_demo_user';
const DEMO_USER = 'Dr. Rohan Sharma';

@Injectable({ providedIn: 'root' })
export class AuthService {
  isAuthenticated = signal<boolean>(!!localStorage.getItem(STORAGE_KEY));
  currentUser = signal<string | null>(localStorage.getItem(STORAGE_KEY));

  login(): void {
    localStorage.setItem(STORAGE_KEY, DEMO_USER);
    this.currentUser.set(DEMO_USER);
    this.isAuthenticated.set(true);
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }
}
