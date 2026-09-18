import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { QuestionnaireService } from '../../../core/services/questionnaire.service';
import { Questionnaire } from '../../../core/models/questionnaire.model';

@Component({
  selector: 'app-questionnaire-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './questionnaire-list.component.html',
  styleUrl: './questionnaire-list.component.css',
})
export class QuestionnaireListComponent implements OnInit {
  private questionnaireService = inject(QuestionnaireService);

  questionnaires: Questionnaire[] = [];
  isLoading = true;
  error = '';

  ngOnInit(): void {
    this.questionnaireService.listQuestionnaires().subscribe({
      next: (questionnaires) => {
        this.questionnaires = questionnaires;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load questionnaires', err);
        this.error = 'Failed to load questionnaires. Please try again.';
        this.isLoading = false;
      },
    });
  }
}
