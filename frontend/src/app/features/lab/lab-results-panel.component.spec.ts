import { TestBed, fakeAsync, tick } from '@angular/core/testing';

import { LabResultsPanelComponent } from './lab-results-panel.component';
import { LabService } from '../../core/services/lab.service';
import { signal } from '@angular/core';

describe('LabResultsPanelComponent', () => {
  let labServiceStub: any;

  beforeEach(() => {
    labServiceStub = {
      orders: signal([]),
      loadOrders: jasmine.createSpy('loadOrders'),
    };
    TestBed.configureTestingModule({
      imports: [LabResultsPanelComponent],
      providers: [{ provide: LabService, useValue: labServiceStub }],
    });
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(LabResultsPanelComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('loads orders by referral_id when referralId input is defined, taking priority over patientId', fakeAsync(() => {
    const fixture = TestBed.createComponent(LabResultsPanelComponent);
    fixture.componentRef.setInput('patientId', 3);
    fixture.componentRef.setInput('referralId', 9);
    fixture.detectChanges();
    tick();
    expect(labServiceStub.loadOrders).toHaveBeenCalledWith({ referral_id: 9 });
  }));

  it('loads orders by patient_id when only patientId input is defined', fakeAsync(() => {
    const fixture = TestBed.createComponent(LabResultsPanelComponent);
    fixture.componentRef.setInput('patientId', 4);
    fixture.detectChanges();
    tick();
    expect(labServiceStub.loadOrders).toHaveBeenCalledWith({ patient_id: 4 });
  }));

  it('does not load orders when neither input is defined', fakeAsync(() => {
    const fixture = TestBed.createComponent(LabResultsPanelComponent);
    fixture.detectChanges();
    tick();
    expect(labServiceStub.loadOrders).not.toHaveBeenCalled();
  }));
});
