import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { LabTestCatalogComponent } from './lab-test-catalog.component';
import { LabService } from '../../core/services/lab.service';
import { LabTest } from '../../core/models/lab.model';

describe('LabTestCatalogComponent', () => {
  let labServiceStub: any;

  beforeEach(() => {
    labServiceStub = {
      tests: signal<LabTest[]>([]),
      loadTests: jasmine.createSpy('loadTests'),
    };
    TestBed.configureTestingModule({
      imports: [LabTestCatalogComponent],
      providers: [{ provide: LabService, useValue: labServiceStub }],
    });
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(LabTestCatalogComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('ngOnInit loads the test catalog', () => {
    const fixture = TestBed.createComponent(LabTestCatalogComponent);
    fixture.componentInstance.ngOnInit();
    expect(labServiceStub.loadTests).toHaveBeenCalledWith();
  });

  it('specialties computed returns distinct sorted non-empty specialties', () => {
    labServiceStub.tests.set([
      { test_id: 1, test_code: 'A', test_name: 'A', sample_type: 'blood', processing_time_days: 1, specialty: 'Cardiology' },
      { test_id: 2, test_code: 'B', test_name: 'B', sample_type: 'blood', processing_time_days: 1, specialty: 'Cardiology' },
      { test_id: 3, test_code: 'C', test_name: 'C', sample_type: 'blood', processing_time_days: 1, specialty: 'Allergy' },
      { test_id: 4, test_code: 'D', test_name: 'D', sample_type: 'blood', processing_time_days: 1, specialty: null },
    ] as LabTest[]);
    const fixture = TestBed.createComponent(LabTestCatalogComponent);
    expect(fixture.componentInstance.specialties()).toEqual(['Allergy', 'Cardiology']);
  });

  it('applyFilter calls loadTests with trimmed filter or undefined when empty', () => {
    const fixture = TestBed.createComponent(LabTestCatalogComponent);
    const comp = fixture.componentInstance;
    comp.specialtyFilter.set('Cardiology');
    comp.applyFilter();
    expect(labServiceStub.loadTests).toHaveBeenCalledWith('Cardiology');

    labServiceStub.loadTests.calls.reset();
    comp.specialtyFilter.set('');
    comp.applyFilter();
    expect(labServiceStub.loadTests).toHaveBeenCalledWith(undefined);
  });
});
