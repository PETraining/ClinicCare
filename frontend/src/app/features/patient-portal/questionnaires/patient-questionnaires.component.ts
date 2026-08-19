import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../../core/config';
import { PatientAuthService } from '../../../core/services/patient-auth.service';

interface Questionnaire {
  QuestionnaireId: number;
  PatientId: number;
  ReferralId?: number;
  Type: string;
  Title: string;
  Description?: string;
  CreatedAt: string;
  CompletedAt?: string;
  Status: string;
}

@Component({
  selector: 'app-patient-questionnaires',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-questionnaires.component.html',
  styleUrl: './patient-questionnaires.component.css',
})
export class PatientQuestionnairesComponent implements OnInit {
  private http = inject(HttpClient);
  private patientAuth = inject(PatientAuthService);

  questionnaires: Questionnaire[] = [];
  loading = true;
  error = '';
  selectedQuestionnaire: Questionnaire | null = null;

  ngOnInit(): void {
    const patientId = this.patientAuth.currentPatient()?.patientId;
    if (!patientId) return;

    this.http
      .get<Questionnaire[]>(`${API_BASE_URL}/questionnaires`, {
        params: { patientId: patientId.toString() },
      })
      .subscribe({
        next: (qs) => {
          this.questionnaires = qs;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load questionnaires';
          this.loading = false;
        },
      });
  }

  selectQuestionnaire(q: Questionnaire): void {
    this.selectedQuestionnaire = q;
  }

  closeQuestionnaire(): void {
    this.selectedQuestionnaire = null;
  }

  completeQuestionnaire(q: Questionnaire): void {
    const patientId = this.patientAuth.currentPatient()?.patientId;
    if (!patientId) return;

    const body = {
      Status: 'Completed',
      CompletedAt: new Date().toISOString(),
    };

    this.http
      .patch<Questionnaire>(
        `${API_BASE_URL}/questionnaires/${q.QuestionnaireId}`,
        body
      )
      .subscribe({
        next: (updated) => {
          const index = this.questionnaires.findIndex(
            (x) => x.QuestionnaireId === q.QuestionnaireId
          );
          if (index >= 0) {
            this.questionnaires[index] = updated;
          }
          this.selectedQuestionnaire = null;
          alert('Questionnaire submitted successfully!');
        },
        error: (err) => {
          alert('Error submitting questionnaire');
        },
      });
  }

  getPendingCount(): number {
    return this.questionnaires.filter((q) => q.Status === 'Pending').length;
  }

  getCompletedCount(): number {
    return this.questionnaires.filter((q) => q.Status === 'Completed').length;
  }
}
