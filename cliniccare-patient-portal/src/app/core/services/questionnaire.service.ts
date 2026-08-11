import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';

import { API_BASE_URL } from '../config';
import { AnswerSubmit, QuestionnaireDetail, QuestionnaireSummary } from '../models/questionnaire.model';

@Injectable({ providedIn: 'root' })
export class QuestionnaireService {
  private http = inject(HttpClient);
  private base = `${API_BASE_URL}/questionnaires`;

  questionnaires = signal<QuestionnaireSummary[]>([]);

  loadMyQuestionnaires(): void {
    this.http.get<QuestionnaireSummary[]>(`${this.base}/me`).subscribe((r) => this.questionnaires.set(r));
  }

  getQuestionnaire(id: number) {
    return this.http.get<QuestionnaireDetail>(`${this.base}/me/${id}`);
  }

  submitAnswers(id: number, answers: AnswerSubmit[]) {
    return this.http.post(`${this.base}/${id}/submit`, answers);
  }
}
