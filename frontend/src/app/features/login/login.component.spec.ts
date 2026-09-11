import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';

describe('LoginComponent', () => {
  let authServiceStub: { login: jasmine.Spy };
  let routerStub: { navigateByUrl: jasmine.Spy };

  beforeEach(async () => {
    authServiceStub = { login: jasmine.createSpy('login') };
    routerStub = { navigateByUrl: jasmine.createSpy('navigateByUrl') };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authServiceStub },
        { provide: Router, useValue: routerStub },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('logs in and navigates to dashboard when login() is called', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    fixture.componentInstance.login();
    expect(authServiceStub.login).toHaveBeenCalled();
    expect(routerStub.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('calls login() when the button is clicked', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    button.click();
    fixture.detectChanges();
    expect(authServiceStub.login).toHaveBeenCalled();
    expect(routerStub.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });
});
