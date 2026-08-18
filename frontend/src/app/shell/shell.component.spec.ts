import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { signal } from '@angular/core';

import { ShellComponent } from './shell.component';
import { AuthService } from '../core/services/auth.service';

describe('ShellComponent', () => {
  let authServiceStub: { currentUser: ReturnType<typeof signal<string | null>>; logout: jasmine.Spy };
  let navigateByUrlSpy: jasmine.Spy;

  beforeEach(async () => {
    authServiceStub = {
      currentUser: signal<string | null>('Dr. Rohan Sharma'),
      logout: jasmine.createSpy('logout'),
    };

    await TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceStub },
      ],
    }).compileComponents();

    navigateByUrlSpy = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the current user', () => {
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.user span')?.textContent).toContain('Dr. Rohan Sharma');
  });

  it('logs out and navigates to /login when logout() is called', () => {
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();
    fixture.componentInstance.logout();
    expect(authServiceStub.logout).toHaveBeenCalled();
    expect(navigateByUrlSpy).toHaveBeenCalledWith('/login');
  });

  it('calls logout() when the log out button is clicked', () => {
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.user button');
    button.click();
    fixture.detectChanges();
    expect(authServiceStub.logout).toHaveBeenCalled();
    expect(navigateByUrlSpy).toHaveBeenCalledWith('/login');
  });

  it('renders navigation links', () => {
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const links = Array.from(compiled.querySelectorAll('nav a')).map((a) => a.getAttribute('routerLink'));
    expect(links).toEqual(['/dashboard', '/patients', '/referrals', '/documents', '/lab/orders', '/lab-tech']);
  });
});
