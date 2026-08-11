import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { QuestionnaireDetail } from '../../core/models/questionnaire.model';
import { QuestionnaireService } from '../../core/services/questionnaire.service';

@Component({
  selector: 'app-questionnaire-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './questionnaire-form.component.html',
  styleUrl: './questionnaire-form.component.css',
})
export class QuestionnaireFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private questionnaireService = inject(QuestionnaireService);

  questionnaire = signal<QuestionnaireDetail | null>(null);
  answers: Record<number, string> = {};
  submitting = signal(false);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.questionnaireService.getQuestionnaire(id).subscribe((qn) => {
      this.questionnaire.set(qn);
      for (const q of qn.questions) {
        this.answers[q.QuestionId] = q.ExistingAnswer ?? '';
      }
    });
  }

  submit(): void {
    const qn = this.questionnaire();
    if (!qn) {
      return;
    }

    const payload = qn.questions.map((q) => ({
      question_id: q.QuestionId,
      answer: this.answers[q.QuestionId] ?? '',
    }));

    this.submitting.set(true);
    this.questionnaireService.submitAnswers(qn.QuestionnaireId, payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/questionnaires']);
      },
      error: () => {
        this.submitting.set(false);
      },
    });
  }
}
