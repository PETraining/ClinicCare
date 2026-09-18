import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';

import { API_BASE_URL } from '../config';
import { Questionnaire, QuestionnaireResponse } from '../models/questionnaire.model';

@Injectable({ providedIn: 'root' })
export class QuestionnaireService {
  private http = inject(HttpClient);
  private base = `${API_BASE_URL}/questionnaires`;

  questionnaires = signal<Questionnaire[]>([]);
  responses = signal<QuestionnaireResponse[]>([]);

  listQuestionnaires() {
    return this.http.get<Questionnaire[]>(this.base);
  }

  loadQuestionnaires(): void {
    this.listQuestionnaires().subscribe((r) => this.questionnaires.set(r));
  }

  submitResponse(payload: {
    QuestionnaireId: number;
    PatientId: number;
    ReferralId?: number | null;
    AnswersJson: string;
  }) {
    return this.http.post<QuestionnaireResponse>(`${this.base}-responses`, payload);
  }

  loadResponsesByPatient(patientId: number): void {
    this.http
      .get<QuestionnaireResponse[]>(`${this.base}-responses`, { params: { patientId } })
      .subscribe((r) => this.responses.set(r));
  }
}
