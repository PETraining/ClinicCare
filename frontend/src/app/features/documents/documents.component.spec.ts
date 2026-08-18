import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { DocumentsComponent } from './documents.component';
import { DocumentService } from '../../core/services/document.service';
import { signal } from '@angular/core';
import { ClinicalDocument } from '../../core/models/document.model';

function configure(queryParams: Record<string, string>, documentServiceStub: unknown) {
  return TestBed.configureTestingModule({
    imports: [DocumentsComponent],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          queryParamMap: of(convertToParamMap(queryParams)),
        },
      },
      { provide: DocumentService, useValue: documentServiceStub },
    ],
  }).compileComponents();
}

describe('DocumentsComponent', () => {
  let documentServiceStub: { documents: ReturnType<typeof signal<ClinicalDocument[]>>; loadByPatient: jasmine.Spy; loadByReferral: jasmine.Spy };

  beforeEach(() => {
    documentServiceStub = {
      documents: signal<ClinicalDocument[]>([]),
      loadByPatient: jasmine.createSpy('loadByPatient'),
      loadByReferral: jasmine.createSpy('loadByReferral'),
    };
  });

  it('should create with no query params', async () => {
    await configure({}, documentServiceStub);
    const fixture = TestBed.createComponent(DocumentsComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.componentInstance.patientId()).toBeUndefined();
    expect(fixture.componentInstance.referralId()).toBeUndefined();
  });

  it('parses patientId from query params', async () => {
    await configure({ patientId: '42' }, documentServiceStub);
    const fixture = TestBed.createComponent(DocumentsComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.patientId()).toBe(42);
    expect(fixture.componentInstance.referralId()).toBeUndefined();
  });

  it('parses referralId from query params', async () => {
    await configure({ referralId: '7' }, documentServiceStub);
    const fixture = TestBed.createComponent(DocumentsComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.referralId()).toBe(7);
    expect(fixture.componentInstance.patientId()).toBeUndefined();
  });

  it('parses both patientId and referralId when present', async () => {
    await configure({ patientId: '3', referralId: '9' }, documentServiceStub);
    const fixture = TestBed.createComponent(DocumentsComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.patientId()).toBe(3);
    expect(fixture.componentInstance.referralId()).toBe(9);
  });

  it('shows the empty message when neither id is present', async () => {
    await configure({}, documentServiceStub);
    const fixture = TestBed.createComponent(DocumentsComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.empty')).toBeTruthy();
    expect(compiled.querySelector('app-documents-panel')).toBeFalsy();
  });

  it('shows the patient subtitle and panel when patientId present', async () => {
    await configure({ patientId: '42' }, documentServiceStub);
    const fixture = TestBed.createComponent(DocumentsComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.subtitle')?.textContent).toContain('patient #42');
    expect(compiled.querySelector('app-documents-panel')).toBeTruthy();
  });

  it('shows the referral subtitle when referralId present', async () => {
    await configure({ referralId: '7' }, documentServiceStub);
    const fixture = TestBed.createComponent(DocumentsComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.subtitle')?.textContent).toContain('referral #7');
  });
});
