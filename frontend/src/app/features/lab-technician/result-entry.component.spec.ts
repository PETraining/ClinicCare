import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { ResultEntryComponent } from './result-entry.component';
import { LabTechService } from '../../core/services/lab-tech.service';
import { LabOrder, OrderTest } from '../../core/models/lab.model';

function makeOrder(): LabOrder {
  return {
    order_id: 1,
    patient_id: 1,
    referral_id: null,
    ordered_by: 1,
    ordered_date: '2026-01-01',
    priority: 'routine',
    clinical_indication: null,
    status: 'processing',
    order_tests: [],
  };
}

function makeOrderTest(min: number | null, max: number | null): OrderTest {
  return {
    order_test_id: 1,
    order_id: 1,
    test_id: 20,
    order_status: 'in_progress',
    test: {
      test_id: 20,
      test_code: 'T20',
      test_name: 'Numeric Test',
      sample_type: 'blood',
      processing_time_days: 1,
      normal_range_min: min,
      normal_range_max: max,
      unit: 'mg/dL',
    },
  };
}

describe('ResultEntryComponent', () => {
  let labTechStub: any;

  beforeEach(() => {
    labTechStub = {
      staffId: signal<number | null>(7),
      submitResult: jasmine.createSpy('submitResult'),
    };
    TestBed.configureTestingModule({
      imports: [ResultEntryComponent],
      providers: [{ provide: LabTechService, useValue: labTechStub }],
    });
  });

  function createNumeric(min = 10, max = 20) {
    const fixture = TestBed.createComponent(ResultEntryComponent);
    const comp = fixture.componentInstance;
    comp.order = makeOrder();
    comp.orderTest = makeOrderTest(min, max);
    fixture.detectChanges();
    return { fixture, comp };
  }

  function createNonNumeric() {
    const fixture = TestBed.createComponent(ResultEntryComponent);
    const comp = fixture.componentInstance;
    comp.order = makeOrder();
    comp.orderTest = makeOrderTest(null, null);
    fixture.detectChanges();
    return { fixture, comp };
  }

  it('should create', () => {
    const { comp } = createNumeric();
    expect(comp).toBeTruthy();
  });

  it('isNumericTest is true only when both range bounds are present', () => {
    expect(createNumeric().comp.isNumericTest()).toBeTrue();
    expect(createNonNumeric().comp.isNumericTest()).toBeFalse();
  });

  it('preview is unknown for non-numeric tests', () => {
    const { comp } = createNonNumeric();
    comp.resultValue.set('anything');
    expect(comp.preview()).toBe('unknown');
  });

  it('preview is unknown for empty or NaN numeric values', () => {
    const { comp } = createNumeric();
    expect(comp.preview()).toBe('unknown');
    comp.resultValue.set('   ');
    expect(comp.preview()).toBe('unknown');
    comp.resultValue.set('abc');
    expect(comp.preview()).toBe('unknown');
  });

  it('preview is normal when within range', () => {
    const { comp } = createNumeric(10, 20);
    comp.resultValue.set('15');
    expect(comp.preview()).toBe('normal');
  });

  it('preview is abnormal when outside range but not extreme', () => {
    const { comp } = createNumeric(10, 20);
    comp.resultValue.set('25');
    expect(comp.preview()).toBe('abnormal');
    comp.resultValue.set('5');
    expect(comp.preview()).toBe('abnormal');
  });

  it('preview is critical when far outside range', () => {
    const { comp } = createNumeric(10, 20);
    comp.resultValue.set('31'); // > 20 * 1.5
    expect(comp.preview()).toBe('critical');
    comp.resultValue.set('4'); // < 10 * 0.5
    expect(comp.preview()).toBe('critical');
  });

  it('submit sets formError when result value is blank', () => {
    const { comp } = createNumeric();
    comp.submit();
    expect(comp.formError()).toBe('Please enter a result value.');
    expect(labTechStub.submitResult).not.toHaveBeenCalled();
  });

  it('submit sends numeric payload without manual abnormal/critical flags', () => {
    labTechStub.submitResult.and.returnValue(of({} as any));
    const { comp } = createNumeric();
    comp.resultValue.set('15');
    comp.notes.set('note');
    comp.submit();
    expect(labTechStub.submitResult).toHaveBeenCalledWith(1, 20, {
      result_value: '15',
      notes: 'note',
      submitted_by: 7,
    });
  });

  it('submit sends manual payload with abnormal/critical flags for non-numeric tests', () => {
    labTechStub.submitResult.and.returnValue(of({} as any));
    const { comp } = createNonNumeric();
    comp.resultValue.set('positive');
    comp.manualAbnormal.set(true);
    comp.manualCritical.set(false);
    comp.submit();
    expect(labTechStub.submitResult).toHaveBeenCalledWith(1, 20, {
      result_value: 'positive',
      notes: undefined,
      is_abnormal: true,
      is_critical: false,
      submitted_by: 7,
    });
  });

  it('submit success clears submitting flag and emits submitted', () => {
    labTechStub.submitResult.and.returnValue(of({} as any));
    const { comp } = createNumeric();
    const emitted = jasmine.createSpy('submitted');
    comp.submitted.subscribe(emitted);
    comp.resultValue.set('15');
    comp.submit();
    expect(comp.submitting()).toBeFalse();
    expect(emitted).toHaveBeenCalled();
  });

  it('submit error sets formError from backend detail and resets submitting', () => {
    labTechStub.submitResult.and.returnValue(throwError(() => ({ error: { detail: 'bad value' } })));
    const { comp } = createNumeric();
    comp.resultValue.set('15');
    comp.submit();
    expect(comp.formError()).toBe('bad value');
    expect(comp.submitting()).toBeFalse();
  });

  it('submit error sets default formError when backend detail missing', () => {
    labTechStub.submitResult.and.returnValue(throwError(() => ({})));
    const { comp } = createNumeric();
    comp.resultValue.set('15');
    comp.submit();
    expect(comp.formError()).toBe('Failed to submit result.');
  });

  it('close emits closed event', () => {
    const { comp } = createNumeric();
    const emitted = jasmine.createSpy('closed');
    comp.closed.subscribe(emitted);
    comp.close();
    expect(emitted).toHaveBeenCalled();
  });
});
