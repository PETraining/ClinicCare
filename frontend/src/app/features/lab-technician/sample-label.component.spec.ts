import { TestBed } from '@angular/core/testing';

import { SampleLabelComponent } from './sample-label.component';
import { LabOrder, LabSample } from '../../core/models/lab.model';

function makeOrder(): LabOrder {
  return {
    order_id: 1,
    patient_id: 1,
    referral_id: null,
    ordered_by: 1,
    ordered_date: '2026-01-01',
    priority: 'routine',
    clinical_indication: null,
    status: 'collected',
    order_tests: [],
  };
}

function makeSample(overrides: Partial<LabSample> = {}): LabSample {
  return {
    sample_id: 55,
    order_id: 1,
    sample_type: 'blood',
    collection_date: '2026-01-02T10:00:00Z',
    collected_by: 3,
    sample_label: 'LBL-001',
    status: 'collected',
    ...overrides,
  };
}

describe('SampleLabelComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SampleLabelComponent] });
  });

  function create(sample = makeSample()) {
    const fixture = TestBed.createComponent(SampleLabelComponent);
    const comp = fixture.componentInstance;
    comp.order = makeOrder();
    comp.sample = sample;
    fixture.detectChanges();
    return { fixture, comp };
  }

  it('should create', () => {
    const { comp } = create();
    expect(comp).toBeTruthy();
  });

  it('printTargetId returns an id based on the sample id', () => {
    const { comp } = create();
    expect(comp.printTargetId()).toBe('label-55');
  });

  it('barWidths computes widths from the sample label characters', () => {
    const { comp } = create(makeSample({ sample_label: 'AB' }));
    const widths = comp.barWidths();
    expect(widths.length).toBe(2);
    widths.forEach((w) => expect(w).toBeGreaterThanOrEqual(1));
  });

  it('barWidths falls back to sample id digits when label is missing', () => {
    const { comp } = create(makeSample({ sample_label: null }));
    const widths = comp.barWidths();
    expect(widths.length).toBe(String(55).length);
  });

  it('print opens a window, writes label markup, and triggers print', () => {
    const { comp } = create();
    const fakeWin = {
      document: { write: jasmine.createSpy('write'), close: jasmine.createSpy('close') },
      focus: jasmine.createSpy('focus'),
      print: jasmine.createSpy('print'),
      close: jasmine.createSpy('close'),
    };
    spyOn(window, 'open').and.returnValue(fakeWin as any);
    comp.print();
    expect(fakeWin.document.write).toHaveBeenCalled();
    expect(fakeWin.document.close).toHaveBeenCalled();
    expect(fakeWin.focus).toHaveBeenCalled();
    expect(fakeWin.print).toHaveBeenCalled();
    expect(fakeWin.close).toHaveBeenCalled();
  });

  it('print does nothing when window.open returns null (popup blocked)', () => {
    const { comp } = create();
    spyOn(window, 'open').and.returnValue(null);
    expect(() => comp.print()).not.toThrow();
  });
});
