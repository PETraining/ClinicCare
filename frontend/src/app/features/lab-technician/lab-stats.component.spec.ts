import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { LabStatsComponent } from './lab-stats.component';
import { LabTechService } from '../../core/services/lab-tech.service';
import { LabOrder, LabStats } from '../../core/models/lab.model';

function makeOrder(days: number[]): LabOrder {
  return {
    order_id: 1,
    patient_id: 1,
    referral_id: null,
    ordered_by: 1,
    ordered_date: '2026-01-01',
    priority: 'routine',
    clinical_indication: null,
    status: 'processing',
    order_tests: days.map((d, i) => ({
      order_test_id: i,
      order_id: 1,
      test_id: i,
      order_status: 'in_progress',
      test: {
        test_id: i,
        test_code: `T${i}`,
        test_name: `Test ${i}`,
        sample_type: 'blood',
        processing_time_days: d,
      },
    })),
  };
}

describe('LabStatsComponent', () => {
  let labTechStub: any;

  beforeEach(() => {
    labTechStub = {
      orders: signal<LabOrder[]>([]),
      stats: signal<LabStats | null>(null),
      loadStats: jasmine.createSpy('loadStats'),
      loadOrders: jasmine.createSpy('loadOrders'),
    };
    TestBed.configureTestingModule({
      imports: [LabStatsComponent],
      providers: [{ provide: LabTechService, useValue: labTechStub }],
    });
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(LabStatsComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('ngOnInit loads stats and orders', () => {
    const fixture = TestBed.createComponent(LabStatsComponent);
    fixture.componentInstance.ngOnInit();
    expect(labTechStub.loadStats).toHaveBeenCalled();
    expect(labTechStub.loadOrders).toHaveBeenCalled();
  });

  it('avgProcessingDays returns null when there are no order tests', () => {
    const fixture = TestBed.createComponent(LabStatsComponent);
    expect(fixture.componentInstance.avgProcessingDays()).toBeNull();
  });

  it('avgProcessingDays computes the average of all order_tests processing times', () => {
    labTechStub.orders.set([makeOrder([2, 4]), makeOrder([6])]);
    const fixture = TestBed.createComponent(LabStatsComponent);
    expect(fixture.componentInstance.avgProcessingDays()).toBe(4);
  });

  it('barWidth returns 0 when total is 0, else a rounded percentage', () => {
    const fixture = TestBed.createComponent(LabStatsComponent);
    const comp = fixture.componentInstance;
    expect(comp.barWidth(5, 0)).toBe(0);
    expect(comp.barWidth(1, 3)).toBe(33);
    expect(comp.barWidth(2, 4)).toBe(50);
  });
});
