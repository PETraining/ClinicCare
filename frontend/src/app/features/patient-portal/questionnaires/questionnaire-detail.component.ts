import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { QuestionnaireService } from '../../../core/services/questionnaire.service';
import { PatientAuthService } from '../../../core/services/patient-auth.service';
import { ReferralService } from '../../../core/services/referral.service';
import { Questionnaire, Question } from '../../../core/models/questionnaire.model';
import { Referral } from '../../../core/models/referral.model';

@Component({
  selector: 'app-questionnaire-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './questionnaire-detail.component.html',
  styleUrl: './questionnaire-detail.component.css',
})
export class QuestionnaireDetailComponent implements OnInit {
  private questionnaireService = inject(QuestionnaireService);
  private patientAuthService = inject(PatientAuthService);
  private referralService = inject(ReferralService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  questionnaire: Questionnaire | null = null;
  questions: Question[] = [];
  answers: { [key: string]: string | boolean } = {};
  selectedReferralId: number | null = null;
  referrals: Referral[] = [];

  isLoading = true;
  isSubmitting = false;
  error = '';
  submitSuccess = false;

  patientId = 0;

  ngOnInit(): void {
    const current = this.patientAuthService.currentPatient();
    if (current) {
      this.patientId = current.patientId;
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.loadQuestionnaire(parseInt(id, 10));
        this.loadReferrals();
      }
    }
  }

  loadQuestionnaire(questionnaireId: number): void {
    this.questionnaireService.listQuestionnaires().subscribe({
      next: (questionnaires) => {
        const q = questionnaires.find(
          (qq) => qq.QuestionnaireId === questionnaireId
        );
        if (q) {
          this.questionnaire = q;
          try {
            this.questions = JSON.parse(q.QuestionsJson);
            this.initializeAnswers();
          } catch (err) {
            console.error('Failed to parse questions', err);
            this.error = 'Failed to load questionnaire';
          }
        } else {
          this.error = 'Questionnaire not found';
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load questionnaire', err);
        this.error = 'Failed to load questionnaire';
        this.isLoading = false;
      },
    });
  }

  loadReferrals(): void {
    this.referralService.listByPatient(this.patientId).subscribe({
      next: (referrals) => {
        this.referrals = referrals;
      },
      error: (err) => {
        console.error('Failed to load referrals', err);
      },
    });
  }

  initializeAnswers(): void {
    this.questions.forEach((q) => {
      this.answers[q.id] = q.type === 'checkbox' ? false : '';
    });
  }

  onSubmit(): void {
    if (!this.questionnaire) return;

    this.isSubmitting = true;
    this.error = '';

    const payload = {
      QuestionnaireId: this.questionnaire.QuestionnaireId,
      PatientId: this.patientId,
      ReferralId: this.selectedReferralId || undefined,
      AnswersJson: JSON.stringify(this.answers),
    };

    this.questionnaireService.submitResponse(payload).subscribe({
      next: () => {
        this.submitSuccess = true;
        this.isSubmitting = false;
        this.questionnaireService.loadResponsesByPatient(this.patientId);
        setTimeout(() => {
          this.router.navigate(['../questionnaires'], { relativeTo: this.route });
        }, 2000);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.error = err?.error?.detail || 'Failed to submit questionnaire';
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['../questionnaires'], { relativeTo: this.route });
  }
}
