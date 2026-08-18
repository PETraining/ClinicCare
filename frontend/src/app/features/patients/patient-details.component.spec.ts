import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { PatientDetailsComponent } from './patient-details.component';
import { PatientService } from '../../core/services/patient.service';
import { DocumentService } from '../../core/services/document.service';
import { LabService } from '../../core/services/lab.service';
import { PatientDetail } from '../../core/models/patient.model';

function makePatientDetail(overrides: Partial<PatientDetail> = {}): PatientDetail {
  return {
    PatientId: 7,
    Name: 'Jane Doe',
    DOB: '1990-01-01',
    Gender: 'F',
    allergies: [],
    conditions: [],
    medications: [],
    ...overrides,
  };
}

function configure(paramId: string, patientServiceStub: unknown, documentServiceStub: unknown, labServiceStub: unknown) {
  return TestBed.configureTestingModule({
    imports: [PatientDetailsComponent],
    providers: [
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: { paramMap: of(convertToParamMap({ id: paramId })) },
      },
      { provide: PatientService, useValue: patientServiceStub },
      { provide: DocumentService, useValue: documentServiceStub },
      { provide: LabService, useValue: labServiceStub },
    ],
  }).compileComponents();
}

describe('PatientDetailsComponent', () => {
  let patientServiceStub: { selected: ReturnType<typeof signal<PatientDetail | null>>; loadById: jasmine.Spy };
  let documentServiceStub: { documents: ReturnType<typeof signal<unknown[]>>; loadByPatient: jasmine.Spy; loadByReferral: jasmine.Spy };
  let labServiceStub: { orders: ReturnType<typeof signal<unknown[]>>; loadOrders: jasmine.Spy };

  beforeEach(() => {
    patientServiceStub = {
      selected: signal<PatientDetail | null>(null),
      loadById: jasmine.createSpy('loadById'),
    };
    documentServiceStub = {
      documents: signal<unknown[]>([]),
      loadByPatient: jasmine.createSpy('loadByPatient'),
      loadByReferral: jasmine.createSpy('loadByReferral'),
    };
    labServiceStub = {
      orders: signal<unknown[]>([]),
      loadOrders: jasmine.createSpy('loadOrders'),
    };
  });

  it('should create and load patient by id from the route', async () => {
    await configure('7', patientServiceStub, documentServiceStub, labServiceStub);
    const fixture = TestBed.createComponent(PatientDetailsComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.patientId()).toBe(7);
    expect(patientServiceStub.loadById).toHaveBeenCalledWith(7);
  });

  it('does not call loadById when id resolves to 0', async () => {
    await configure('', patientServiceStub, documentServiceStub, labServiceStub);
    const fixture = TestBed.createComponent(PatientDetailsComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.patientId()).toBe(0);
    expect(patientServiceStub.loadById).not.toHaveBeenCalled();
  });

  it('shows loading state while no patient is selected', async () => {
    await configure('7', patientServiceStub, documentServiceStub, labServiceStub);
    const fixture = TestBed.createComponent(PatientDetailsComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Loading patient...');
  });

  it('renders patient details with allergies, conditions, and medications', async () => {
    await configure('7', patientServiceStub, documentServiceStub, labServiceStub);
    patientServiceStub.selected.set(
      makePatientDetail({
        allergies: [{ AllergyId: 1, PatientId: 7, Substance: 'Peanuts', Severity: 'High' }],
        conditions: [{ ConditionId: 1, PatientId: 7, Name: 'Asthma', DiagnosedDate: '2020-01-01' }],
        medications: [{ MedicationId: 1, PatientId: 7, Name: 'Albuterol', Dosage: '2 puffs', Active: true }],
      }),
    );
    const fixture = TestBed.createComponent(PatientDetailsComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Jane Doe');
    expect(compiled.textContent).toContain('Peanuts');
    expect(compiled.textContent).toContain('Asthma');
    expect(compiled.textContent).toContain('Albuterol');
    expect(compiled.textContent).not.toContain('(inactive)');
  });

  it('renders empty-state messages when there are no allergies, conditions, or medications', async () => {
    await configure('7', patientServiceStub, documentServiceStub, labServiceStub);
    patientServiceStub.selected.set(makePatientDetail());
    const fixture = TestBed.createComponent(PatientDetailsComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No known allergies.');
    expect(compiled.textContent).toContain('No chronic conditions on record.');
    expect(compiled.textContent).toContain('No medications on record.');
  });

  it('marks inactive medications', async () => {
    await configure('7', patientServiceStub, documentServiceStub, labServiceStub);
    patientServiceStub.selected.set(
      makePatientDetail({
        medications: [{ MedicationId: 1, PatientId: 7, Name: 'Old Drug', Dosage: '1 pill', Active: false }],
      }),
    );
    const fixture = TestBed.createComponent(PatientDetailsComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('(inactive)');
  });
});
