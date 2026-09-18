import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-patient-questionnaires',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="questionnaires-container">
      <h2>Health Questionnaires</h2>
      <p>Complete health questionnaires and assessments here.</p>
      <div class="placeholder">
        <p>No questionnaires available</p>
      </div>
    </div>
  `,
  styles: [`
    .questionnaires-container {
      padding: 20px;
      background: #f5f5f5;
      border-radius: 4px;
    }
    .placeholder {
      margin-top: 20px;
      padding: 20px;
      text-align: center;
      background: white;
      border-radius: 4px;
    }
  `]
})
export class PatientQuestionnairesComponent {}
