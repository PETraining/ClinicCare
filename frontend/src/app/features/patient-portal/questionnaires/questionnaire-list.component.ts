import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { QuestionnaireService } from '../../../core/services/questionnaire.service';

@Component({
  selector: 'app-questionnaire-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './questionnaire-list.component.html',
  styleUrl: './questionnaire-list.component.css',
})
export class QuestionnaireListComponent implements OnInit {
  protected qService = inject(QuestionnaireService);

  ngOnInit(): void {
    this.qService.loadMyQuestionnaires();
  }
}
