import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { DocumentsPanelComponent } from './documents-panel.component';
import { DocumentService } from '../../core/services/document.service';
import { ClinicalDocument } from '../../core/models/document.model';

describe('DocumentsPanelComponent', () => {
  let documentServiceStub: { documents: ReturnType<typeof signal<ClinicalDocument[]>>; loadByPatient: jasmine.Spy; loadByReferral: jasmine.Spy };

  beforeEach(async () => {
    documentServiceStub = {
      documents: signal<ClinicalDocument[]>([]),
      loadByPatient: jasmine.createSpy('loadByPatient'),
      loadByReferral: jasmine.createSpy('loadByReferral'),
    };

    await TestBed.configureTestingModule({
      imports: [DocumentsPanelComponent],
      providers: [{ provide: DocumentService, useValue: documentServiceStub }],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(DocumentsPanelComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('loads nothing when neither input is set', () => {
    const fixture = TestBed.createComponent(DocumentsPanelComponent);
    fixture.detectChanges();
    expect(documentServiceStub.loadByPatient).not.toHaveBeenCalled();
    expect(documentServiceStub.loadByReferral).not.toHaveBeenCalled();
  });

  it('loads by patient when only patientId is set', () => {
    const fixture = TestBed.createComponent(DocumentsPanelComponent);
    fixture.componentRef.setInput('patientId', 5);
    fixture.detectChanges();
    expect(documentServiceStub.loadByPatient).toHaveBeenCalledWith(5);
    expect(documentServiceStub.loadByReferral).not.toHaveBeenCalled();
  });

  it('loads by referral when referralId is set, taking priority over patientId', () => {
    const fixture = TestBed.createComponent(DocumentsPanelComponent);
    fixture.componentRef.setInput('patientId', 5);
    fixture.componentRef.setInput('referralId', 9);
    fixture.detectChanges();
    expect(documentServiceStub.loadByReferral).toHaveBeenCalledWith(9);
    expect(documentServiceStub.loadByPatient).not.toHaveBeenCalled();
  });

  it('renders documents from the service', () => {
    documentServiceStub.documents.set([
      { DocumentId: 1, PatientId: 1, ReferralId: null, Type: 'Lab Report', UploadedDate: '2024-01-01', FileName: 'a.pdf' },
    ]);
    const fixture = TestBed.createComponent(DocumentsPanelComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('tbody tr').length).toBe(1);
    expect(compiled.textContent).toContain('a.pdf');
  });

  it('renders empty row when there are no documents', () => {
    const fixture = TestBed.createComponent(DocumentsPanelComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No documents found.');
  });
});
