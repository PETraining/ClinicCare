import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { PatientQuestionnairesComponent } from './patient-questionnaires.component';
import { PatientAuthService } from '../../../core/services/patient-auth.service';
import { API_BASE_URL } from '../../../core/config';

const MOCK_QS = [
  {
    QuestionnaireId: 1, PatientId: 5, Type: 'Health', Title: 'Q1',
    Status: 'Pending', CreatedAt: '2025-01-01T00:00:00',
  },
  {
    QuestionnaireId: 2, PatientId: 5, Type: 'Allergy', Title: 'Q2',
    Status: 'Completed', CreatedAt: '2025-01-02T00:00:00', CompletedAt: '2025-01-03T00:00:00',
  },
];

describe('PatientQuestionnairesComponent', () => {
  let fixture: ComponentFixture<PatientQuestionnairesComponent>;
  let component: PatientQuestionnairesComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientQuestionnairesComponent, HttpClientTestingModule],
      providers: [
        { provide: PatientAuthService, useValue: { currentPatient: () => ({ patientId: 5, patientName: 'Test' }) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientQuestionnairesComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    spyOn(window, 'alert');
  });

  afterEach(() => httpMock.verify());

  function flushQs(): void {
    httpMock.expectOne(r => r.url === `${API_BASE_URL}/questionnaires`).flush(MOCK_QS);
  }

  it('fetches questionnaires scoped to the current patient on init', fakeAsync(() => {
    fixture.detectChanges();

    const req = httpMock.expectOne(r => r.url === `${API_BASE_URL}/questionnaires`);
    expect(req.request.params.get('patientId')).toBe('5');
    req.flush(MOCK_QS);
    tick();

    expect(component.questionnaires.length).toBe(2);
    expect(component.loading).toBeFalse();
  }));

  it('getPendingCount() returns the count of Pending questionnaires', fakeAsync(() => {
    fixture.detectChanges();
    flushQs();
    tick();

    expect(component.getPendingCount()).toBe(1);
  }));

  it('getCompletedCount() returns the count of Completed questionnaires', fakeAsync(() => {
    fixture.detectChanges();
    flushQs();
    tick();

    expect(component.getCompletedCount()).toBe(1);
  }));

  it('completeQuestionnaire() sends PATCH with Status Completed and a CompletedAt timestamp', fakeAsync(() => {
    fixture.detectChanges();
    flushQs();
    tick();

    component.completeQuestionnaire({ ...MOCK_QS[0] } as any);

    const patchReq = httpMock.expectOne(`${API_BASE_URL}/questionnaires/1`);
    expect(patchReq.request.method).toBe('PATCH');
    expect(patchReq.request.body.Status).toBe('Completed');
    expect(patchReq.request.body.CompletedAt).toBeTruthy();
    patchReq.flush({ ...MOCK_QS[0], Status: 'Completed', CompletedAt: new Date().toISOString() });
    tick();
  }));

  it('updates the questionnaire entry in the local list after a successful PATCH', fakeAsync(() => {
    fixture.detectChanges();
    flushQs();
    tick();

    const updated = { ...MOCK_QS[0], Status: 'Completed', CompletedAt: new Date().toISOString() };
    component.completeQuestionnaire({ ...MOCK_QS[0] } as any);
    httpMock.expectOne(`${API_BASE_URL}/questionnaires/1`).flush(updated);
    tick();

    expect(component.questionnaires.find(q => q.QuestionnaireId === 1)?.Status).toBe('Completed');
  }));

  it('sets error message and clears loading flag on HTTP failure', fakeAsync(() => {
    fixture.detectChanges();
    httpMock.expectOne(r => r.url === `${API_BASE_URL}/questionnaires`).error(new ProgressEvent('error'));
    tick();

    expect(component.error).toBeTruthy();
    expect(component.loading).toBeFalse();
  }));

  describe('when there is no patient session', () => {
    beforeEach(async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [PatientQuestionnairesComponent, HttpClientTestingModule],
        providers: [
          { provide: PatientAuthService, useValue: { currentPatient: () => null } },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(PatientQuestionnairesComponent);
      component = fixture.componentInstance;
      httpMock = TestBed.inject(HttpTestingController);
    });

    it('makes no HTTP request on init', () => {
      fixture.detectChanges();
      const requests = httpMock.match(r => r.url.includes('questionnaires'));
      expect(requests.length).toBe(0);
    });
  });
});
