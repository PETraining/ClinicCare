import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';

import { PatientsListComponent } from './patients-list.component';
import { PatientService } from '../../core/services/patient.service';
import { Patient } from '../../core/models/patient.model';

describe('PatientsListComponent', () => {
  let patientServiceStub: { patients: ReturnType<typeof signal<Patient[]>>; search: jasmine.Spy };

  beforeEach(async () => {
    patientServiceStub = {
      patients: signal<Patient[]>([]),
      search: jasmine.createSpy('search'),
    };

    await TestBed.configureTestingModule({
      imports: [PatientsListComponent],
      providers: [
        provideRouter([]),
        { provide: PatientService, useValue: patientServiceStub },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(PatientsListComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('calls search() with no args on init', () => {
    const fixture = TestBed.createComponent(PatientsListComponent);
    fixture.detectChanges();
    expect(patientServiceStub.search).toHaveBeenCalledWith();
  });

  it('onSearch calls search() with the trimmed term when set', () => {
    const fixture = TestBed.createComponent(PatientsListComponent);
    fixture.detectChanges();
    fixture.componentInstance.searchTerm = 'Jane';
    fixture.componentInstance.onSearch();
    expect(patientServiceStub.search).toHaveBeenCalledWith('Jane');
  });

  it('onSearch calls search() with undefined when the term is empty', () => {
    const fixture = TestBed.createComponent(PatientsListComponent);
    fixture.detectChanges();
    fixture.componentInstance.searchTerm = '';
    fixture.componentInstance.onSearch();
    expect(patientServiceStub.search).toHaveBeenCalledWith(undefined);
  });

  it('invokes onSearch() when the search button is clicked', () => {
    const fixture = TestBed.createComponent(PatientsListComponent);
    fixture.detectChanges();
    patientServiceStub.search.calls.reset();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.search-bar button');
    button.click();
    expect(patientServiceStub.search).toHaveBeenCalled();
  });

  it('renders a row per patient', () => {
    patientServiceStub.patients.set([
      { PatientId: 1, Name: 'Jane Doe', DOB: '1990-01-01', Gender: 'F' },
      { PatientId: 2, Name: 'John Roe', DOB: '1985-05-05', Gender: 'M' },
    ]);
    const fixture = TestBed.createComponent(PatientsListComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('tbody tr').length).toBe(2);
    expect(compiled.textContent).toContain('Jane Doe');
  });

  it('renders the empty state row when there are no patients', () => {
    const fixture = TestBed.createComponent(PatientsListComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No patients found.');
  });
});
