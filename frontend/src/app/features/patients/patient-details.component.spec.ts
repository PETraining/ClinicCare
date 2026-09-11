import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { PatientDetailsComponent } from './patient-details.component';
import { PatientService } from '../../core/services/patient.service';
import { DocumentsPanelComponent } from '../documents/documents-panel.component';
import { API_BASE_URL } from '../../core/config';
import { Insurance, PatientDetail } from '../../core/models/patient.model';

describe('PatientDetailsComponent — Insurance CRUD', () => {
  let fixture: ComponentFixture<PatientDetailsComponent>;
  let component: PatientDetailsComponent;
  let httpTesting: HttpTestingController;
  let patientService: PatientService;

  const mockPatientWithInsurance = (): PatientDetail => ({
    PatientId: 1,
    Name: 'John Doe',
    DOB: '1990-01-01',
    Gender: 'Male',
    allergies: [],
    conditions: [],
    medications: [],
    insurance: [
      {
        InsuranceId: 1,
        PatientId: 1,
        InsurerName: 'Star Health',
        PolicyNumber: 'POL-123',
        GroupNumber: 'GRP-01',
        MemberId: 'MEM-456',
        EffectiveDate: '2025-01-01',
        TerminationDate: null,
      },
    ],
  });

  const mockPatientWithoutInsurance = (): PatientDetail => ({
    ...mockPatientWithInsurance(),
    insurance: [],
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientDetailsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of({ get: (key: string) => (key === 'id' ? '1' : null) }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientDetailsComponent);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    patientService = TestBed.inject(PatientService);

    fixture.detectChanges();
    const patientReq = httpTesting.expectOne(`${API_BASE_URL}/patients/1`);
    patientReq.flush(mockPatientWithInsurance());

    fixture.detectChanges(); // renders the patient view, including <app-documents-panel>
    httpTesting.expectOne(`${API_BASE_URL}/documents?patientId=1`).flush([]);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('Add Insurance — Button Visibility', () => {
    it('hides "Add Insurance" button when patient has insurance', () => {
      patientService.selected.set(mockPatientWithInsurance());
      fixture.detectChanges();

      const addBtn = fixture.nativeElement.querySelector('.insurance-add');
      expect(addBtn).toBeNull();
    });

    it('shows "Add Insurance" button when patient has no insurance', () => {
      patientService.selected.set(mockPatientWithoutInsurance());
      fixture.detectChanges();

      const addBtn = fixture.nativeElement.querySelector('.insurance-add');
      expect(addBtn).toBeTruthy();
      expect(addBtn.textContent).toContain('+ Add Insurance');
    });
  });

  describe('Add Insurance — Form Interaction', () => {
    it('startAddInsurance() resets form and shows it', () => {
      component.startAddInsurance();

      expect(component.showInsuranceForm()).toBe(true);
      expect(component.editingInsurance()).toBeNull();
      expect(component.insuranceForm.InsurerName).toBe('');
      expect(component.insuranceForm.PolicyNumber).toBe('');
      expect(component.insuranceForm.GroupNumber).toBeNull();
      expect(component.insuranceForm.MemberId).toBe('');
      expect(component.insuranceForm.EffectiveDate).toBe('');
      expect(component.insuranceForm.TerminationDate).toBeNull();
    });

    it('startAddInsurance() clears any previous errors', () => {
      component.insuranceError.set('Previous error');
      component.startAddInsurance();

      expect(component.insuranceError()).toBeNull();
    });

    it('submitInsurance() calls createInsurance() when editing is null', () => {
      spyOn(patientService, 'createInsurance').and.returnValue(of({ InsuranceId: 2 } as Insurance));
      component.insuranceForm = {
        InsurerName: 'New Insurer',
        PolicyNumber: 'NEW-POL',
        GroupNumber: null,
        MemberId: 'NEW-MEM',
        EffectiveDate: '2026-01-01',
        TerminationDate: null,
      };
      component.editingInsurance.set(null);

      component.submitInsurance();

      expect(patientService.createInsurance).toHaveBeenCalledWith(1, component.insuranceForm);
    });

    it('submitInsurance() hides form and clears state on success', () => {
      spyOn(patientService, 'createInsurance').and.returnValue(of({ InsuranceId: 2 } as Insurance));
      component.showInsuranceForm.set(true);
      component.insuranceError.set(null);

      component.submitInsurance();

      expect(component.showInsuranceForm()).toBe(false);
      expect(component.editingInsurance()).toBeNull();
    });

    it('submitInsurance() sets insuranceError on failure', () => {
      spyOn(patientService, 'createInsurance').and.returnValue(
        throwError(() => ({ error: { detail: 'Invalid data' } })),
      );
      component.insuranceForm = {
        InsurerName: 'Test',
        PolicyNumber: 'TEST',
        GroupNumber: null,
        MemberId: 'TEST',
        EffectiveDate: '2026-01-01',
        TerminationDate: null,
      };

      component.submitInsurance();

      fixture.detectChanges();
      fixture.whenStable().then(() => {
        expect(component.insuranceError()).toBe('Invalid data');
      });
    });

    it('cancelInsuranceForm() hides form and clears error', () => {
      component.showInsuranceForm.set(true);
      component.insuranceError.set('Some error');

      component.cancelInsuranceForm();

      expect(component.showInsuranceForm()).toBe(false);
      expect(component.insuranceError()).toBeNull();
    });
  });

  describe('Edit Insurance', () => {
    it('startEditInsurance() populates form with record data', () => {
      const record: Insurance = {
        InsuranceId: 1,
        PatientId: 1,
        InsurerName: 'Star Health',
        PolicyNumber: 'POL-123',
        GroupNumber: 'GRP-01',
        MemberId: 'MEM-456',
        EffectiveDate: '2025-01-01',
        TerminationDate: '2027-12-31',
      };

      component.startEditInsurance(record);

      expect(component.showInsuranceForm()).toBe(true);
      expect(component.editingInsurance()).toEqual(record);
      expect(component.insuranceForm.InsurerName).toBe('Star Health');
      expect(component.insuranceForm.PolicyNumber).toBe('POL-123');
      expect(component.insuranceForm.GroupNumber).toBe('GRP-01');
      expect(component.insuranceForm.MemberId).toBe('MEM-456');
      expect(component.insuranceForm.EffectiveDate).toBe('2025-01-01');
      expect(component.insuranceForm.TerminationDate).toBe('2027-12-31');
    });

    it('submitInsurance() calls updateInsurance() when editing is set', () => {
      const record: Insurance = {
        InsuranceId: 1,
        PatientId: 1,
        InsurerName: 'Star Health',
        PolicyNumber: 'POL-123',
        GroupNumber: null,
        MemberId: 'MEM-456',
        EffectiveDate: '2025-01-01',
        TerminationDate: null,
      };
      spyOn(patientService, 'updateInsurance').and.returnValue(of(record));
      component.editingInsurance.set(record);
      component.insuranceForm = {
        InsurerName: 'Updated Insurer',
        PolicyNumber: 'UPD-POL',
        GroupNumber: null,
        MemberId: 'MEM-456',
        EffectiveDate: '2025-01-01',
        TerminationDate: null,
      };

      component.submitInsurance();

      expect(patientService.updateInsurance).toHaveBeenCalledWith(1, 1, component.insuranceForm);
    });
  });

  describe('Delete Insurance', () => {
    it('deleteInsuranceRecord() shows confirmation with warning message', () => {
      const record: Insurance = {
        InsuranceId: 1,
        PatientId: 1,
        InsurerName: 'Star Health',
        PolicyNumber: 'POL-123',
        GroupNumber: null,
        MemberId: 'MEM-456',
        EffectiveDate: '2025-01-01',
        TerminationDate: null,
      };
      spyOn(window, 'confirm').and.returnValue(false);

      component.deleteInsuranceRecord(record);

      expect(window.confirm).toHaveBeenCalledWith('Are you sure? This patient will have no insurance on file.');
    });

    it('deleteInsuranceRecord() calls deleteInsurance() when confirmed', () => {
      const record: Insurance = {
        InsuranceId: 1,
        PatientId: 1,
        InsurerName: 'Star Health',
        PolicyNumber: 'POL-123',
        GroupNumber: null,
        MemberId: 'MEM-456',
        EffectiveDate: '2025-01-01',
        TerminationDate: null,
      };
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(patientService, 'deleteInsurance').and.returnValue(of(void 0));

      component.deleteInsuranceRecord(record);

      expect(patientService.deleteInsurance).toHaveBeenCalledWith(1, 1);
    });

    it('deleteInsuranceRecord() does not call deleteInsurance() when cancelled', () => {
      const record: Insurance = {
        InsuranceId: 1,
        PatientId: 1,
        InsurerName: 'Star Health',
        PolicyNumber: 'POL-123',
        GroupNumber: null,
        MemberId: 'MEM-456',
        EffectiveDate: '2025-01-01',
        TerminationDate: null,
      };
      spyOn(window, 'confirm').and.returnValue(false);
      spyOn(patientService, 'deleteInsurance').and.returnValue(of(void 0));

      component.deleteInsuranceRecord(record);

      expect(patientService.deleteInsurance).not.toHaveBeenCalled();
    });

    it('deleteInsuranceRecord() sets insuranceError on failure', (done) => {
      const record: Insurance = {
        InsuranceId: 999,
        PatientId: 1,
        InsurerName: 'Star Health',
        PolicyNumber: 'POL-123',
        GroupNumber: null,
        MemberId: 'MEM-456',
        EffectiveDate: '2025-01-01',
        TerminationDate: null,
      };
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(patientService, 'deleteInsurance').and.returnValue(
        throwError(() => ({ error: { detail: 'Insurance not found' } })),
      );

      component.deleteInsuranceRecord(record);

      setTimeout(() => {
        expect(component.insuranceError()).toBe('Insurance not found');
        done();
      }, 100);
    });
  });

  describe('Template — Insurance Section', () => {
    it('renders insurance record when it exists', () => {
      patientService.selected.set(mockPatientWithInsurance());
      fixture.detectChanges();

      const insuranceText = fixture.nativeElement.textContent;
      expect(insuranceText).toContain('Star Health');
      expect(insuranceText).toContain('POL-123');
      expect(insuranceText).toContain('MEM-456');
      expect(insuranceText).toContain('2025-01-01');
    });

    it('shows "No insurance on record" when empty', () => {
      patientService.selected.set(mockPatientWithoutInsurance());
      fixture.detectChanges();

      const emptyMessages: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.empty'));
      expect(emptyMessages.some((el) => el.textContent?.includes('No insurance on record'))).toBeTruthy();
    });

    it('renders Edit and Delete buttons for existing record', () => {
      patientService.selected.set(mockPatientWithInsurance());
      fixture.detectChanges();

      const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
      expect(buttons.some((b) => b.textContent?.includes('Edit'))).toBeTruthy();
      expect(buttons.some((b) => b.textContent?.includes('Delete'))).toBeTruthy();
    });

    it('shows inline form when showInsuranceForm is true', () => {
      component.showInsuranceForm.set(true);
      fixture.detectChanges();

      const form = fixture.nativeElement.querySelector('.insurance-form');
      expect(form).toBeTruthy();
    });

    it('hides inline form when showInsuranceForm is false', () => {
      component.showInsuranceForm.set(false);
      fixture.detectChanges();

      const form = fixture.nativeElement.querySelector('.insurance-form');
      expect(form).toBeNull();
    });

    it('displays error message when insuranceError is set', () => {
      component.showInsuranceForm.set(true);
      component.insuranceError.set('Test error message');
      fixture.detectChanges();

      const errorEl = fixture.nativeElement.querySelector('.error');
      expect(errorEl?.textContent).toContain('Test error message');
    });

    it('does not display error when insuranceError is null', () => {
      component.showInsuranceForm.set(true);
      component.insuranceError.set(null);
      fixture.detectChanges();

      const errorEl = fixture.nativeElement.querySelector('.error');
      expect(errorEl).toBeNull();
    });

    it('submit button shows "Add Insurance" when not editing', () => {
      component.showInsuranceForm.set(true);
      component.editingInsurance.set(null);
      fixture.detectChanges();

      const submitBtn = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(submitBtn?.textContent).toContain('Add Insurance');
    });

    it('submit button shows "Save Changes" when editing', () => {
      component.showInsuranceForm.set(true);
      component.editingInsurance.set({
        InsuranceId: 1,
        PatientId: 1,
        InsurerName: 'Star Health',
        PolicyNumber: 'POL-123',
        GroupNumber: null,
        MemberId: 'MEM-456',
        EffectiveDate: '2025-01-01',
        TerminationDate: null,
      });
      fixture.detectChanges();

      const submitBtn = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(submitBtn?.textContent).toContain('Save Changes');
    });

    it('submit button shows "Saving..." when submitting', () => {
      component.showInsuranceForm.set(true);
      component.insuranceSubmitting.set(true);
      fixture.detectChanges();

      const submitBtn = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(submitBtn?.textContent).toContain('Saving...');
    });
  });

  describe('One Insurance Per Patient Constraint', () => {
    it('only allows one insurance record to be displayed', () => {
      const patientWith2 = {
        ...mockPatientWithInsurance(),
        insurance: [
          ...mockPatientWithInsurance().insurance,
          {
            InsuranceId: 2,
            PatientId: 1,
            InsurerName: 'Secondary Insurer',
            PolicyNumber: 'POL-456',
            GroupNumber: null,
            MemberId: 'MEM-789',
            EffectiveDate: '2025-06-01',
            TerminationDate: null,
          },
        ],
      };
      patientService.selected.set(patientWith2);
      fixture.detectChanges();

      const listItems = fixture.nativeElement.querySelectorAll('.insurance-actions');
      expect(listItems.length).toBe(1);
    });

    it('uses first insurance record if multiple exist', () => {
      const patientWith2 = {
        ...mockPatientWithInsurance(),
        insurance: [
          mockPatientWithInsurance().insurance[0],
          {
            InsuranceId: 2,
            PatientId: 1,
            InsurerName: 'Secondary Insurer',
            PolicyNumber: 'POL-456',
            GroupNumber: null,
            MemberId: 'MEM-789',
            EffectiveDate: '2025-06-01',
            TerminationDate: null,
          },
        ],
      };
      patientService.selected.set(patientWith2);
      fixture.detectChanges();

      const insuranceText = fixture.nativeElement.textContent;
      expect(insuranceText).toContain('Star Health');
      expect(insuranceText).not.toContain('Secondary Insurer');
    });
  });
});
